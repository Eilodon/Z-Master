
declare module '@ricky0123/vad-web' {
    export class MicVAD {
        static new(config: any): Promise<MicVAD>;
        start(): void;
        pause(): void;
    }
    export const utils: any;
}

declare module 'sentiment' {
    export default class Sentiment {
        registerLanguage(code: string, config: any): void;
        analyze(text: string, options?: any): any;
    }
}
