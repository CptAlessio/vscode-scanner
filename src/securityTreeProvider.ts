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
    }
}

/**
 * Represents a file containing security findings in the tree view.
 * Provides UI elements and commands for interacting with the finding.
 */
export class SecurityFile extends vscode.TreeItem {
    description?: string;
    tooltip?: string;
    command?: vscode.Command;

    /**
     * Creates a new SecurityFile instance.
     * @param finding - The security finding associated with this file
     */
    constructor(
        public readonly finding: SecurityFinding
    ) {
        super(path.basename(finding.file));
        this.description = `Line ${finding.line}`;
        this.tooltip = finding.match;
        this.command = {
            command: 'security-scanner.openFile',
            title: 'Open File',
            arguments: [finding]
        };
    }
}

/**
 * Provides the data for the security findings tree view.
 * Manages the hierarchical display of security findings in VS Code's tree view.
 */
export class SecurityTreeProvider implements vscode.TreeDataProvider<SecurityFinding> {
    private findings: SecurityFinding[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<SecurityFinding | undefined> = new vscode.EventEmitter<SecurityFinding | undefined>();
    
    /**
     * Event that fires when the tree data changes, triggering a refresh of the view
     */
    readonly onDidChangeTreeData: vscode.Event<SecurityFinding | undefined> = this._onDidChangeTreeData.event;

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
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the tree item for a given element.
     * @param element - The security finding to convert to a tree item
     * @returns The tree item representation of the security finding
     */
    getTreeItem(element: SecurityFinding): vscode.TreeItem {
        return element;
    }

    /**
     * Gets the children for a given element in the tree.
     * At root level, returns all findings. For other levels, returns an empty array.
     * @param element - Optional parent element to get children for
     * @returns Promise resolving to an array of child findings
     */
    getChildren(element?: SecurityFinding): Promise<SecurityFinding[]> {
        if (!element) {
            // Root level - show patterns
            return Promise.resolve(this.findings);
        }

        return Promise.resolve([]);
    }
} 