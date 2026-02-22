import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit
 * 
 * Search, filter, and fetch audit logs for reporting.
 * Requires administrator privileges.
 */
export async function GET(request: Request) {
    try {
        // 1. Verify user authentication and admin status
        const supabaseSession = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabaseSession.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Example naive admin check – adapt to your exact RBAC logic:
        // (You might check `user.app_metadata.role === 'super_admin'` or a `user_roles` table here)
        const isAdmin =
            user.app_metadata?.role === "super_admin" ||
            user.user_metadata?.is_admin === "true" ||
            user.user_metadata?.is_admin === true;

        if (!isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: Admin access required to view audit logs" },
                { status: 403 }
            );
        }

        // 2. Parse query parameters for searching
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");
        const actor_id = searchParams.get("actor_id");
        const resource_type = searchParams.get("resource_type");
        const start_date = searchParams.get("start_date");
        const end_date = searchParams.get("end_date");

        // Pagination
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // 3. Build the Supabase query
        // We use the service client if RLS is strict, or the session client if RLS allows admins.
        // The policy in the migration allows admins, so session client is fine.
        let query = supabaseSession
            .from("audit_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (action) {
            query = query.eq("action", action);
        }
        if (actor_id) {
            query = query.eq("actor_id", actor_id);
        }
        if (resource_type) {
            query = query.eq("resource_type", resource_type);
        }
        if (start_date) {
            query = query.gte("created_at", start_date);
        }
        if (end_date) {
            query = query.lte("created_at", end_date);
        }

        // 4. Execute query
        const { data: logs, error, count } = await query;

        if (error) {
            console.error("Audit fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: logs,
            meta: {
                total: count,
                limit,
                offset,
            }
        });
    } catch (err: unknown) {
        console.error("Audit API Error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
