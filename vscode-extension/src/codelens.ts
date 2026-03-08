import * as vscode from 'vscode';

/**
 * Provides "▶ Run Test" CodeLens above test() and describe() blocks.
 */
export class AgenticTestCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();

        // Regex to match `test('name'` or `describe('name'`
        const regex = /(test|describe)\s*\(\s*['"](.*?)['"]/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const line = document.positionAt(match.index).line;
            const range = new vscode.Range(line, 0, line, 0);

            const testName = match[2];

            // RUN command
            const runCmd: vscode.Command = {
                title: "▶ Run Agent Test",
                tooltip: "Run this test with agentic-test",
                command: "agentic-test.runTest",
                arguments: [testName, document.uri]
            };

            codeLenses.push(new vscode.CodeLens(range, runCmd));
        }

        return codeLenses;
    }
}
