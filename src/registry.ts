import type {
  ToolDefinition,
  ActsAsParams,
  ActsAsResult,
  TotalsResult,
  ListParams,
  ListResult,
  CallParams,
  CallResult,
  BubbleSet,
} from "./types.js";
import { toCompactSignature } from "./formats.js";

const DEFAULT_PAGE_SIZE = 10;

export class Registry<B extends string> {
  private tools: Map<string, ToolDefinition<B>> = new Map();
  private bubbles: BubbleSet<B>;

  constructor(bubbles: BubbleSet<B>) {
    this.bubbles = bubbles;
  }

  define(toolDefs: ToolDefinition<B>[]): void {
    for (const tool of toolDefs) {
      this.tools.set(tool.name, tool);
    }
  }

  get(name: string): ToolDefinition<B> | undefined {
    return this.tools.get(name);
  }

  actsAs(params: ActsAsParams<B>): ActsAsResult | TotalsResult {
    // No `as` → return totals per class
    if (!params.as) {
      return this.totals(params.filter);
    }

    // Filter tools by class
    let filtered = Array.from(this.tools.values()).filter((t) =>
      t.actsAs.includes(params.as!)
    );

    // Apply text filter
    const filter = params.filter?.toLowerCase();
    if (filter) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(filter) ||
          t.description?.toLowerCase().includes(filter)
      );
    }

    // Pagination
    const offset = params.offset ?? 0;
    const page = filtered.slice(offset, offset + DEFAULT_PAGE_SIZE);
    const more = Math.max(0, filtered.length - offset - DEFAULT_PAGE_SIZE);

    // Compact signatures
    const tools = page.map((t) =>
      toCompactSignature(t.name, t.inputSchema as Record<string, unknown>)
    );

    return {
      tools,
      more,
      matching: filter ?? null,
      offset,
    };
  }

  private totals(filter?: string): TotalsResult {
    const counts: Record<string, number> = Object.fromEntries(
      this.bubbles.map((b) => [b, 0])
    );

    for (const tool of this.tools.values()) {
      for (const cls of tool.actsAs) {
        if (this.bubbles.includes(cls)) {
          let include = true;
          if (filter) {
            const f = filter.toLowerCase();
            include =
              tool.name.toLowerCase().includes(f) ||
              tool.description?.toLowerCase().includes(f);
          }
          if (include) {
            counts[cls] = (counts[cls] || 0) + 1;
          }
        }
      }
    }

    return { totals: counts, matching: filter ?? null };
  }

  list(params: ListParams): ListResult {
    const tools = Array.from(this.tools.values());

    if (!params.names || params.names.length === 0) {
      return {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { actsAs: t.actsAs },
        })),
      };
    }

    // Filter to requested names only
    const filtered = tools.filter((t) => params.names!.includes(t.name));

    return {
      tools: filtered.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: { actsAs: t.actsAs },
      })),
    };
  }

  async call(params: CallParams): Promise<CallResult> {
    const tool = this.tools.get(params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Tool not found: ${params.name}` }],
        isError: true,
      };
    }

    try {
      const result = await tool.handler(params.arguments);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: err instanceof Error ? err.message : String(err),
          },
        ],
        isError: true,
      };
    }
  }
}
