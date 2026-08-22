import { getSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('users').select('id').limit(1)

    if (error) {
      return Response.json({ status: 'error', message: error.message }, { status: 500 })
    }

    return Response.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ status: 'error', message }, { status: 500 })
  }
}
