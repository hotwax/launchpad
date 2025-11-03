declare module 'boon-js' {
  export function getEvaluator(expression: string): any;
  export function parse(expression: string): any;
}

/*declare module 'boon-js/lib/types' {
  export type Tokens = any;
}*/

declare module 'boon-js/lib/types' {
  export const Tokens: {
    IDENTIFIER: string;
    [key: string]: any;
  };
}