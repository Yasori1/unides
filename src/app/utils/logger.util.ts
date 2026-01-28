import { environment } from '../../environments/environment';

/**
 * Production'da console loglarını devre dışı bırakan utility fonksiyonlar
 * Güvenlik açığı oluşturmamak için production'da hiçbir log gösterilmez
 */
export class Logger {
  static log(...args: any[]): void {
    if (!environment.production) {
      console.log(...args);
    }
  }

  static error(...args: any[]): void {
    if (!environment.production) {
      console.error(...args);
    }
  }

  static warn(...args: any[]): void {
    if (!environment.production) {
      console.warn(...args);
    }
  }

  static info(...args: any[]): void {
    if (!environment.production) {
      console.info(...args);
    }
  }

  static debug(...args: any[]): void {
    if (!environment.production) {
      console.debug(...args);
    }
  }
}
