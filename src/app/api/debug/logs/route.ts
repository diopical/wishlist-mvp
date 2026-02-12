import { NextRequest, NextResponse } from 'next/server'
import { parserLogger } from '@/lib/parser-logger'

/**
 * GET /api/debug/logs
 * Возвращает последние логи парсера
 */
export async function GET(req: NextRequest) {
  try {
    const logs = parserLogger.getLogs()
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE /api/debug/logs
 * Очищает логи
 */
export async function DELETE(req: NextRequest) {
  try {
    parserLogger.clearLogs()
    return NextResponse.json({
      success: true,
      message: 'Логи очищены'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
