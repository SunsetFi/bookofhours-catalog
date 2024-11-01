declare const __APP_VERSION__: string;

declare type ArrayItemOf<T> = T extends readonly (infer U)[] ? U : never;
