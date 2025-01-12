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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityTreeProvider = exports.SecurityFile = exports.SecurityPattern = exports.SecurityFinding = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Represents a security finding in the codebase.
 * Contains information about the location and nature of a potential security issue.
 */
class SecurityFinding {
    /**
     * Creates a new SecurityFinding instance.
     * @param name - The identifier or type of the security issue
     * @param file - The absolute path to the file containing the issue
     * @param line - The line number where the issue was found
     * @param match - The actual code snippet that triggered the finding
     * @param description - Optional detailed description of the security issue
     */
    constructor(name, file, line, match, description) {
        this.name = name;
        this.file = file;
        this.line = line;
        this.match = match;
        this.description = description;
    }
}
exports.SecurityFinding = SecurityFinding;
/**
 * Represents a group of security findings of the same type in the tree view.
 * Acts as a parent node in the tree view that can be collapsed/expanded.
 */
class SecurityPattern extends vscode.TreeItem {
    /**
     * Creates a new SecurityPattern instance.
     * @param label - The name of the security pattern category
     * @param findings - Array of security findings that match this pattern
     */
    constructor(label, findings) {
        super(`${label} (${findings.length})`, findings.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.findings = findings;
        this.contextValue = 'pattern';
        this.tooltip = `${findings.length} finding(s) for pattern: ${label}`;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'shield.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'shield.svg')
        };
    }
}
exports.SecurityPattern = SecurityPattern;
/**
 * Represents a file containing security findings in the tree view.
 * Provides UI elements and commands for interacting with the finding.
 */
class SecurityFile extends vscode.TreeItem {
    /**
     * Creates a new SecurityFile instance.
     * @param finding - The security finding associated with this file
     */
    constructor(finding) {
        super(path.basename(finding.file));
        this.finding = finding;
        this.description = `Line ${finding.line}`;
        this.tooltip = `${finding.match}\n\n${finding.description || ''}`;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'warning.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'warning.svg')
        };
        this.contextValue = 'finding';
        this.command = {
            command: 'security-scanner.openFile',
            title: 'Open File',
            arguments: [finding]
        };
        this.resourceUri = vscode.Uri.file(finding.file);
    }
}
exports.SecurityFile = SecurityFile;
/**
 * Provides the data for the security findings tree view.
 * Manages the hierarchical display of security findings in VS Code's tree view.
 */
class SecurityTreeProvider {
    constructor() {
        this.findings = [];
        this._onDidChangeTreeData = new vscode.EventEmitter();
        /**
         * Event that fires when the tree data changes, triggering a refresh of the view
         */
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    /**
     * Returns all current security findings.
     * @returns Array of all security findings currently displayed in the tree
     */
    getFindings() {
        return this.findings;
    }
    /**
     * Updates the tree view with new findings.
     * @param findings - New array of security findings to display
     */
    refresh(findings) {
        this.findings = findings;
        this._onDidChangeTreeData.fire(undefined);
    }
    /**
     * Gets the tree item for a given element.
     * @param element - The tree item to return
     * @returns The tree item as is
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Gets the children for a given element in the tree.
     * At root level, returns pattern groups. For patterns, returns files with findings.
     * @param element - Optional parent element to get children for
     * @returns Promise resolving to an array of tree items
     */
    getChildren(element) {
        if (!element) {
            // Root level - group findings by pattern
            const patternGroups = new Map();
            this.findings.forEach(finding => {
                const findings = patternGroups.get(finding.name) || [];
                findings.push(finding);
                patternGroups.set(finding.name, findings);
            });
            const patterns = Array.from(patternGroups.entries()).map(([name, findings]) => new SecurityPattern(name, findings));
            return Promise.resolve(patterns);
        }
        if (element instanceof SecurityPattern) {
            // Pattern level - show files with findings
            return Promise.resolve(element.findings.map(finding => new SecurityFile(finding)));
        }
        return Promise.resolve([]);
    }
}
exports.SecurityTreeProvider = SecurityTreeProvider;
