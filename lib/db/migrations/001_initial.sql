CREATE TABLE IF NOT EXISTS customer_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'triaged', 'in_progress', 'resolved', 'closed', 'cancelled', 'error')),
  external_user_id TEXT NOT NULL,
  user_name TEXT,
  project_id TEXT NOT NULL,
  linear_issue_id TEXT,
  response TEXT,
  source TEXT,
  metadata TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_requests_external_user_id ON customer_requests(external_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_linear_issue_id ON customer_requests(linear_issue_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_deleted_at ON customer_requests(deleted_at);

