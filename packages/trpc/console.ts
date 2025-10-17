export const importConsole = async (
  path: string,
): Promise<{ usernameAvailable: (username: string) => boolean }> => {
  const mod: unknown = await import(`../console/${path}`);

  if (
    typeof mod === "object" &&
    mod !== null &&
    "usernameAvailable" in mod &&
    typeof (mod as Record<string, unknown>).usernameAvailable === "function"
  ) {
    return {
      usernameAvailable: (
        mod as { usernameAvailable: (username: string) => boolean }
      ).usernameAvailable,
    };
  }
  throw new Error("Invalid console module");
};
