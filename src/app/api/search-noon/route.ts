/**
 * API endpoint для поиска товаров на noon.com
 * POST /api/search-noon
 * Body: { query: string, amazonPrice?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchNoonProduct } from '@/lib/noon-parser'

export async function POST(req: NextRequest) {
  try {
    const { query, amazonPrice } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    console.log('[API Search Noon] Поиск товара:', query)
    console.log('[API Search Noon] Amazon цена:', amazonPrice)

    const product = await searchNoonProduct(query, amazonPrice)

    if (product) {
      return NextResponse.json({
        success: true,
        product,
        matchScore: product.matchScore
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Product not found on noon.com or match score too low'
      })
    }

  } catch (error: any) {
    console.error('[API Search Noon] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
