import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const { data: novels, error } = await supabase
            .from("novels")
            .select("*")
            .eq("is_public", true)
            .eq("is_published", true)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Error fetching novels:", error);
            return new NextResponse("Internal Server Error", { status: 500 });
        }

        return NextResponse.json(novels || []);
    } catch (error) {
        console.error("[NOVELS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const genre = formData.get("genre") as string;
        const description = formData.get("description") as string;
        const isPublic = formData.get("is_public") === "true";
        const metadata = JSON.parse(formData.get("metadata") as string);
        const coverImage = formData.get("cover_image") as File;

        if (!title || !genre || !description) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        let coverImageUrl = "";

        // Handle cover image upload if provided
        if (coverImage) {
            const fileExt = coverImage.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("novel-covers")
                .upload(fileName, coverImage);

            if (uploadError) {
                console.error("Error uploading cover image:", uploadError);
                return new NextResponse("Error uploading cover image", { status: 500 });
            }

            const { data: { publicUrl } } = supabase.storage
                .from("novel-covers")
                .getPublicUrl(fileName);

            coverImageUrl = publicUrl;
        }

        // Create novel record
        const { data: novel, error } = await supabase
            .from("novels")
            .insert([
                {
                    title,
                    genre,
                    description,
                    user_id: session.user.id,
                    cover_image: coverImageUrl,
                    is_public: isPublic,
                    metadata,
                    chapter_count: 0,
                    total_words: 0,
                    is_published: false,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating novel:", error);
            return new NextResponse("Error creating novel", { status: 500 });
        }

        return NextResponse.json(novel);
    } catch (error) {
        console.error("[NOVELS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 