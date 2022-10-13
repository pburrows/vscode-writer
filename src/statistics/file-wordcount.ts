// much of this functionality inspired by https://github.com/Microsoft/vscode-wordcount

import { Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, window } from "vscode";
import { LanguageHelpers } from "../helpers/language-helpers";

export function activate (context: ExtensionContext) {
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);
}

export class WordCounter {

    private _statusBarItem?: StatusBarItem = undefined;

    public updateWordCount() {
        
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        } 

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        // Only update status if an MD file
        if (doc.languageId === "markdown") {
            let wordCount = this._getWordCount(doc);

            // Update the status bar
            this._statusBarItem.text = wordCount !== 1 ? `$(pencil) ${wordCount} Words` : '$(pencil) 1 Word';
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getWordCount(doc: TextDocument): number {
        let docContent = doc.getText();

        const stats = LanguageHelpers.documentStatistics(docContent);
        return stats.words;

        // Parse out unwanted whitespace so the split is accurate
        // docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        // docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        // let wordCount = 0;
        // if (docContent != "") {
        //     wordCount = docContent.split(" ").length;
        // }

        // return wordCount;
    }

    public dispose() {
        this._statusBarItem?.dispose();
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}