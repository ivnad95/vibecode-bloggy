import { describe, expect, test, afterEach } from "vitest";

// Because logger module resolves env vars at runtime, we can import once.
import { logger } from "./logger";

afterEach(() => {
  delete process.env.LOG_LEVEL;
});

describe("logger", () => {
  test("respects log level", () => {
    process.env.LOG_LEVEL = "warn";
    const outputs: any[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => outputs.push(args.join(" "));
    const originalInfo = console.info;
    console.info = (...args: any[]) => outputs.push("INFO:" + args.join(" "));

    logger.info("info message");
    logger.warn("warn message");

    console.warn = originalWarn;
    console.info = originalInfo;

    expect(outputs).toEqual(["warn message"]);
  });

  test("redacts sensitive fields", () => {
    process.env.LOG_LEVEL = "debug";
    const outputs: any[] = [];
    const originalInfo = console.info;
    console.info = (...args: any[]) => outputs.push(args[0]);

    logger.info({ apiKey: "123", token: "abc", password: "pw", content: "user text" });

    console.info = originalInfo;

    expect(outputs[0]).toEqual({
      apiKey: "[REDACTED]",
      token: "[REDACTED]",
      password: "[REDACTED]",
      content: "[REDACTED]",
    });
  });
});
