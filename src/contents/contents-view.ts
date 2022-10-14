import { VswFileSettings, VswFolderSetting } from './../models';

import { CancellationToken, Command, commands, Event, EventEmitter, ExtensionContext, ProviderResult, Range, Selection, TextDocument, TextDocumentChangeEvent, ThemeColor, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window, workspace } from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import matter = require("gray-matter");
import { VswFileType } from "../models";
import { ConfigurationHelper } from "../helpers/config-helper";
import { FileHelpers } from "../helpers/file-helpers";
import { Document } from 'wink-nlp';

export function activate(context: ExtensionContext, rootPath: string) {
    const contentsView = new ContentsViewProvider(rootPath);
    window.registerTreeDataProvider('vs-writer.contents.contentsView', contentsView);
}

export class ContentsViewProvider implements TreeDataProvider<ContentsViewItem> {
    workspaceRoot;
    private _onDidChangeTreeData: EventEmitter<ContentsViewItem | undefined | void> = new EventEmitter<ContentsViewItem | undefined | void>();
    readonly onDidChangeTreeData: Event<ContentsViewItem | undefined | void> = this._onDidChangeTreeData.event;
    constructor(rootPath: string) {
        this.workspaceRoot = rootPath;
        workspace.onDidSaveTextDocument(e => this.documentSaved(e));
    }

    documentSaved(doc: TextDocument) {
        this._onDidChangeTreeData.fire();

    }

    getTreeItem(element: ContentsViewItem): TreeItem | Thenable<TreeItem> {
        return element;
    }
    getChildren(element?: ContentsViewItem | undefined): ProviderResult<ContentsViewItem[]> {
        if (!element && !this.workspaceRoot) {
            return [new ContentsViewItem('Open a folder to see writing project contents.', TreeItemCollapsibleState.None)];
        }

        let itemPath = this.workspaceRoot;
        if (element) {
            // load top level folders
            itemPath = element.path;
        }

        return this.getChildContentItems(itemPath);
    }
    // getParent?(element: ContentsViewItem): ProviderResult<ContentsViewItem> {
    //     throw new Error("Method not implemented.");
    // }

    resolveTreeItem?(item: TreeItem, element: ContentsViewItem, token: CancellationToken): ProviderResult<TreeItem> {
        // todo: use this method to do more expensive calculations on the tree item (such as word count?)
        return item;
    }

    private getChildContentItems(itemPath: string): ContentsViewItem[] {
        const result: ContentsViewItem[] = [];

        if (!FileHelpers.isFolder(itemPath)) {
            return [];
        }

        // load folder config
        // const folderConfig = ConfigurationHelper.getFolderConfig(this.workspaceRoot, itemPath);
        const projectConfig = ConfigurationHelper.getProjectConfig(this.workspaceRoot);

        // const folderItems = fs.readdirSync(itemPath);
        const folders = FileHelpers.getFoldersInFolder(projectConfig, itemPath);
        const files = FileHelpers.getProjectFileItemsInFolder(itemPath);
        let count = 0;

        if (folders) {
            for (const folder of folders) {
                count += 1;
                const folderConfig = ConfigurationHelper.getFolderConfig(this.workspaceRoot, folder);
                result.push(ContentsViewItem.fromFolderInfo(folderConfig, count, folder, TreeItemCollapsibleState.Collapsed));
            }
        }
        if (files) {
            for (const file of files) {
                count += 1;
                const fileConfig = ConfigurationHelper.getFileConfiguration(file);
                result.push(ContentsViewItem.fromFileInfo(fileConfig, count, file, TreeItemCollapsibleState.None));
            }
        }

        // for (const item of folderItems) {
        //     const childPath = path.join(itemPath, item);
        //     const info = fs.lstatSync(childPath);
        //     count += 1;
        //     if (info.isFile()) {
        //         const childFileParsed = path.parse(childPath);
        //         if (['.md', '.markdown'].indexOf(childFileParsed.ext) > -1) {
        //             const fileConfig = ConfigurationHelper.getFileConfiguration(childPath);
        //             result.push(ContentsViewItem.fromFileInfo(fileConfig, count, childPath, TreeItemCollapsibleState.None));
        //         }
        //     }
        //     if (info.isDirectory()) {

        //         const folderConfig = ConfigurationHelper.getFolderConfig(this.workspaceRoot, childPath);
        //         result.push(ContentsViewItem.fromFolderInfo(folderConfig, count, childPath, TreeItemCollapsibleState.Collapsed));
        //     }
        // }

        return result;
    }
}

function getThemeColorFromColorName(name: string): ThemeColor {
    switch (name) {
        case 'red':
            return new ThemeColor('charts.red');
        case 'blue':
            return new ThemeColor('charts.blue');
        case 'yellow':
            return new ThemeColor('charts.yellow');
        case 'orange':
            return new ThemeColor('charts.orange');
        case 'green':
            return new ThemeColor('charts.green');
        case 'purple':
            return new ThemeColor('charts.purple');
        default:
            return new ThemeColor('charts.foreground');
    }
}

export class ContentsViewItem extends TreeItem implements ContentItemInfo {
    type: VswFileType = VswFileType.section;
    order: number = 0;
    path: string = '';
    name: string;
    pov?: string | undefined;

    static fromFileInfo(fileInfo: VswFileSettings, order: number, filePath: string, collapsibleState: TreeItemCollapsibleState): ContentsViewItem {
        let name = fileInfo.name;
        if (!name) {
            const pathInfo = path.parse(filePath);
            name = pathInfo.name;
        }
        const item = new ContentsViewItem(name, collapsibleState);
        item.type = fileInfo.type ?? VswFileType.section;
        item.order = order;
        item.path = filePath;
        item.pov = fileInfo.pov;
        // item.command = {title: 'open', command: 'vs-writer.contents.openFile'};
        const iconColor = getThemeColorFromColorName(fileInfo.flag ?? '');
        item.iconPath = new ThemeIcon('note', iconColor);
        switch (item.type) {
            case VswFileType.chapter:
                item.iconPath = new ThemeIcon('output', iconColor);
                break;
            case VswFileType.section:
                item.iconPath = new ThemeIcon('note', iconColor);
                break;
            case VswFileType.part:
                item.iconPath = new ThemeIcon('notebook', iconColor);
                break;
            case VswFileType.frontMatter:
            case VswFileType.backMatter:
            case VswFileType.folder:
            default:
                item.iconPath = new ThemeIcon('file', iconColor);
                break;
        }
        return item;
    }

    static fromFolderInfo(folderInfo: VswFolderSetting, order: number, folderPath: string, collapsibleState: TreeItemCollapsibleState): ContentsViewItem {
        const item = new ContentsViewItem(folderInfo.name, collapsibleState);
        item.type = VswFileType.folder;
        item.order = order;
        item.path = folderPath;
        item.iconPath = new ThemeIcon('folder', getThemeColorFromColorName(''));
        return item;
    }

    constructor(name: string, collapsibleState: TreeItemCollapsibleState) {
        super(`${name}`, collapsibleState);

        this.name = name;

    }

}

export interface ContentItemInfo {
    type: VswFileType;
    name?: string;
    order: number;
    path: string;
    pov?: string;
}

