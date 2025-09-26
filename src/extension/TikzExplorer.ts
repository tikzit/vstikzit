import * as vscode from "vscode";

export class TikzExplorer implements vscode.TreeDataProvider<string> {

    getTreeItem(element: string): vscode.TreeItem {
        return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);
    }

    getChildren(): Thenable<string[]> {
        // Return empty array for a blank view
        return Promise.resolve([]);
    }

    refresh(): void {
        // Empty refresh method for consistency
    }
}