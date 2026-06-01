export interface ToolDefinition<B extends string> {
  name: string;
  description?: string;
  actsAs: B[];
  inputSchema: object;
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

export interface ToolAnnotations {
  actsAs?: string[];
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: object;
  annotations?: ToolAnnotations;
}

export interface ActsAsParams<B extends string> {
  as?: B;
  filter?: string;
  offset?: number;
}

export interface ActsAsResult {
  tools: string[];
  more: number;
  matching: string | null;
  offset: number;
}

export interface TotalsResult {
  totals: Record<string, number>;
  matching: string | null;
}

export interface ListParams {
  names?: string[];
  cursor?: string;
}

export interface ListResult {
  tools: Tool[];
}

export interface CallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface CallResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface BubblitOptions<B extends string> {
  bubbles: readonly B[];
}

export type BubbleSet<B extends string> = readonly B[];
