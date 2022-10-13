import { VswProjectConfig } from '../models';
import * as path from 'path';
import * as fs from 'fs';
export module FileHelpers {
    export const markdownExtensions = ['.md', '.markdown'];
    export function safeReadFile(filePath: string, fileName?: string, isJson = true) {
        let itemPath = filePath;
        if (fileName) {
            itemPath = path.join(filePath, fileName);
        }
        if (!fs.existsSync(itemPath)) {
            return undefined;
        }
        const data = fs.readFileSync(itemPath, 'utf8');
        if (isJson) {
            return JSON.parse(data);
        } else {
            return data;
        }

    }

    export function safeWriteFile(filePath: string, content: any, stringify = true) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        if (stringify) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
        } else {
            fs.writeFileSync(filePath, content, "utf8");
        }
    }

    export function isFolder(itemPath: string) {
        const itemInfo = fs.lstatSync(itemPath);
        if (itemInfo.isDirectory()) {
            return true;
        }
        return false;
    }

    export function isFolderInProject(config: VswProjectConfig, folderPath: string) {
        if (!isFolder(folderPath)) {
            return undefined;
        }

        const projectFolders = [config.settings.backMatterFolder, config.settings.contentFolder, config.settings.frontMatterFolder, config.settings.notesFolder];


        const folderPathParsed = path.parse(folderPath);
        if (projectFolders.indexOf(folderPathParsed.name) > -1) {
            return true;
        }
        if (folderPathParsed.name.startsWith('.')) {
            return false;
        }

        // todo: only return true if folder is in content path.
        return true;
    }

    export function isContentFile(config: VswProjectConfig, filePath: string) {
        const projectFolders = [
            path.join(config.projectPath, config.settings.backMatterFolder),
            path.join(config.projectPath, config.settings.frontMatterFolder),
            path.join(config.projectPath, config.settings.notesFolder),
        ];
        const contentFolder = path.join(config.projectPath, config.settings.contentFolder);

        // do this check first in case meta folders are inside content folder (as the current default configuration is)
        const metaFolder = projectFolders.find(p => filePath.startsWith(p));
        if (metaFolder) {
            return false;
        }

        if (filePath.startsWith(contentFolder)) {
            return true;
        }
        return false;
    }

    export function getContentFilesInFolder(config: VswProjectConfig, folderPath: string) {
        const results = [];
        const files = getProjectFileItemsInFolder(folderPath);
        if (!files) {
            return [];
        }
        for (const file of files) {
            if (isContentFile(config, file)) {
                results.push(file);
            }
        }
        return results;
    }

    export function getProjectFileItemsInFolder(folderPath: string) {
        if (!isFolder(folderPath)) {
            return undefined;
        }

        const results = [];

        const folderItems = fs.readdirSync(folderPath);
        for (const item of folderItems) {
            const childPath = path.join(folderPath, item);
            const info = fs.lstatSync(childPath);
            if (info.isFile()) {
                const childFileParsed = path.parse(childPath);
                if (['.md', '.markdown'].indexOf(childFileParsed.ext) > -1) {
                    results.push(childPath);
                }
            }
            if (info.isDirectory()) {
                // do nothing
            }
        }
        return results;
    }

    export function getFoldersInFolder(config: VswProjectConfig, folderPath: string) {
        if (!isFolder(folderPath)) {
            return [];
        }

        const results = [];

        const folderItems = fs.readdirSync(folderPath);
        for (const item of folderItems) {
            const childPath = path.join(folderPath, item);
            const info = fs.lstatSync(childPath);

            if (info.isDirectory()) {
                if (isFolderInProject(config, childPath)) {
                    results.push(childPath);
                }
            }
        }

        return results;
    }
}