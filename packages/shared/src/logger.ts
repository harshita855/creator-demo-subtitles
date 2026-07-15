// Minimal structured JSON logger - each call emits one line of JSON
// with consistent fields (timestamp, level, service, message, plus
// any extra context) rather than a free-form string. This is what
// lets a log aggregator (or even just `grep`/`jq` on raw output)
// filter and query logs reliably, which plain console.log strings
// don't support.
type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function log(service: string, level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(service: string) {
  return {
    info: (message: string, fields?: LogFields) => log(service, "info", message, fields),
    warn: (message: string, fields?: LogFields) => log(service, "warn", message, fields),
    error: (message: string, fields?: LogFields) => log(service, "error", message, fields),
  };
}
