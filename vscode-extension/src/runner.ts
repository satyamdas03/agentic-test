import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

let outputChannel: vscode.OutputChannel;

export function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('agentic-test');
    }
    return outputChannel;
}

export function runAllTests() {
    runCommand('npx agentic-test run');
}

export function runTestAtCursor(testName: string, uri: vscode.Uri) {
    // Use filter flag to run specific test
    const filter = testName.replace(/"/g, '\\"');
    runCommand(`npx agentic-test run --filter "${filter}"`);
}

function runCommand(command: string) {
    const channel = getOutputChannel();
    channel.show(true);
    channel.appendLine(`\n> ${command}\n`);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    // Execute in the integrated terminal/child process
    cp.exec(command, { cwd: workspaceFolder }, (err, stdout, stderr) => {
        if (stdout) channel.append(stdout);
        if (stderr) channel.append(stderr);

        if (err) {
            vscode.window.showErrorMessage(`Tests failed! See output panel for details.`);
            channel.appendLine(`\n[Process exited with error]`);
        } else {
            vscode.window.showInformationMessage(`Tests passed successfully!`);
            channel.appendLine(`\n[Process completed successfully]`);
        }
    });
}
