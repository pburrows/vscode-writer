import { commands, ExtensionContext } from "vscode";

export function activate(context: ExtensionContext) {

    /*
    {
          "command": "vs-writer.publish.publishToMarkdown",
          "group": "Publish"
        },
        {
          "command": "vs-writer.publish.publishToEpub",
          "group": "Publish"
        },
        {
          "command": "vs-writer.publish.publishToWord",
          "group": "Publish"
        },
        {
          "command": "vs-writer.publish.publishToRtf",
          "group": "Publish"
        },
        {
          "command": "vs-writer.publish.publishToHtml",
          "group": "Publish"
        },
    */

    context.subscriptions.push(
        commands.registerCommand('vs-writer.publish.publishToMarkdown', () => publishToMarkdown()),
        commands.registerCommand('vs-writer.publish.publishToEpub', () => publishToEpub()),
        commands.registerCommand('vs-writer.publish.publishToWord', () => publishToWord()),
        commands.registerCommand('vs-writer.publish.publishToRtf', () => publishToRtf()),
        commands.registerCommand('vs-writer.publish.publishToHtml', () => publishToHtml()),
        
    );
}

async function publishToMarkdown() {
    console.log('publish to markdown');
}
async function publishToEpub() {
    console.log('publish to epub');
}
async function publishToWord() {
    console.log('publish to word');
}
async function publishToRtf() {
    console.log('publish to rtf');
}
async function publishToHtml() {
    console.log('publish to html');
}