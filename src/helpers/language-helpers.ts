// const winkNLP = require('wink-nlp');
// import winkUtils from 'wink-nlp-utils';
// const model = require('wink-eng-lite-model');
const winkUtils = require('wink-nlp-utils');

import { WinkMethods } from 'wink-nlp';

// const nlp = winkNlp(model);

// let nlp: WinkMethods | undefined = undefined;

export module LanguageHelpers {
    export function documentStatistics(text: string) {
        // if (!nlp) {
        //     try {
        //         nlp = winkNLP(model);
        //     } catch (err) {
        //         console.error(err)
        //     }
        // }
        // if (!nlp) {
        const sentences = winkUtils.string.sentences(text);
        const tokens = winkUtils.string.tokenize(text, true);
        const words = tokens.filter((p: any) => p.tag === 'word');

        return <DocumentStatistics>{
            sentences: sentences.length,
            words: words.length,
            // };
        };
        // const doc = nlp.readDoc(text);
        // const sentences = doc.sentences().out();
        // const wordCount = doc.tokens().length(); // should only contain "words"
        // return <DocumentStatistics>{
        //     sentences: sentences.length,
        //     words: wordCount,
        // };
    }
}

export interface DocumentStatistics {
    words: number;
    sentences: number;
}