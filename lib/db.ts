import { Pool, type PoolClient } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable.')
  }

  pool = new Pool({ connectionString })
  return pool
}

/** Execute a single SQL query against the pooled Neon connection. */
export async function query<T = unknown>(
  sql: string,
  values?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(sql, values)
  return result.rows as T[]
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
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
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
