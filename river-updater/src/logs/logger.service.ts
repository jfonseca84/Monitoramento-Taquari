export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class LoggerService {
  private static formatTime(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  private static formatMessage(level: LogLevel, prefix: string, message: string): string {
    const time = this.formatTime();
    const levelStr = level.toUpperCase().padEnd(5);
    return `[${time}] [${levelStr}] [${prefix}] ${message}`;
  }

  public static info(prefix: string, message: string, ...args: any[]): void {
    console.log(this.formatMessage('info', prefix, message), ...args);
  }

  public static warn(prefix: string, message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', prefix, message), ...args);
  }

  public static error(prefix: string, message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', prefix, message), ...args);
  }

  public static debug(prefix: string, message: string, ...args: any[]): void {
    if (process.env.DEBUG === 'true') {
      console.debug(this.formatMessage('debug', prefix, message), ...args);
    }
  }
}
