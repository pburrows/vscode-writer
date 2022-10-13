import { VswFileType } from './../models';
import path = require("path");
import { commands, ExtensionContext, Selection, TextDocument, Uri, window, workspace } from "vscode";
import { ContentsViewItem } from "../contents/contents-view";
import { ConfigurationHelper } from "../helpers/config-helper";
import { off } from 'process';

export function activate(context: ExtensionContext) {

    context.subscriptions.push(
        commands.registerCommand('vs-writer.editors.setSectionName', (args: any) => setYamlForItem(args, 'name')),
        commands.registerCommand('vs-writer.editors.setSectionPointOfView', (args: any) => setYamlForItem(args, 'pov')),
        commands.registerCommand('vs-writer.editors.setSectionType.Chapter', (args: any) => setYamlForItem(args, 'type', VswFileType.chapter)),
        commands.registerCommand('vs-writer.editors.setSectionType.Section', (args: any) => setYamlForItem(args, 'type', VswFileType.section)),
        commands.registerCommand('vs-writer.editors.setSectionType.Part', (args: any) => setYamlForItem(args, 'type', VswFileType.part)),
    );
}

async function setYamlForItem(item: ContentsViewItem, field: string, type?: VswFileType) {
    const uri = Uri.file(item.path);
    await window.showTextDocument(uri);
    let editor = window.activeTextEditor;
    if (!editor) {
        return;
    }

    const doc = editor.document;
    const config = ConfigurationHelper.getTextDocumentConfiguration(doc);
    switch (field) {
        case 'name':
            if (!config.name) {
                const pathInfo = path.parse(item.path);
                config.name = pathInfo.name;
            }
            break;
        case 'type':
            config.type = type;
            break;
        case 'pov':
            if (!config.pov) {
                config.pov = 'character name';
            }
            break;
        default:
            break;
    }

    await ConfigurationHelper.setTextDocumentConfiguration(doc, config);

    if (field !== 'type') {
        const sel = getYamlValueSelection(doc, field + ': ');
        if (sel) {
            editor.selection = sel;
        }
    }
}


async function renameItem(item: ContentsViewItem) {
    // const config = ConfigurationHelper.getFileConfiguration(item.path);


    const uri = Uri.file(item.path);
    await window.showTextDocument(uri);
    let editor = window.activeTextEditor;
    if (!editor) {
        return;
    }
    const doc = editor.document;
    const config = ConfigurationHelper.getTextDocumentConfiguration(doc);
    if (!config.name) {
        const pathInfo = path.parse(item.path);
        config.name = pathInfo.name;
        await ConfigurationHelper.setTextDocumentConfiguration(doc, config);
    }

    const sel = getYamlValueSelection(doc, 'name: ');
    if (sel) {
        editor.selection = sel;
    }
}

function getYamlValueSelection(doc: TextDocument, fieldName: string) {
    let insideYaml = false;
    let sel;
    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i);
        if (line.text === '---') {
            if (insideYaml) {
                insideYaml = false;
                break;
            } else {
                insideYaml = true;
            }
        }
        if (insideYaml && line.text.trim().startsWith(fieldName)) {
            const nameStart = line.text.indexOf(fieldName) + fieldName.length;
            sel = new Selection(i, nameStart, i, line.text.length);
            break;
        }
    }
    return sel;
}