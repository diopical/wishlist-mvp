'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
  data?: string
}

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/debug/logs')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      await fetch('/api/debug/logs', { method: 'DELETE' })
      setLogs([])
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs()
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return '📝'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🔍 Логи парсера</h1>
            <div className="space-x-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-700">Автообновление</span>
              </label>
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Обновить
              </button>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Очистить
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Загрузка логов...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-4">
                Всего логов: <span className="font-bold">{logs.length}</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Логов нет
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-0.5">{getLevelEmoji(log.level)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium">{log.message}</p>
                            <span className="text-xs opacity-70 flex-shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {log.data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs opacity-70 hover:opacity-100">
                                Детали
                              </summary>
                              <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-auto">
                                {log.data}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
