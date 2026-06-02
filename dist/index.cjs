"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  bubblit: () => bubblit,
  discoveryPrompt: () => discoveryPrompt
});
module.exports = __toCommonJS(index_exports);

// src/formats.ts
function toCompactSignature(name, inputSchema) {
  const params = inputSchema.properties;
  if (!params || Object.keys(params).length === 0) {
    return `${name}()`;
  }
  const paramList = Object.entries(params).map(([key, def]) => {
    const type = def.type || "any";
    const opt = def.optional ? "?" : "";
    return `${key}${opt}:${type}`;
  }).join(", ");
  return `${name}(${paramList})`;
}

// src/registry.ts
var DEFAULT_PAGE_SIZE = 10;
var Registry = class {
  tools = /* @__PURE__ */ new Map();
  bubbles;
  constructor(bubbles) {
    this.bubbles = bubbles;
  }
  define(toolDefs) {
    for (const tool of toolDefs) {
      this.tools.set(tool.name, tool);
    }
  }
  get(name) {
    return this.tools.get(name);
  }
  actsAs(params) {
    if (!params.as) {
      return this.totals(params.filter);
    }
    let filtered = Array.from(this.tools.values()).filter(
      (t) => t.actsAs.includes(params.as)
    );
    const filter = params.filter?.toLowerCase();
    if (filter) {
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(filter) || t.description?.toLowerCase().includes(filter)
      );
    }
    const offset = params.offset ?? 0;
    const page = filtered.slice(offset, offset + DEFAULT_PAGE_SIZE);
    const more = Math.max(0, filtered.length - offset - DEFAULT_PAGE_SIZE);
    const tools = page.map(
      (t) => toCompactSignature(t.name, t.inputSchema)
    );
    return {
      tools,
      more,
      matching: filter ?? null,
      offset
    };
  }
  totals(filter) {
    const counts = Object.fromEntries(
      this.bubbles.map((b) => [b, 0])
    );
    for (const tool of this.tools.values()) {
      for (const cls of tool.actsAs) {
        if (this.bubbles.includes(cls)) {
          let include = true;
          if (filter) {
            const f = filter.toLowerCase();
            include = tool.name.toLowerCase().includes(f) || tool.description?.toLowerCase().includes(f);
          }
          if (include) {
            counts[cls] = (counts[cls] || 0) + 1;
          }
        }
      }
    }
    return { totals: counts, matching: filter ?? null };
  }
  list(params) {
    const tools = Array.from(this.tools.values());
    if (!params.names || params.names.length === 0) {
      return {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { actsAs: t.actsAs }
        }))
      };
    }
    const filtered = tools.filter((t) => params.names.includes(t.name));
    return {
      tools: filtered.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: { actsAs: t.actsAs }
      }))
    };
  }
  async call(params) {
    const tool = this.tools.get(params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Tool not found: ${params.name}` }],
        isError: true
      };
    }
    try {
      const result = await tool.handler(params.arguments);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: err instanceof Error ? err.message : String(err)
          }
        ],
        isError: true
      };
    }
  }
};

// src/index.ts
var DEFAULT_BUBBLES = ["read", "create", "mutate", "admin", "outbound"];
var discoveryPrompt = (bubbles) => {
  const bubbleList = bubbles ? bubbles.join(", ") : "read, create, mutate, admin, outbound";
  return `Tools are organized by behaviour class: ${bubbleList}.
Use tools/actsAs { as: "class" } to discover available tools by category,
then tools/list { names: ["tool_a", "tool_b"] } to load schemas for the specific
tools you need. Avoid calling tools/list without names \u2014 it returns no schemas.`;
};
function bubblit(options) {
  const bubbles = options?.bubbles ?? DEFAULT_BUBBLES;
  const registry = new Registry(bubbles);
  return {
    define(toolDefs) {
      registry.define(toolDefs);
    },
    actsAs(params) {
      return registry.actsAs(params);
    },
    list(params) {
      return registry.list(params);
    },
    async call(params) {
      return registry.call(params);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bubblit,
  discoveryPrompt
});
//# sourceMappingURL=index.cjs.map