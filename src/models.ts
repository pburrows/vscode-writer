export interface VswProjectConfig {
    projectPath: string;
    settings: VswSettings;
    folderSettings: Record<string, VswFolderSetting>;
}

export interface VswFolderSetting {
    name: string;
    order: number;
}

export interface VswSettings {
    frontMatterFolder: string;
    backMatterFolder: string;
    notesFolder: string;
    contentFolder: string;
}

export interface VswFileSettings {
    type?: VswFileType;
    name?: string;
    pov?: string;
}

export enum VswFileType {
    chapter = 'chapter', 
    section = 'section',
    part = 'part',
    frontMatter = 'frontMatter',
    backMatter = 'backMatter',
    folder = 'folder'
}