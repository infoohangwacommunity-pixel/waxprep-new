CREATE TABLE data_export_requests (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE, wax_id TEXT NOT NULL, format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'text', 'csv')), collections TEXT[], status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')), export_data JSONB, file_url TEXT, requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); CREATE INDEX idx_data_export_requests_student ON data_export_requests(student_id); CREATE INDEX idx_data_export_requests_wax_id ON data_export_requests(wax_id); CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);

CREATE TABLE data_deletion_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    wax_id TEXT,
    deletion_type TEXT NOT NULL CHECK (deletion_type IN ('soft', 'hard', 'partial')),
    verification_method TEXT,
    verification_data JSONB,
    deleted_collections TEXT[],
    deleted_count JSONB,
    requested_by TEXT,
    reason TEXT,
    performed_by TEXT,
    performed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_data_deletion_audit_wax_id ON data_deletion_audit(wax_id);

CREATE TABLE compliance_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    wax_id TEXT,
    hold_type TEXT NOT NULL CHECK (hold_type IN ('legal', 'investigation', 'account_dispute', 'minor_status', 'other')),
    reason TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_compliance_holds_wax_id ON compliance_holds(wax_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_audit_log' AND column_name = 'data_deletion_id') THEN
        ALTER TABLE identity_audit_log ADD COLUMN data_deletion_id UUID REFERENCES data_deletion_audit(id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_identity_audit_log_data_deletion ON identity_audit_log(data_deletion_id);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_data_export_requests_updated_at ON data_export_requests;
CREATE TRIGGER update_data_export_requests_updated_at BEFORE UPDATE ON data_export_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_compliance_holds_updated_at ON compliance_holds;
CREATE TRIGGER update_compliance_holds_updated_at BEFORE UPDATE ON compliance_holds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
