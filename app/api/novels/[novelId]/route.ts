import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface Chapter {
    id: string;
    title: string;
    content: string;
    summary: string;
    chapter_number: number;
    word_count: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
    request: Request,
    { params }: { params: { novelId: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const { data: novel, error } = await supabase
            .from("novels")
            .select(`
                *,
                chapters (
                    id,
                    title,
                    content,
                    summary,
                    chapter_number,
                    word_count,
                    is_published,
                    created_at,
                    updated_at
                )
            `)
            .eq("id", params.novelId)
            .single();

        if (error) {
            console.error("Error fetching novel:", error);
            return new NextResponse("Internal Server Error", { status: 500 });
        }

        // Only check if the novel is public
        if (!novel.is_public) {
            return new NextResponse("Novel not found", { status: 404 });
        }

        // Filter out unpublished chapters for public novels
        if (novel.chapters) {
            novel.chapters = novel.chapters.filter((chapter: Chapter) => chapter.is_published);
        }

        return NextResponse.json(novel);
    } catch (error) {
        console.error("[NOVEL_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { novelId: string } }
) {
    try {
        console.log("Starting PUT request for novel:", params.novelId);
        const supabase = createRouteHandlerClient({ cookies });

        const session = await getServerSession(authOptions)
        console.log("Session user:", session?.user?.id);

        if (!session?.user?.id) {
            console.log("No authenticated user found");
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Check if novel exists and belongs to user
        console.log("Fetching existing novel...");
        const { data: existingNovel, error: fetchError } = await supabase
            .from("novels")
            .select("*")
            .eq("id", params.novelId)
            .single();

        if (fetchError) {
            console.error("Error fetching novel:", fetchError);
            return NextResponse.json({ error: "Failed to fetch novel" }, { status: 500 });
        }

        if (!existingNovel) {
            console.log("Novel not found:", params.novelId);
            return NextResponse.json({ error: "Novel not found" }, { status: 404 });
        }

        console.log("Existing novel:", {
            id: existingNovel.id,
            user_id: existingNovel.user_id,
            title: existingNovel.title
        });
        console.log("Current user:", session.user.id);

        if (existingNovel.user_id !== session.user.id) {
            console.log("Unauthorized: Novel belongs to different user");
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        console.log("Processing form data...");
        const formData = await request.formData();
        const title = formData.get("title") as string;
        const genre = formData.get("genre") as string;
        const description = formData.get("description") as string;
        const isPublic = formData.get("is_public") === "true";
        const metadata = JSON.parse(formData.get("metadata") as string);
        const coverImage = formData.get("cover_image") as File;
        const removeImage = formData.get("removeImage") === "true";

        console.log("Form data received:", {
            title,
            genre,
            isPublic,
            hasImage: !!coverImage,
            removeImage,
            metadataReceived: !!metadata
        });

        if (!title || !genre || !description) {
            console.log("Missing required fields:", { title: !!title, genre: !!genre, description: !!description });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let coverImageUrl = existingNovel.cover_image;

        try {
            // Handle cover image changes
            if (removeImage) {
                console.log("Removing existing cover image...");
                if (existingNovel.cover_image) {
                    const fileName = existingNovel.cover_image.split("/").pop();
                    console.log("Removing file:", fileName);
                    if (fileName) {
                        const { error: removeError } = await supabase.storage
                            .from("novel-covers")
                            .remove([fileName]);

                        if (removeError) {
                            console.error("Error removing old cover image:", removeError);
                        }
                    }
                }
                coverImageUrl = "";
            } else if (coverImage && coverImage instanceof Blob) {
                // Validate image
                if (!coverImage.type.startsWith("image/")) {
                    return NextResponse.json(
                        { error: "File must be an image" },
                        { status: 400 }
                    );
                }

                if (coverImage.size > 5 * 1024 * 1024) {
                    return NextResponse.json(
                        { error: "File size must be less than 5MB" },
                        { status: 400 }
                    );
                }

                // Delete existing cover image if it exists
                if (existingNovel.cover_image) {
                    const oldFileName = existingNovel.cover_image.split("/").pop();
                    if (oldFileName) {
                        const { error: removeError } = await supabase.storage
                            .from("novel-covers")
                            .remove([oldFileName]);

                        if (removeError) {
                            console.error("Error removing old cover image:", removeError);
                        }
                    }
                }

                // Convert the image data to a Buffer
                const arrayBuffer = await coverImage.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const fileExt = coverImage.type.split("/")[1];
                const fileName = `novel-${session.user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("novel-covers")
                    .upload(fileName, buffer, {
                        contentType: coverImage.type,
                        cacheControl: "3600",
                        upsert: true,
                    });

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    return NextResponse.json({
                        error: "Failed to upload cover image",
                        details: uploadError
                    }, { status: 500 });
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("novel-covers")
                    .getPublicUrl(fileName);

                coverImageUrl = publicUrl;
            }

            console.log("Updating novel record...");
            const updateData = {
                title,
                genre,
                description,
                cover_image: coverImageUrl,
                is_public: isPublic,
                metadata,
                updated_at: new Date().toISOString(),
            };
            console.log("Update data:", updateData);

            const { data: novel, error: updateError } = await supabase
                .from("novels")
                .update(updateData)
                .eq("id", params.novelId)
                .select()
                .single();

            if (updateError) {
                console.error("Error updating novel:", updateError);
                return NextResponse.json({
                    error: "Failed to update novel",
                    details: updateError
                }, { status: 500 });
            }

            console.log("Novel updated successfully:", novel);
            return NextResponse.json(novel);
        } catch (error) {
            console.error("Error in image processing:", error);
            return NextResponse.json({
                error: "Failed to process image",
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    } catch (error) {
        console.error("[NOVEL_PUT] Unhandled error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { novelId: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Check if novel exists and belongs to user
        const { data: novel, error: fetchError } = await supabase
            .from("novels")
            .select("*")
            .eq("id", params.novelId)
            .single();

        if (fetchError || !novel) {
            return new NextResponse("Novel not found", { status: 404 });
        }

        if (novel.user_id !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Delete cover image if it exists
        if (novel.cover_image) {
            const fileName = novel.cover_image.split("/").pop();
            if (fileName) {
                await supabase.storage.from("novel-covers").remove([fileName]);
            }
        }

        // Delete novel record
        const { error } = await supabase
            .from("novels")
            .delete()
            .eq("id", params.novelId);

        if (error) {
            console.error("Error deleting novel:", error);
            return new NextResponse("Error deleting novel", { status: 500 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[NOVEL_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 