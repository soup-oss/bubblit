interface ToolDefinition<B extends string> {
    name: string;
    description?: string;
    actsAs: B[];
    inputSchema: object;
    handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}
interface ToolAnnotations {
    actsAs?: string[];
}
interface Tool {
    name: string;
    description?: string;
    inputSchema: object;
    annotations?: ToolAnnotations;
}
interface ActsAsParams<B extends string> {
    as?: B;
    filter?: string;
    offset?: number;
}
interface ActsAsResult {
    tools: string[];
    more: number;
    matching: string | null;
    offset: number;
}
interface TotalsResult {
    totals: Record<string, number>;
    matching: string | null;
}
interface ListParams {
    names?: string[];
    cursor?: string;
}
interface ListResult {
    tools: Tool[];
}
interface CallParams {
    name: string;
    arguments: Record<string, unknown>;
}
interface CallResult {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
interface BubblitOptions<B extends string> {
    bubbles: readonly B[];
}
type BubbleSet<B extends string> = readonly B[];

declare const DEFAULT_BUBBLES: readonly ["read", "create", "mutate", "admin", "outbound"];
declare const discoveryPrompt: (bubbles?: readonly string[]) => string;
type DefaultBubble = (typeof DEFAULT_BUBBLES)[number];
declare function bubblit<B extends string = DefaultBubble>(options?: BubblitOptions<B>): BubblitInstance<B>;
interface BubblitInstance<B extends string> {
    define(toolDefs: ToolDefinition<B>[]): void;
    actsAs(params: ActsAsParams<B>): ActsAsResult | TotalsResult;
    list(params: ListParams): ListResult;
    call(params: CallParams): Promise<CallResult>;
}

export { type BubbleSet, type BubblitInstance, type ToolDefinition, bubblit, discoveryPrompt };
