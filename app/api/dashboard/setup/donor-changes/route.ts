import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const db = createClient()

    // Create donor_changes table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS donor_changes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        old_email VARCHAR(255),
        old_name VARCHAR(255),
        new_email VARCHAR(255),
        new_name VARCHAR(255),
        change_type ENUM('update', 'merge', 'split', 'transaction_update') NOT NULL DEFAULT 'update',
        affected_transaction_count INT DEFAULT 0,
        changed_by VARCHAR(255),
        admin_email VARCHAR(255),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reverted_at TIMESTAMP NULL,
        is_reverted BOOLEAN DEFAULT FALSE,
        organization_id INT,
        notes TEXT,
        INDEX idx_old_email (old_email),
        INDEX idx_new_email (new_email),
        INDEX idx_changed_at (changed_at),
        INDEX idx_organization (organization_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    return NextResponse.json({
      success: true,
      message: 'donor_changes table created successfully'
    })
  } catch (error) {
    console.error('Error setting up donor_changes table:', error)
    return NextResponse.json({
      error: 'Failed to setup donor_changes table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
