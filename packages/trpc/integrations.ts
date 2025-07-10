export const importIntegration = async (
  path: string,
): Promise<Record<string, unknown>> => {
  const mod: unknown = await import(`../integrations/${path}`);
  return typeof mod === "object" && mod !== null
    ? (mod as Record<string, unknown>)
    : {};
};
