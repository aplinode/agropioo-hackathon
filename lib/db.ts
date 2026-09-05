import { Pool, type PoolClient } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable.')
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    options: '-c client_encoding=UTF8',
  })
  return pool
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isConnectionReset = message.includes('ECONNRESET') || message.includes('Connection terminated unexpectedly')
    if (retries > 0 && isConnectionReset && pool) {
      try {
        await pool.end()
      } catch {
        // ignore end errors
      }
      pool = null
      return withRetry(fn, retries - 1)
    }
    throw err
  }
}

/** Execute a single SQL query against the pooled Neon connection. */
export async function query<T = unknown>(
  sql: string,
  values?: unknown[]
): Promise<T[]> {
  return withRetry(async () => {
    const result = await getPool().query(sql, values)
    return result.rows as T[]
  })
}

/** Execute a single SQL query and return the first row, or null. */
export async function queryOne<T = unknown>(
  sql: string,
  values?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, values)
  return rows[0] ?? null
}

/** Acquire a client for transactions. Always release when done. */
export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withRetry(async () => {
    const client = await getPool().connect()
    try {
      return await fn(client)
    } finally {
      client.release()
    }
  })
}

/** Run queries inside a transaction. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}
