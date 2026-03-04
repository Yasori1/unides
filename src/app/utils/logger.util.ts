/**
 * Production'da ve canlıda console'da hiçbir log gösterilmemesi için
 * tüm metodlar no-op (boş). Dışarıya gözükmemeli.
 */
export class Logger {
  static log(..._args: any[]): void {
    // No-op: console'da görünmesin
  }

  static error(..._args: any[]): void {
    // No-op: console'da görünmesin
  }

  static warn(..._args: any[]): void {
    // No-op: console'da görünmesin
  }

  static info(..._args: any[]): void {
    // No-op: console'da görünmesin
  }

  static debug(..._args: any[]): void {
    // No-op: console'da görünmesin
  }
}
