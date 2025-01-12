"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const securityTreeProvider_1 = require("./securityTreeProvider");
// Add these constants at the top of the file after imports
const highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    isWholeLine: true,
});
/**
 * Gets security patterns from VS Code settings
 * @returns Array of security patterns
 */
function getSecurityPatterns() {
    const config = vscode.workspace.getConfiguration('securityScanner');
    return config.get('patterns') || [];
}
/**
 * Updates security patterns in VS Code settings
 * @param patterns - Array of security patterns to save
 */
function updateSecurityPatterns(patterns) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = vscode.workspace.getConfiguration('securityScanner');
        yield config.update('patterns', patterns, vscode.ConfigurationTarget.Global);
    });
}
/**
 * Shows an input box to collect pattern information from the user
 * @param pattern - Optional existing pattern to edit
 * @returns A new or updated security pattern, or undefined if cancelled
 */
function showPatternInputBox(pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = yield vscode.window.showInputBox({
            prompt: 'Enter pattern name',
            value: (pattern === null || pattern === void 0 ? void 0 : pattern.name) || '',
            validateInput: value => value ? null : 'Pattern name is required'
        });
        if (!name)
            return undefined;
        const regexPattern = yield vscode.window.showInputBox({
            prompt: 'Enter regex pattern',
            value: (pattern === null || pattern === void 0 ? void 0 : pattern.pattern) || '',
            validateInput: value => {
                try {
                    new RegExp(value);
                    return null;
                }
                catch (_a) {
                    return 'Invalid regex pattern';
                }
            }
        });
        if (!regexPattern)
            return undefined;
        const description = yield vscode.window.showInputBox({
            prompt: 'Enter pattern description',
            value: (pattern === null || pattern === void 0 ? void 0 : pattern.description) || '',
            validateInput: value => value ? null : 'Description is required'
        });
        if (!description)
            return undefined;
        return { name, pattern: regexPattern, description };
    });
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
function activate(context) {
    const treeProvider = new securityTreeProvider_1.SecurityTreeProvider();
    vscode.window.registerTreeDataProvider('securityScanner', treeProvider);
    // Register pattern management commands
    context.subscriptions.push(vscode.commands.registerCommand('security-scanner.addPattern', () => __awaiter(this, void 0, void 0, function* () {
        const newPattern = yield showPatternInputBox();
        if (newPattern) {
            const patterns = getSecurityPatterns();
            patterns.push(newPattern);
            yield updateSecurityPatterns(patterns);
            vscode.window.showInformationMessage(`Added security pattern: ${newPattern.name}`);
        }
    })), vscode.commands.registerCommand('security-scanner.editPattern', () => __awaiter(this, void 0, void 0, function* () {
        const patterns = getSecurityPatterns();
        const selected = yield vscode.window.showQuickPick(patterns.map(p => ({ label: p.name, pattern: p })), { placeHolder: 'Select pattern to edit' });
        if (selected) {
            const updatedPattern = yield showPatternInputBox(selected.pattern);
            if (updatedPattern) {
                const index = patterns.findIndex(p => p.name === selected.pattern.name);
                patterns[index] = updatedPattern;
                yield updateSecurityPatterns(patterns);
                vscode.window.showInformationMessage(`Updated security pattern: ${updatedPattern.name}`);
            }
        }
    })), vscode.commands.registerCommand('security-scanner.removePattern', () => __awaiter(this, void 0, void 0, function* () {
        const patterns = getSecurityPatterns();
        const selected = yield vscode.window.showQuickPick(patterns.map(p => ({ label: p.name, pattern: p })), { placeHolder: 'Select pattern to remove' });
        if (selected) {
            const updatedPatterns = patterns.filter(p => p.name !== selected.pattern.name);
            yield updateSecurityPatterns(updatedPatterns);
            vscode.window.showInformationMessage(`Removed security pattern: ${selected.pattern.name}`);
        }
    })));
    /**
     * Opens a file and highlights the line containing a security finding.
     * Creates a temporary decoration to highlight the vulnerable line and
     * automatically removes the highlight when the document is closed.
     *
     * @param finding - The security finding to display
     */
    vscode.commands.registerCommand('security-scanner.openFile', (finding) => {
        vscode.workspace.openTextDocument(finding.file).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                // Highlight the line
                const range = new vscode.Range(finding.line - 1, 0, finding.line - 1, finding.match.length);
                editor.selection = new vscode.Selection(range.start, range.end);
                editor.revealRange(range);
                // Add the decoration to highlight the entire line
                const decorationRange = new vscode.Range(finding.line - 1, 0, finding.line - 1, Number.MAX_VALUE);
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
            const finding = findings.find(f => f.file === document.uri.fsPath &&
                f.line === lineNumber);
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
    let disposable = vscode.commands.registerCommand('security-scanner.scanCode', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const securityPatterns = getSecurityPatterns();
            if (securityPatterns.length === 0) {
                vscode.window.showWarningMessage('No security patterns configured. Add patterns in settings first.');
                return;
            }
            // Get all text documents
            const files = yield vscode.workspace.findFiles('**/*', '**/node_modules/**');
            let findings = [];
            // Scan each file
            for (const file of files) {
                const document = yield vscode.workspace.openTextDocument(file);
                const text = document.getText();
                const lines = text.split('\n');
                securityPatterns.forEach(({ name, pattern, description }) => {
                    const regex = new RegExp(pattern);
                    lines.forEach((line, index) => {
                        if (regex.test(line)) {
                            findings.push(new securityTreeProvider_1.SecurityFinding(name, file.fsPath, index + 1, line.trim(), description));
                        }
                    });
                });
            }
            // Update tree view with findings
            treeProvider.refresh(findings);
            if (findings.length === 0) {
                vscode.window.showInformationMessage('No security patterns found.');
            }
            else {
                vscode.window.showInformationMessage(`Found ${findings.length} security pattern matches.`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Error scanning code: ' + error);
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
/**
 * Handles extension deactivation.
 * Cleans up resources by disposing the highlight decoration.
 */
function deactivate() {
    // Clean up the decoration type
    highlightDecoration.dispose();
}
exports.deactivate = deactivate;
