export const CUSTOMER_REQUESTS_TABLE = "customer_requests"

export const INITIAL_MIGRATION = `
CREATE TABLE IF NOT EXISTS ${CUSTOMER_REQUESTS_TABLE} (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'triaged', 'in_progress', 'resolved', 'closed', 'cancelled', 'error')),
  external_user_id TEXT NOT NULL,
  user_name TEXT,
  team_id TEXT NOT NULL,
  linear_issue_id TEXT,
  response TEXT,
  source TEXT,
  metadata TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_requests_external_user_id ON ${CUSTOMER_REQUESTS_TABLE}(external_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON ${CUSTOMER_REQUESTS_TABLE}(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_linear_issue_id ON ${CUSTOMER_REQUESTS_TABLE}(linear_issue_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_deleted_at ON ${CUSTOMER_REQUESTS_TABLE}(deleted_at);
`

