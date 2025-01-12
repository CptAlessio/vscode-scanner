import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityTreeProvider, SecurityFinding } from './securityTreeProvider';

/**
 * Represents a security pattern with a name, regex pattern, and description.
 */
interface SecurityPattern {
    /** The name of the security pattern */
    name: string;
    /** The regex pattern to match against code */
    pattern: string;
    /** Description of the security issue and potential remediation */
    description: string;
}

// Add these constants at the top of the file after imports
const highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.2)', // Light red background
    isWholeLine: true,
});

/**
 * Gets security patterns from VS Code settings
 * @returns Array of security patterns
 */
function getSecurityPatterns(): SecurityPattern[] {
    const config = vscode.workspace.getConfiguration('securityScanner');
    return config.get<SecurityPattern[]>('patterns') || [];
}

/**
 * Updates security patterns in VS Code settings
 * @param patterns - Array of security patterns to save
 */
async function updateSecurityPatterns(patterns: SecurityPattern[]): Promise<void> {
    const config = vscode.workspace.getConfiguration('securityScanner');
    await config.update('patterns', patterns, vscode.ConfigurationTarget.Global);
}

/**
 * Shows an input box to collect pattern information from the user
 * @param pattern - Optional existing pattern to edit
 * @returns A new or updated security pattern, or undefined if cancelled
 */
async function showPatternInputBox(pattern?: SecurityPattern): Promise<SecurityPattern | undefined> {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter pattern name',
        value: pattern?.name || '',
        validateInput: value => value ? null : 'Pattern name is required'
    });
    if (!name) return undefined;

    const regexPattern = await vscode.window.showInputBox({
        prompt: 'Enter regex pattern',
        value: pattern?.pattern || '',
        validateInput: value => {
            try {
                new RegExp(value);
                return null;
            } catch {
                return 'Invalid regex pattern';
            }
        }
    });
    if (!regexPattern) return undefined;

    const description = await vscode.window.showInputBox({
        prompt: 'Enter pattern description',
        value: pattern?.description || '',
        validateInput: value => value ? null : 'Description is required'
    });
    if (!description) return undefined;

    return { name, pattern: regexPattern, description };
}

/**
 * Activates the security scanner extension.
 * This is the main entry point of the extension that sets up:
 * - Tree view for security findings
 * - File opening and highlighting functionality
 * - Hover provider for security issues
 * - Code scanning command
 * - Pattern management commands
 * 
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    const treeProvider = new SecurityTreeProvider();
    vscode.window.registerTreeDataProvider('securityScanner', treeProvider);

    // Register pattern management commands
    context.subscriptions.push(
        vscode.commands.registerCommand('security-scanner.addPattern', async () => {
            const newPattern = await showPatternInputBox();
            if (newPattern) {
                const patterns = getSecurityPatterns();
                patterns.push(newPattern);
                await updateSecurityPatterns(patterns);
                vscode.window.showInformationMessage(`Added security pattern: ${newPattern.name}`);
            }
        }),

        vscode.commands.registerCommand('security-scanner.editPattern', async () => {
            const patterns = getSecurityPatterns();
            const selected = await vscode.window.showQuickPick(
                patterns.map(p => ({ label: p.name, pattern: p })),
                { placeHolder: 'Select pattern to edit' }
            );
            if (selected) {
                const updatedPattern = await showPatternInputBox(selected.pattern);
                if (updatedPattern) {
                    const index = patterns.findIndex(p => p.name === selected.pattern.name);
                    patterns[index] = updatedPattern;
                    await updateSecurityPatterns(patterns);
                    vscode.window.showInformationMessage(`Updated security pattern: ${updatedPattern.name}`);
                }
            }
        }),

        vscode.commands.registerCommand('security-scanner.removePattern', async () => {
            const patterns = getSecurityPatterns();
            const selected = await vscode.window.showQuickPick(
                patterns.map(p => ({ label: p.name, pattern: p })),
                { placeHolder: 'Select pattern to remove' }
            );
            if (selected) {
                const updatedPatterns = patterns.filter(p => p.name !== selected.pattern.name);
                await updateSecurityPatterns(updatedPatterns);
                vscode.window.showInformationMessage(`Removed security pattern: ${selected.pattern.name}`);
            }
        })
    );

    /**
     * Opens a file and highlights the line containing a security finding.
     * Creates a temporary decoration to highlight the vulnerable line and
     * automatically removes the highlight when the document is closed.
     * 
     * @param finding - The security finding to display
     */
    vscode.commands.registerCommand('security-scanner.openFile', (finding: SecurityFinding) => {
        vscode.workspace.openTextDocument(finding.file).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                // Highlight the line
                const range = new vscode.Range(
                    finding.line - 1, 0,
                    finding.line - 1, finding.match.length
                );
                editor.selection = new vscode.Selection(range.start, range.end);
                editor.revealRange(range);

                // Add the decoration to highlight the entire line
                const decorationRange = new vscode.Range(
                    finding.line - 1, 0,
                    finding.line - 1, Number.MAX_VALUE
                );
                editor.setDecorations(highlightDecoration, [decorationRange]);

                // Remove the decoration when the editor is closed
                const disposable = vscode.workspace.onDidCloseTextDocument(closedDoc => {
                    if (closedDoc.uri.toString() === doc.uri.toString()) {
                        editor.setDecorations(highlightDecoration, []);
                        disposable.dispose();
                    }
                });
            });
        });
    });

    /**
     * Provides hover information for security findings.
     * When hovering over a line with a security issue, displays
     * the description of the security concern.
     */
    const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file' }, {
        provideHover(document, position, token) {
            // Check if this position matches any of our findings
            const findings = treeProvider.getFindings();
            const lineNumber = position.line + 1;
            
            const finding = findings.find(f => 
                f.file === document.uri.fsPath && 
                f.line === lineNumber
            );

            if (finding) {
                const description = finding.description || 'Security issue detected';
                return new vscode.Hover(description);
            }
            return null;
        }
    });
    context.subscriptions.push(hoverProvider);

    /**
     * Scans workspace files for security patterns.
     * Gets patterns from VS Code settings,
     * searches through all workspace files (excluding node_modules),
     * and updates the tree view with any findings.
     */
    let disposable = vscode.commands.registerCommand('security-scanner.scanCode', async () => {
        try {
            const securityPatterns = getSecurityPatterns();
            
            if (securityPatterns.length === 0) {
                vscode.window.showWarningMessage('No security patterns configured. Add patterns in settings first.');
                return;
            }

            // Get all text documents
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
            
            let findings: SecurityFinding[] = [];
            let skippedFiles = 0;

            // Common binary file extensions to skip
            const binaryExtensions = new Set([
                '.dll', '.exe', '.obj', '.bin', '.cache', '.pdb',
                '.jpg', '.jpeg', '.png', '.gif', '.ico', '.webp',
                '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
                '.mp3', '.mp4', '.avi', '.mov', '.wmv',
                '.ttf', '.otf', '.woff', '.woff2',
                '.pyc', '.pyo', '.pyd',
                '.so', '.dylib',
                '.class'
            ]);

            // Scan each file
            for (const file of files) {
                try {
                    // Skip files with binary extensions
                    const extension = file.path.toLowerCase().split('.').pop();
                    if (extension && binaryExtensions.has('.' + extension)) {
                        skippedFiles++;
                        continue;
                    }

                    // Try to detect binary content
                    const document = await vscode.workspace.openTextDocument(file);
                    const text = document.getText();

                    // Simple binary detection: check for null bytes or high percentage of non-printable characters
                    const firstFewBytes = text.slice(0, 1000); // Check first 1000 characters
                    if (firstFewBytes.includes('\0') || isBinaryContent(firstFewBytes)) {
                        skippedFiles++;
                        continue;
                    }

                    const lines = text.split('\n');

                    securityPatterns.forEach(({ name, pattern, description }) => {
                        const regex = new RegExp(pattern);
                        lines.forEach((line, index) => {
                            if (regex.test(line)) {
                                findings.push(new SecurityFinding(
                                    name,
                                    file.fsPath,
                                    index + 1,
                                    line.trim(),
                                    description
                                ));
                            }
                        });
                    });
                } catch (error) {
                    // Log the error but continue scanning other files
                    console.log(`Error scanning file ${file.fsPath}: ${error}`);
                    skippedFiles++;
                }
            }

            // Update tree view with findings
            treeProvider.refresh(findings);

            // Show summary message
            if (findings.length === 0) {
                vscode.window.showInformationMessage(`No security patterns found. ${skippedFiles} files were skipped.`);
            } else {
                vscode.window.showInformationMessage(`Found ${findings.length} security pattern matches. ${skippedFiles} files were skipped.`);
            }

        } catch (error) {
            vscode.window.showErrorMessage('Error scanning code: ' + error);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Checks if content appears to be binary by looking at the ratio of non-printable characters
 * @param content - The content to check
 * @returns true if the content appears to be binary
 */
function isBinaryContent(content: string): boolean {
    let nonPrintable = 0;
    const sampleSize = Math.min(content.length, 1000);
    
    for (let i = 0; i < sampleSize; i++) {
        const charCode = content.charCodeAt(i);
        // Check for non-printable characters (excluding common whitespace)
        if ((charCode < 32 && ![9, 10, 13].includes(charCode)) || charCode === 0xFFFD) {
            nonPrintable++;
        }
    }

    // If more than 10% of characters are non-printable, consider it binary
    return (nonPrintable / sampleSize) > 0.1;
}

/**
 * Handles extension deactivation.
 * Cleans up resources by disposing the highlight decoration.
 */
export function deactivate() {
    // Clean up the decoration type
    highlightDecoration.dispose();
} 