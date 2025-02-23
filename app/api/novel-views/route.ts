import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;
// Record a novel view
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const { novel_id } = body;

        if (!novel_id) {
            return NextResponse.json(
                { error: "Novel ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Get client IP and user agent
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // Check for recent views (within last 30 minutes) from the same user/IP
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        const { data: recentViews } = await supabase
            .from("novel_views")
            .select("*")
            .eq("novel_id", novel_id)
            .eq("ip_address", ip)
            .gte("viewed_at", thirtyMinutesAgo)
            .limit(1);

        // If there's a recent view, don't create a new one
        if (recentViews && recentViews.length > 0) {
            return NextResponse.json({ success: true, message: "Recent view exists" });
        }

        const { error } = await supabase.from("novel_views").insert({
            novel_id,
            user_id: session?.user?.id || null,
            ip_address: ip,
            user_agent: userAgent,
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error recording view:", error);
        return NextResponse.json(
            { error: "Failed to record view" },
            { status: 500 }
        );
    }
}

// Get novel views statistics
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");
        const period = searchParams.get("period") || "all"; // all, today, week, month

        if (!novelId) {
            return NextResponse.json(
                { error: "Novel ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        let query = supabase
            .from("novel_views")
            .select("*", { count: "exact" })
            .eq("novel_id", novelId);

        // Add time period filter
        const now = new Date();
        switch (period) {
            case "today":
                query = query.gte("viewed_at", now.toISOString().split("T")[0]);
                break;
            case "week":
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                query = query.gte("viewed_at", weekAgo.toISOString());
                break;
            case "month":
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                query = query.gte("viewed_at", monthAgo.toISOString());
                break;
        }

        const { count, error } = await query;

        if (error) throw error;

        // Get unique viewers count
        const { data: uniqueViewers, error: uniqueError } = await supabase
            .from("novel_views")
            .select("user_id, ip_address")
            .eq("novel_id", novelId)
            .not("user_id", "is", null);

        if (uniqueError) throw uniqueError;

        const uniqueUsers = new Set(uniqueViewers?.map((v) => v.user_id));
        const uniqueIPs = new Set(uniqueViewers?.map((v) => v.ip_address));

        return NextResponse.json({
            total_views: count,
            unique_users: uniqueUsers.size,
            unique_ips: uniqueIPs.size,
        });
    } catch (error) {
        console.error("Error fetching views:", error);
        return NextResponse.json(
            { error: "Failed to fetch views" },
            { status: 500 }
        );
    }
} 