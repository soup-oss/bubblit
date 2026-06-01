type ParamDef = {
  type: string;
  description?: string;
  optional?: boolean;
};

export function toCompactSignature(
  name: string,
  inputSchema: Record<string, unknown>
): string {
  const params = inputSchema.properties as Record<string, ParamDef> | undefined;
  if (!params || Object.keys(params).length === 0) {
    return `${name}()`;
  }

  const paramList = Object.entries(params)
    .map(([key, def]) => {
      const type = def.type || "any";
      const opt = def.optional ? "?" : "";
      return `${key}${opt}:${type}`;
    })
    .join(", ");

  return `${name}(${paramList})`;
}
