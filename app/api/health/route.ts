import { queryOne } from '@/lib/db'

export async function GET() {
  try {
    await queryOne(`SELECT 1 as ok`)
    return Response.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ status: 'error', message }, { status: 500 })
  }
}
