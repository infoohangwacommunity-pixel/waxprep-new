DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'deleted_at') THEN
        ALTER TABLE students ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'deletion_reason') THEN
        ALTER TABLE students ADD COLUMN deletion_reason TEXT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'identity_audit_log' AND indexdef LIKE '%data_deletion_id%') THEN
        CREATE INDEX idx_identity_audit_log_data_deletion ON identity_audit_log(data_deletion_id);
    END IF;
END $$;
