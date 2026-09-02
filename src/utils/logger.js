export function createLogger(options = {}) {
  const { level = 'info' } = options;
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  function log(level, message, data = null) {
    if (levels[level] > levels[options.level || 'info']) return;
    const timestamp = new Date().toISOString();
    const logEntry = { level, timestamp, message };
    if (data) logEntry.data = data;
    console.log(JSON.stringify(logEntry));
  }
  return {
    error: (message, data) => log('error', message, data),
    warn: (message, data) => log('warn', message, data),
    info: (message, data) => log('info', message, data),
    debug: (message, data) => log('debug', message, data),
  };
}
export default createLogger;
