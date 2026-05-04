/**
 * Logger - Structured logging
 */

export class Logger {
  constructor(env) {
    this.env = env;
    this.level = env.LOG_LEVEL || "info";
  }

  _log(level, message, data = null) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.level]) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(data && { data }),
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message, data) {
    this._log("debug", message, data);
  }

  info(message, data) {
    this._log("info", message, data);
  }

  warn(message, data) {
    this._log("warn", message, data);
  }

  error(message, data) {
    this._log("error", message, data);
  }
}