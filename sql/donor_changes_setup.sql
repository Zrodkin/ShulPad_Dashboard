-- Create donor_changes table for tracking donor information history
-- This allows admins to see all changes made to donor information and revert if needed

CREATE TABLE IF NOT EXISTS donor_changes (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Old donor information
  old_email VARCHAR(255),
  old_name VARCHAR(255),

  -- New donor information
  new_email VARCHAR(255),
  new_name VARCHAR(255),

  -- Change metadata
  change_type ENUM('update', 'merge', 'split', 'transaction_update') NOT NULL DEFAULT 'update',
  affected_transaction_count INT DEFAULT 0,

  -- Who made the change
  changed_by VARCHAR(255),
  admin_email VARCHAR(255),

  -- Timestamps
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reverted_at TIMESTAMP NULL,
  is_reverted BOOLEAN DEFAULT FALSE,

  -- Organization context
  organization_id INT,

  -- Optional notes/reason for change
  notes TEXT,

  INDEX idx_old_email (old_email),
  INDEX idx_new_email (new_email),
  INDEX idx_changed_at (changed_at),
  INDEX idx_organization (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
