-- 010_create_audit_logs.sql
-- Create the audit_logs table for comprehensive action tracking

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- The user/admin performing the action
    action VARCHAR(255) NOT NULL,                               -- Action performed (e.g., 'UPDATE_USER', 'DELETE_LISTING')
    resource_type VARCHAR(255) NOT NULL,                        -- Resource affected (e.g., 'user', 'listing')
    resource_id VARCHAR(255),                                   -- ID of the affected resource
    old_data JSONB,                                             -- State before the action
    new_data JSONB,                                             -- State after the action
    ip_address VARCHAR(45),                                     -- IP address of the actor
    user_agent TEXT,                                            -- Browser/client info
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin or internal service role can view audit logs
-- Normal users cannot view or insert directly (inserts happen via service_role in the backend)
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        (auth.jwt() ->> 'role') = 'super_admin' 
        OR 
        (auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
    );

-- Indexes for efficient searching and reporting
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Add retention policy helper (optional: can be called via pg_cron later)
-- CREATE OR REPLACE FUNCTION delete_old_audit_logs(retention_days integer)
-- RETURNS void AS $$
-- BEGIN
--    DELETE FROM public.audit_logs WHERE created_at < NOW() - (retention_days || ' days')::interval;
-- END;
-- $$ LANGUAGE plpgsql;
