/**
 * 📝 Простой логгер для отслеживания парсинга
 * Хранит последние 100 логов в памяти
 */

export interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
  data?: any
}

class ParserLogger {
  private logs: LogEntry[] = []
  private maxLogs = 100

  log(message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info', data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : undefined
    }

    this.logs.push(entry)

    // Храним только последние maxLogs записей
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Также логируем в консоль
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[level]

    console.log(`${prefix} [${entry.timestamp}] ${message}`, data || '')
  }

  info(message: string, data?: any) {
    this.log(message, 'info', data)
  }

  success(message: string, data?: any) {
    this.log(message, 'success', data)
  }

  error(message: string, data?: any) {
    this.log(message, 'error', data)
  }

  warning(message: string, data?: any) {
    this.log(message, 'warning', data)
  }

  getLogs(): LogEntry[] {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }

  getLastN(n: number): LogEntry[] {
    return this.logs.slice(-n)
  }
}

export const parserLogger = new ParserLogger()
