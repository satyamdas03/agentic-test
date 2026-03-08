import * as vscode from 'vscode';
import { AgenticTestCodeLensProvider } from './codelens';
import { runTestAtCursor, runAllTests } from './runner';

export function activate(context: vscode.ExtensionContext) {
    console.log('agentic-test extension is now active!');

    // Register CodeLens Provider for .agent.test.ts files
    const docSelector = {
        language: 'typescript',
        scheme: 'file',
        pattern: '**/*.agent.test.{ts,js}'
    };

    const codeLensProvider = new AgenticTestCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(docSelector, codeLensProvider)
    );

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('agentic-test.runAll', () => runAllTests()),
        vscode.commands.registerCommand('agentic-test.runTest', (testName: string, uri: vscode.Uri) => runTestAtCursor(testName, uri))
    );
}

export function deactivate() { }
