-- Rename team_id column to project_id in customer_requests table
ALTER TABLE customer_requests RENAME COLUMN team_id TO project_id;

