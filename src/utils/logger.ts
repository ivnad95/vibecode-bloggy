export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = ['api', 'key', 'token', 'secret', 'authorization', 'password', 'content'];

function sanitize(value: any): any {
  if (value instanceof Error) {
    return { name: value.name, message: sanitize(value.message) };
  }

  if (typeof value === 'string') {
    return SENSITIVE_KEYS.some((p) => value.toLowerCase().includes(p)) ? '[REDACTED]' : value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => sanitize(v));
  }

  if (value && typeof value === 'object') {
    const result: any = Array.isArray(value) ? [] : {};
    Object.keys(value).forEach((k) => {
      if (SENSITIVE_KEYS.some((p) => k.toLowerCase().includes(p))) {
        result[k] = '[REDACTED]';
      } else {
        result[k] = sanitize((value as any)[k]);
      }
    });
    return result;
  }

  return value;
}

function getCurrentLevel() {
  const envLevel =
    (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');
  return LEVELS[envLevel] ?? LEVELS.debug;
}

function log(level: LogLevel, ...args: any[]) {
  if (LEVELS[level] < getCurrentLevel()) return;
  const sanitized = args.map((arg) => sanitize(arg));
  const method = level === 'debug' ? 'debug' : level;
  // eslint-disable-next-line no-console
  (console as any)[method](...sanitized);
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
};

export default logger;
