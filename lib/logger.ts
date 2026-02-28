type LogLevel = "info" | "warn" | "error";

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "\x1b[36m",   // cyan
  warn: "\x1b[33m",   // yellow
  error: "\x1b[31m",  // red
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: LogLevel, tag: string, message: string, meta?: Record<string, unknown>): string {
  const color = LEVEL_COLORS[level];
  const metaStr = meta ? ` ${DIM}${JSON.stringify(meta)}${RESET}` : "";
  return `${DIM}${timestamp()}${RESET} ${color}${level.toUpperCase().padEnd(5)}${RESET} [${tag}] ${message}${metaStr}`;
}

export function createLogger(tag: string) {
  return {
    info(message: string, meta?: Record<string, unknown>) {
      console.log(format("info", tag, message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
      console.warn(format("warn", tag, message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(format("error", tag, message, meta));
    },
    /** Log request start + return a function to log completion with duration */
    request(method: string, path: string, params?: Record<string, unknown>) {
      const start = performance.now();
      this.info(`${method} ${path}`, params);
      return {
        done: (status: number, extra?: Record<string, unknown>) => {
          const ms = (performance.now() - start).toFixed(1);
          this.info(`${method} ${path} → ${status} in ${ms}ms`, extra);
        },
        fail: (status: number, err: unknown) => {
          const ms = (performance.now() - start).toFixed(1);
          this.error(`${method} ${path} → ${status} in ${ms}ms`, {
            error: err instanceof Error ? err.message : String(err),
          });
        },
      };
    },
  };
}
