// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { activate as activateStatistics } from './statistics/statistics-view';
import { activate as activateContents } from './contents/contents-view';
import {activate as activateFileWordCount} from './statistics/file-wordcount';
import { activate as activateYamlEditor } from './editors/yaml-editor';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let rootPath = '';
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-writer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-writer!');
	});

	context.subscriptions.push(disposable);

	activateContents(context, rootPath);
	activateStatistics(context, rootPath);
	activateFileWordCount(context);
	activateYamlEditor(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }
