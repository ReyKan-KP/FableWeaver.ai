import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PDFDocument from "pdfkit";

export async function POST(req: Request) {
    // try {
    //     // Validate session
    //     const session = await getServerSession(authOptions);
    //     if (!session?.user?.id) {
    //         return NextResponse.json(
    //             { error: "Unauthorized" },
    //             { status: 401 }
    //         );
    //     }

    //     // Parse request body
    //     const { novelId } = await req.json();
    //     if (!novelId) {
    //         return NextResponse.json(
    //             { error: "Novel ID is required" },
    //             { status: 400 }
    //         );
    //     }

    //     // Initialize Supabase client
    //     const supabase = createServerSupabaseClient();

    //     // Fetch novel and check access (owner or collaborator)
    //     const { data: novel, error: novelError } = await supabase
    //         .from("novels")
    //         .select("*")
    //         .eq("id", novelId)
    //         .single();

    //     if (novelError || !novel) {
    //         return NextResponse.json(
    //             { error: "Novel not found" },
    //             { status: 404 }
    //         );
    //     }

    //     // Check if user is owner or collaborator
    //     if (novel.user_id !== session.user.id) {
    //         const { data: collaborator, error: collabError } = await supabase
    //             .from("novel_collaborators")
    //             .select("*")
    //             .eq("novel_id", novelId)
    //             .eq("user_id", session.user.id)
    //             .single();

    //         if (collabError || !collaborator) {
    //             return NextResponse.json(
    //                 { error: "Access denied" },
    //                 { status: 403 }
    //             );
    //         }
    //     }

    //     // Fetch all chapters
    //     const { data: chapters, error: chaptersError } = await supabase
    //         .from("chapters")
    //         .select("*")
    //         .eq("novel_id", novelId)
    //         .order("chapter_number", { ascending: true });

    //     if (chaptersError) {
    //         return NextResponse.json(
    //             { error: "Failed to fetch chapters" },
    //             { status: 500 }
    //         );
    //     }

    //     if (!chapters || chapters.length === 0) {
    //         return NextResponse.json(
    //             { error: "No chapters found" },
    //             { status: 404 }
    //         );
    //     }

    //     // Create PDF document with better styling
    //     const doc = new PDFDocument({
    //         size: "A4",
    //         margins: {
    //             top: 72,
    //             bottom: 72,
    //             left: 72,
    //             right: 72,
    //         },
    //         bufferPages: true, // Enable page buffering for page numbers
    //     });

    //     try {
    //         // Set response headers
    //         const headers = new Headers();
    //         headers.set("Content-Type", "application/pdf");
    //         headers.set(
    //             "Content-Disposition",
    //             `attachment; filename="${novel.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf"`
    //         );

    //         // Create PDF content
    //         // Title page with styling
    //         doc.fontSize(36)
    //             .font("Helvetica-Bold")
    //             .text(novel.title, { align: "center" })
    //             .moveDown(2);

    //         doc.fontSize(18)
    //             .font("Helvetica")
    //             .text(`By ${session.user.name || "Anonymous"}`, { align: "center" })
    //             .moveDown(2);

    //         if (novel.description) {
    //             doc.fontSize(14)
    //                 .font("Helvetica")
    //                 .text(novel.description, {
    //                     align: "center",
    //                     width: 400,
    //                     lineGap: 10
    //                 })
    //                 .moveDown(4);
    //         }

    //         // Add metadata
    //         doc.info.Title = novel.title;
    //         doc.info.Author = session.user.name || "Anonymous";
    //         doc.info.Creator = "FableWeaver.ai";

    //         // Table of Contents with better styling
    //         doc.addPage()
    //             .fontSize(24)
    //             .font("Helvetica-Bold")
    //             .text("Table of Contents", { align: "center" })
    //             .moveDown(2);

    //         let currentPage = doc.bufferedPageRange().count;

    //         chapters.forEach((chapter) => {
    //             doc.fontSize(12)
    //                 .font("Helvetica")
    //                 .text(
    //                     `Chapter ${chapter.chapter_number}: ${chapter.title}`,
    //                     { align: "left", continued: true }
    //                 )
    //                 .text(`  ${currentPage + 1}`, { align: "right" })
    //                 .moveDown(1);
    //             currentPage += 2; // Estimate 2 pages per chapter
    //         });

    //         // Chapters with better styling
    //         chapters.forEach((chapter) => {
    //             doc.addPage()
    //                 .fontSize(24)
    //                 .font("Helvetica-Bold")
    //                 .text(`Chapter ${chapter.chapter_number}`, { align: "center" })
    //                 .moveDown(1)
    //                 .fontSize(18)
    //                 .text(chapter.title, { align: "center" })
    //                 .moveDown(2);

    //             if (chapter.summary) {
    //                 doc.fontSize(12)
    //                     .font("Helvetica-Oblique")
    //                     .text(chapter.summary, {
    //                         align: "center",
    //                         width: 400,
    //                         lineGap: 7,
    //                     })
    //                     .moveDown(2);
    //             }

    //             doc.fontSize(12)
    //                 .font("Helvetica")
    //                 .text(chapter.content, {
    //                     align: "left",
    //                     lineGap: 7,
    //                     paragraphGap: 14,
    //                 });
    //         });

    //         // Add page numbers
    //         let pageCount = doc.bufferedPageRange().count;
    //         for (let i = 0; i < pageCount; i++) {
    //             doc.switchToPage(i);
    //             if (i > 0) { // Skip page number on title page
    //                 doc.fontSize(10)
    //                     .text(
    //                         `${i + 1}`,
    //                         doc.page.width / 2 - 15,
    //                         doc.page.height - 50,
    //                         { align: "center" }
    //                     );
    //             }
    //         }

    //         // End the document
    //         doc.end();

    //         // Convert the PDF document to a buffer
    //         const chunks: Uint8Array[] = [];
    //         doc.on("data", (chunk) => chunks.push(chunk));

    //         return new Promise((resolve, reject) => {
    //             doc.on("end", () => {
    //                 const pdfBuffer = Buffer.concat(chunks);
    //                 resolve(new NextResponse(pdfBuffer, {
    //                     status: 200,
    //                     headers,
    //                 }));
    //             });
    //             doc.on("error", (err) => {
    //                 console.error("PDF generation error:", err);
    //                 reject(err);
    //             });
    //         });
    //     } catch (pdfError) {
    //         console.error("PDF creation error:", pdfError);
    //         if (pdfError instanceof Error) {
    //             return NextResponse.json(
    //                 { error: "Failed to create PDF", details: pdfError.message },
    //                 { status: 500 }
    //             );
    //         } else {
    //             return NextResponse.json(
    //                 { error: "Failed to create PDF", details: "Unknown error" },
    //                 { status: 500 }
    //             );
    //         }
    //     }
    // } catch (error) {
    //     console.error("Error generating PDF:", error);
    //     return NextResponse.json(
    //         {
    //             error: "Failed to generate PDF",
    //             details: error instanceof Error ? error.message : "Unknown error",
    //         },
    //         { status: 500 }
    //     );
    // }
} 