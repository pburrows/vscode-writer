import { workspace } from 'vscode';
import { Position, Range } from 'vscode';
import { TextDocument, WorkspaceConfiguration, WorkspaceEdit } from 'vscode';
import matter = require("gray-matter");
import path = require("path");
import { stringify } from "querystring";
import { FileHelpers } from "./file-helpers";
import { VswFileSettings, VswFileType, VswFolderSetting, VswProjectConfig } from "../models";

export module ConfigurationHelper {
    export function getProjectConfig(projectPath: string): VswProjectConfig {
        let data = FileHelpers.safeReadFile(projectPath, '.vsw.json', true);
        if (!data) {
            data = defaultProjectConfig();
        }
        data.projectPath = projectPath;
        return data;

    }

    export function writeProjectConfig(config: VswProjectConfig) {
        const json = JSON.stringify(config, (key, value) => {
            switch (key) {
                case 'projectPath':
                    return undefined;
                default:
                    return value;
            }
        }, 2);
        FileHelpers.safeWriteFile(path.join(config.projectPath, '.vsw.json'), json, false);
    }

    export function getFolderConfig(projectPath: string, folderPath: string) {
        const projectConfig = getProjectConfig(projectPath);
        if (projectConfig.folderSettings[folderPath]) {
            return projectConfig.folderSettings[folderPath];
        }
        return defaultFolderConfig(folderPath);

    }

    export function getFileConfiguration(filePath: string): VswFileSettings {
        const content = FileHelpers.safeReadFile(filePath, undefined, false);
        const info = matter(content);
        // const pathInfo = path.parse(filePath);
        // @ts-ignore
        if (info.isEmpty || Object.keys(info.data).length === 0) {
            return {
                // name: pathInfo.name,
                // type: VswFileType.section,
                // pov: '',
            };
        }
        return info.data as VswFileSettings;
    }

    export function getTextDocumentConfiguration(doc: TextDocument): VswFileSettings {
        const content = doc.getText();
        const info = matter(content);
        // @ts-ignore
        if (info.isEmpty || Object.keys(info.data).length === 0) { 
            return {};
        }
        return info.data;
    }

    export function setFileConfiguration(filePath: string, settings: VswFileSettings) {
        const content = FileHelpers.safeReadFile(filePath, undefined, false);
        const newContent = updateFileSettingsText(content, settings);
        FileHelpers.safeWriteFile(filePath, newContent, false);
    }

    export async function setTextDocumentConfiguration(doc: TextDocument, settings: VswFileSettings) {
        const content = doc.getText();
        const newContent = updateFileSettingsText(content, settings);
        const edit = new WorkspaceEdit();
        const lastLine = doc.lineAt(doc.lineCount -1);
        edit.replace(doc.uri, new Range(new Position(0,0), new Position(doc.lineCount, lastLine.text.length)), newContent);
        await workspace.applyEdit(edit);
    }

    function updateFileSettingsText(content: string, settings: VswFileSettings) {
        const info = matter(content);
        let newContent = '';
        // @ts-ignore
        if (info.isEmpty || Object.keys(info.data).length === 0) { 
            newContent = matter.stringify(content, settings);
        } else {
            newContent = matter.stringify(info.content, settings);
        }
        return newContent;
    }

    function defaultFolderConfig(folderPath: string): VswFolderSetting {
        const folderName = path.basename(folderPath);
        return {
            name: folderName,
            order: 0, // todo: do something better here
        };
    }

    function defaultProjectConfig(): VswProjectConfig {
        return {
            settings: {
                frontMatterFolder: '.front-matter',
                backMatterFolder: '.back-matter',
                contentFolder: '',
                notesFolder: '.notes',
            },
            folderSettings: {},
            projectPath: ''
        };
    }

}