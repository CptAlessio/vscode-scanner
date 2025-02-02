/*
 * Copyright (c) 2025 Alessio Marziali
 * Licensed under the MIT License.
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents a security finding in the codebase.
 * Contains information about the location and nature of a potential security issue.
 */
export class SecurityFinding {
    /**
     * Creates a new SecurityFinding instance.
     * @param name - The identifier or type of the security issue
     * @param file - The absolute path to the file containing the issue
     * @param line - The line number where the issue was found
     * @param match - The actual code snippet that triggered the finding
     * @param description - Optional detailed description of the security issue
     */
    constructor(
        public readonly name: string,
        public readonly file: string,
        public readonly line: number,
        public readonly match: string,
        public readonly description?: string
    ) {}
}

/**
 * Represents a group of security findings of the same type in the tree view.
 * Acts as a parent node in the tree view that can be collapsed/expanded.
 */
export class SecurityPattern extends vscode.TreeItem {
    /**
     * Creates a new SecurityPattern instance.
     * @param label - The name of the security pattern category
     * @param findings - Array of security findings that match this pattern
     */
    constructor(
        public readonly label: string,
        public readonly findings: SecurityFinding[]
    ) {
        super(
            `${label} (${findings.length})`,
            findings.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
        this.contextValue = 'pattern';
        this.tooltip = `${findings.length} finding(s) for pattern: ${label}`;
        this.iconPath = {
            light: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'light', 'shield.svg')),
            dark: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'dark', 'shield.svg'))
        };
    }
}

/**
 * Represents a file containing security findings in the tree view.
 * Provides UI elements and commands for interacting with the finding.
 */
export class SecurityFile extends vscode.TreeItem {
    /**
     * Creates a new SecurityFile instance.
     * @param finding - The security finding associated with this file
     */
    constructor(
        public readonly finding: SecurityFinding
    ) {
        super(path.basename(finding.file));
        this.description = `Line ${finding.line}`;
        this.tooltip = `${finding.match}\n\n${finding.description || ''}`;
        this.iconPath = {
            light: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'light', 'warning.svg')),
            dark: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'dark', 'warning.svg'))
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

/**
 * Provides the data for the security findings tree view.
 * Manages the hierarchical display of security findings in VS Code's tree view.
 */
export class SecurityTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private findings: SecurityFinding[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    
    /**
     * Event that fires when the tree data changes, triggering a refresh of the view
     */
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    /**
     * Returns all current security findings.
     * @returns Array of all security findings currently displayed in the tree
     */
    getFindings(): SecurityFinding[] {
        return this.findings;
    }

    /**
     * Updates the tree view with new findings.
     * @param findings - New array of security findings to display
     */
    refresh(findings: SecurityFinding[]): void {
        this.findings = findings;
        this._onDidChangeTreeData.fire(undefined);
    }

    /**
     * Gets the tree item for a given element.
     * @param element - The tree item to return
     * @returns The tree item as is
     */
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets the children for a given element in the tree.
     * At root level, returns pattern groups. For patterns, returns files with findings.
     * @param element - Optional parent element to get children for
     * @returns Promise resolving to an array of tree items
     */
    getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level - group findings by pattern
            const patternGroups = new Map<string, SecurityFinding[]>();
            this.findings.forEach(finding => {
                const findings = patternGroups.get(finding.name) || [];
                findings.push(finding);
                patternGroups.set(finding.name, findings);
            });

            const patterns = Array.from(patternGroups.entries()).map(
                ([name, findings]) => new SecurityPattern(name, findings)
            );

            return Promise.resolve(patterns);
        }

        if (element instanceof SecurityPattern) {
            // Pattern level - show files with findings
            return Promise.resolve(
                element.findings.map(finding => new SecurityFile(finding))
            );
        }

        return Promise.resolve([]);
    }
} 