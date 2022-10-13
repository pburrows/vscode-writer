import { VswProjectConfig } from './../models';
import { CancellationToken, commands, ExtensionContext, TreeDataProvider, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from "vscode";
import { FileHelpers } from "../helpers/file-helpers";
import * as fs from 'fs';
import path = require("path");
import { ConfigurationHelper } from "../helpers/config-helper";
import { LanguageHelpers } from '../helpers/language-helpers';

export function activate(context: ExtensionContext, rootPath: string) {

    const statsProvider = new StatisticsViewProvider(rootPath);

    context.subscriptions.push(
        window.registerWebviewViewProvider("vs-writer.statistics.statisticsView", statsProvider)
    );
}

export class StatisticsViewProvider implements WebviewViewProvider {
    view?: WebviewView;
    workspaceRoot;
    constructor(rootPath: string) {
        this.workspaceRoot = rootPath;
    }
    resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        const statsHtml = this.calculateStatistics();
        webviewView.webview.html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
        </head>
        <body>
            ${statsHtml}
        </body>
        </html>`;
    }

    calculateStatistics() {
        const projectConfig = ConfigurationHelper.getProjectConfig(this.workspaceRoot);
        const files = FileHelpers.getContentFilesInFolder(projectConfig, this.workspaceRoot);
        let folders = FileHelpers.getFoldersInFolder(projectConfig, this.workspaceRoot);
        for (const folder of folders) {
            this.getProjectFiles(projectConfig, folder, files);
        }

        let htmlRows = '';
        let totalSentences = 0;
        let totalWords = 0;
        for (const file of files) {
            const text = FileHelpers.safeReadFile(file, undefined, false);
            const stats = LanguageHelpers.documentStatistics(text);
            const relativePath = file.replace(this.workspaceRoot, '').replace('\\', '/');
            htmlRows += `<tr><td>${relativePath}</td><td>${stats.sentences}</td><td>${stats.words}</td></tr>`;
            totalSentences += stats.sentences;
            totalWords += stats.words;
        }

        return `<table>
            <tr><th>Document</th><th>Sentences</th><th>Words</th></tr>
            <tr><td>TOTAL</td><td>${totalSentences}</td><td>${totalWords}</td></tr>
            ${htmlRows}
        </table>`;

    }

    getProjectFiles(config: VswProjectConfig, folderPath: string, files: string[]) {
        const moreFiles = FileHelpers.getContentFilesInFolder(config, folderPath);
        files.push(...moreFiles);
        const folders = FileHelpers.getFoldersInFolder(config, folderPath);
        for (const folder of folders) {
            this.getProjectFiles(config, folder, files);
        }
    }

}