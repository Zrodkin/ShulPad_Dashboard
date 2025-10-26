// src/lib/db.ts - PlanetScale Version
import { connect } from '@planetscale/database'

let globalDb: any = null

export function createClient() {
  if (!globalDb) {
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    
    // Validate it's a PlanetScale URL
    if (!connectionString.includes('psdb.cloud')) {
      throw new Error('DATABASE_URL must be a valid PlanetScale connection string')
    }
    
    try {
      globalDb = connect({
        url: connectionString
      })
      
      console.log('✅ PlanetScale connection established')
    } catch (error) {
      console.error('❌ Failed to connect to PlanetScale:', error)
      throw new Error(`Database connection failed: ${error}`)
    }
  }
  
  return globalDb
}

// Health check utility
export async function healthCheck(): Promise<boolean> {
  try {
    const db = createClient()
    const result = await db.execute('SELECT 1 as health')
    return result.rows.length > 0
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}