# bubblit

The thinnest layer to bubble up your MCP tools for clean agent lookup.

```
npm install @soup-oss/bubblit
```

## System Prompt

Include this in your agent's system prompt. Bubblit provides a ready-to-use string:

```typescript
import { discoveryPrompt } from "@soup-oss/bubblit";

console.log(discoveryPrompt());
// → Tools are organized by behaviour class: read, create, mutate, admin, outbound.
//    Use tools/actsAs { as: "class" } to discover available tools by category,
//    then tools/list { names: ["tool_a", "tool_b"] } to load schemas for the specific
//    tools you need. Avoid calling tools/list without names — it returns no schemas.

// Custom bubble set
console.log(discoveryPrompt(["query", "command", "event", "stream"]));
```

## Why bubblit?

When an agent sees 500 tools at once, it over-reaches. Bubblit gives you the tools in focused bubbles — the agent sees only what's relevant to its current role.

- **Role-as-context**: give the model the class, not the full list
- **Compact signatures**: `invoice_get(id:integer)` instead of full schemas
- **Paginated discovery**: handle 10,000 tools the same way you handle 10
- **Custom bubble sets**: use the 5-class default or define your own topology

## Quick Start

```typescript
import { bubblit } from "@soup-oss/bubblit";

const b = bubblit();

// Register tools with their behaviour classes
b.define([
  {
    name: "invoice_get",
    description: "Get an invoice by ID",
    actsAs: ["read"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Invoice ID" },
      },
      required: ["id"],
    },
    handler: async ({ id }) => ({ status: "ok", id }),
  },
  {
    name: "invoice_create",
    description: "Create a new invoice",
    actsAs: ["create"],
    inputSchema: {
      type: "object",
      properties: {
        customer_id: { type: "integer" },
        amount: { type: "number" },
      },
    },
    handler: async () => ({ id: 123, status: "created" }),
  },
  {
    name: "email_send",
    description: "Send an email notification",
    actsAs: ["outbound"],
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
      },
    },
    handler: async () => ({ sent: true }),
  },
]);

// ─────────────────────────────────────────────────────────
// Handle tools/actsAs — discover tools by behaviour class
// ─────────────────────────────────────────────────────────

b.actsAs({ as: "read" });
// → { tools: ["invoice_get(id:integer)"], more: 0, matching: null, offset: 0 }

b.actsAs({ as: "read", filter: "invoice" });
// → { tools: ["invoice_get(id:integer)"], more: 0, matching: "invoice", offset: 0 }

b.actsAs({ as: "read", offset: 10 });
// → { tools: [...], more: 90, matching: null, offset: 10 }

// Without `as`, returns totals per class
b.actsAs({});
// → { totals: { read: 1, create: 1, mutate: 0, admin: 0, outbound: 1 }, matching: null }

// With filter
b.actsAs({ filter: "invoice" });
// → { totals: { read: 1, create: 1, mutate: 0, admin: 0, outbound: 0 }, matching: "invoice" }

// ─────────────────────────────────────────────────────────
// Handle tools/list — fetch full schemas for known tools
// ─────────────────────────────────────────────────────────

b.list({ names: ["invoice_get", "email_send"] });
// → { tools: [{ name: "invoice_get", annotations: { actsAs: ["read"] }, ... }] }

// ─────────────────────────────────────────────────────────
// Handle tools/call — execute the tool
// ─────────────────────────────────────────────────────────

await b.call({ name: "invoice_get", arguments: { id: 123 } });
// → { content: [{ type: "text", text: '{"status":"ok","id":123}' }] }
```

## Custom Bubble Sets

The default 5-class set works for most CRUD systems. For different topologies, define your own:

```typescript
import { bubblit } from "@soup-oss/bubblit";

// Data-Flow (CQRS) topology
const cqrs = bubblit({
  bubbles: ["query", "command", "event", "stream"] as const,
});
cqrs.define([...]);

// Resource-Lifecycle (REST) topology
const rest = bubblit({
  bubbles: ["collection", "member", "factory", "transition"] as const,
});
rest.define([...]);

// Custom set
const custom = bubblit({
  bubbles: ["view", "edit", "admin", "notify"] as const,
});
custom.define([...]);
```

## Integration with @modelcontextprotocol/sdk

```typescript
import { bubblit } from "@soup-oss/bubblit";
import { Server } from "@modelcontextprotocol/sdk/server";

const b = bubblit();
b.define([...]);

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: { actsAs: ["read", "create", "mutate", "admin", "outbound"] } } }
);

server.setRequestHandler("tools/actsAs", async (req) => {
  return b.actsAs(req.params);
});

server.setRequestHandler("tools/list", async (req) => {
  return b.list(req.params);
});

server.setRequestHandler("tools/call", async (req) => {
  return b.call(req.params);
});

// ... wire up your transport (stdio, HTTP, etc.)
```

## API

### `bubblit(options?)`

Creates a new bubblit instance. Options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bubbles` | `readonly string[]` | 5-class set | Custom behaviour classes |

### Instance Methods

| Method | Params | Returns |
|--------|--------|---------|
| `define(tools)` | `ToolDefinition[]` | `void` — registers tools |
| `actsAs(params)` | `{ as?, filter?, offset? }` | `ActsAsResult` or `TotalsResult` |
| `list(params)` | `{ names? }` | `ListResult` |
| `call(params)` | `{ name, arguments }` | `CallResult` |

## License

MIT
