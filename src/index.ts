import { Registry } from "./registry.js";
import type {
  ToolDefinition,
  ActsAsParams,
  ListParams,
  CallParams,
  BubblitOptions,
  BubbleSet,
  ActsAsResult,
  TotalsResult,
  ListResult,
  CallResult,
} from "./types.js";

const DEFAULT_BUBBLES = ["read", "create", "mutate", "admin", "outbound"] as const;

export const discoveryPrompt = (
  bubbles?: readonly string[]
): string => {
  const bubbleList = bubbles
    ? bubbles.join(", ")
    : "read, create, mutate, admin, outbound";
  return `Tools are organized by behaviour class: ${bubbleList}.
Use tools/actsAs { as: "class" } to discover available tools by category,
then tools/list { names: ["tool_a", "tool_b"] } to load schemas for the specific
tools you need. Avoid calling tools/list without names — it returns no schemas.`;
};
type DefaultBubble = (typeof DEFAULT_BUBBLES)[number];

export function bubblit<B extends string = DefaultBubble>(
  options?: BubblitOptions<B>
): BubblitInstance<B> {
  const bubbles = (options?.bubbles ?? DEFAULT_BUBBLES) as unknown as BubbleSet<B>;

  const registry = new Registry<B>(bubbles);

  return {
    define(toolDefs: ToolDefinition<B>[]): void {
      registry.define(toolDefs);
    },

    actsAs(params: ActsAsParams<B>): ActsAsResult | TotalsResult {
      return registry.actsAs(params);
    },

    list(params: ListParams): ListResult {
      return registry.list(params);
    },

    async call(params: CallParams): Promise<CallResult> {
      return registry.call(params);
    },
  };
}

export interface BubblitInstance<B extends string> {
  define(toolDefs: ToolDefinition<B>[]): void;
  actsAs(params: ActsAsParams<B>): ActsAsResult | TotalsResult;
  list(params: ListParams): ListResult;
  call(params: CallParams): Promise<CallResult>;
}

export type { ToolDefinition, BubbleSet };
