import * as vscode from 'vscode';
import * as path from 'path';

export class SecurityFinding {
    constructor(
        public readonly name: string,
        public readonly file: string,
        public readonly line: number,
        public readonly match: string,
        public readonly description?: string
    ) {}
}

export class SecurityPattern extends vscode.TreeItem {
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

export class SecurityFile extends vscode.TreeItem {
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

export class SecurityTreeProvider implements vscode.TreeDataProvider<SecurityFinding> {
    private findings: SecurityFinding[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<SecurityFinding | undefined> = new vscode.EventEmitter<SecurityFinding | undefined>();
    readonly onDidChangeTreeData: vscode.Event<SecurityFinding | undefined> = this._onDidChangeTreeData.event;

    getFindings(): SecurityFinding[] {
        return this.findings;
    }

    refresh(findings: SecurityFinding[]): void {
        this.findings = findings;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SecurityFinding): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SecurityFinding): Thenable<SecurityFinding[]> {
        if (!element) {
            // Root level - show patterns
            return Promise.resolve(this.findings);
        }

        return Promise.resolve([]);
    }
} 