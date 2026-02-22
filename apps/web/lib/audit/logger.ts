import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/api-utils";

// Initialize a supabase client with the service role key to bypass RLS when inserting logs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export interface AuditLogPayload {
    action: string;
    resource_type: string;
    resource_id?: string;
    old_data?: Record<string, any> | null;
    new_data?: Record<string, any> | null;
}

/**
 * Centrally log an administrative or significant system action to the `audit_logs` table.
 * 
 * Automatically captures the `actor_id` (from the Request JWT), `ip_address`, and `user_agent`.
 */
export async function logAdminAction(
    request: Request,
    payload: AuditLogPayload
): Promise<void> {
    try {
        // 1. Determine actor (the user invoking the action)
        // Supports both the new Stellar JWT cookie approach and standard headers
        const actorId = await getUserId(request);

        // 2. Extract network/client contextual info
        const ipAddress =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        const userAgent = request.headers.get("user-agent") || "unknown";

        // 3. Insert into Supabase using the service role client
        const { error } = await supabaseAdmin.from("audit_logs").insert({
            actor_id: actorId, // can be NULL if system action
            action: payload.action,
            resource_type: payload.resource_type,
            resource_id: payload.resource_id,
            old_data: payload.old_data || null,
            new_data: payload.new_data || null,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        if (error) {
            console.error("Failed to insert audit log:", error);
            // We purposefully do not throw here, as audit logging failure
            // shouldn't normally break the primary user action, but we log the error.
        }
    } catch (err) {
        console.error("Unexpected error in logAdminAction:", err);
    }
}
