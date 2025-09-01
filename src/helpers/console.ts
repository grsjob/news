export const colorizedConsole = {
  accept: (value: unknown) => console.log("\x1b[32m%s\x1b[0m", value),
  warn: (value: unknown) => console.log("\x1b[33m%s\x1b[0m", value),
  err: (value: unknown) => console.log("\x1b[31m%s\x1b[0m", value),
  purp: (value: unknown) => console.log("\x1b[35m%s\x1b[0m", value),
};
