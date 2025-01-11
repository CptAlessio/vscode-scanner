import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityTreeProvider, SecurityFinding } from './securityTreeProvider';

// Add this type definition at the top
interface SecurityPattern {
    name: string;
    pattern: string;
    description: string;
}

// Add these constants at the top of the file after imports
const highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.2)', // Light red background
    isWholeLine: true,
});

export function activate(context: vscode.ExtensionContext) {
    const treeProvider = new SecurityTreeProvider();
    vscode.window.registerTreeDataProvider('securityScanner', treeProvider);

    // Register command to open files from tree view
    context.subscriptions.push(
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
        })
    );

    // Add this new code after treeProvider initialization
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

    // Modify the scan command to include descriptions
    let disposable = vscode.commands.registerCommand('security-scanner.scanCode', async () => {
        try {
            // Read patterns and descriptions
            const patternsPath = path.join(context.extensionPath, 'src', 'patterns.txt');
            const descriptionsPath = path.join(context.extensionPath, 'src', 'hover-descriptions.txt');
            
            const patterns = fs.readFileSync(patternsPath, 'utf8')
                .split('\n')
                .filter(line => line.trim() !== '');
                
            const descriptions = fs.readFileSync(descriptionsPath, 'utf8')
                .split('\n')
                .filter(line => line.trim() !== '')
                .reduce((acc, line) => {
                    const [name, desc] = line.split('=');
                    acc[name.trim()] = desc.trim();
                    return acc;
                }, {} as Record<string, string>);

            const securityPatterns: SecurityPattern[] = patterns.map(line => {
                const [name, pattern] = line.split('=');
                return {
                    name: name.trim(),
                    pattern: pattern.trim(),
                    description: descriptions[name.trim()] || 'Security issue detected'
                };
            });

            // Get all text documents
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
            
            let findings: SecurityFinding[] = [];

            // Scan each file
            for (const file of files) {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();
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
            }

            // Update tree view with findings
            treeProvider.refresh(findings);

            if (findings.length === 0) {
                vscode.window.showInformationMessage('No security patterns found.');
            }

        } catch (error) {
            vscode.window.showErrorMessage('Error scanning code: ' + error);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Clean up the decoration type
    highlightDecoration.dispose();
} 