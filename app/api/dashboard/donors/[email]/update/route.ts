import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await requireAuth()

    const { email: encodedEmail } = await params
    const oldEmail = decodeURIComponent(encodedEmail)

    const { new_email, new_name, notes } = await request.json()

    if (!new_email && !new_name) {
      return NextResponse.json({
        error: 'At least one of new_email or new_name must be provided'
      }, { status: 400 })
    }

    const db = createClient()

    // Handle both regular email donors and anonymous donors (name_without_email_<name>)
    let whereClause: string
    let queryParams: any[]
    let isAnonymous = oldEmail.startsWith('name_without_email_')

    if (isAnonymous) {
      // Extract the name from the anonymous identifier
      const oldName = oldEmail.replace('name_without_email_', '')
      whereClause = 'donor_email IS NULL AND LOWER(donor_name) = LOWER(?)'
      queryParams = [oldName]
    } else {
      whereClause = 'LOWER(donor_email) = LOWER(?)'
      queryParams = [oldEmail]
    }

    // Get count of affected transactions and old donor info
    const countResult = await db.execute(
      `SELECT COUNT(*) as count,
              MAX(donor_name) as old_name,
              MAX(organization_id) as organization_id
       FROM donations
       WHERE ${whereClause}`,
      queryParams
    )

    const { count: affectedCount, old_name, organization_id } = countResult.rows[0] as {
      count: number
      old_name: string
      organization_id: number
    }

    if (affectedCount === 0) {
      return NextResponse.json({ error: 'No transactions found for this donor' }, { status: 404 })
    }

    // Update all transactions for this donor
    const updateFields: string[] = []
    const updateParams: any[] = []

    if (new_email !== undefined) {
      updateFields.push('donor_email = ?')
      updateParams.push(new_email || null)
    }

    if (new_name !== undefined) {
      updateFields.push('donor_name = ?')
      updateParams.push(new_name)
    }

    updateFields.push('updated_at = NOW()')
    updateParams.push(...queryParams)

    await db.execute(
      `UPDATE donations
       SET ${updateFields.join(', ')}
       WHERE ${whereClause}`,
      updateParams
    )

    // Record the change in donor_changes table
    try {
      await db.execute(
        `INSERT INTO donor_changes (
          old_email, old_name, new_email, new_name,
          change_type, affected_transaction_count,
          changed_by, admin_email, organization_id, notes
        ) VALUES (?, ?, ?, ?, 'update', ?, ?, ?, ?, ?)`,
        [
          isAnonymous ? null : oldEmail,
          old_name,
          new_email !== undefined ? (new_email || null) : (isAnonymous ? null : oldEmail),
          new_name !== undefined ? new_name : old_name,
          affectedCount,
          session.merchant_name || session.email || 'Admin',
          session.email,
          organization_id,
          notes || `Donor information updated for ${affectedCount} transaction(s)`
        ]
      )
    } catch (historyError) {
      console.error('Failed to record donor change history:', historyError)
      // Continue even if history recording fails
    }

    return NextResponse.json({
      success: true,
      affected_count: affectedCount,
      old_email: isAnonymous ? null : oldEmail,
      old_name,
      new_email: new_email !== undefined ? new_email : (isAnonymous ? null : oldEmail),
      new_name: new_name !== undefined ? new_name : old_name,
      message: `Successfully updated ${affectedCount} transaction(s)`
    })
  } catch (error) {
    console.error('Error updating donor information:', error)
    return NextResponse.json({
      error: 'Failed to update donor information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
