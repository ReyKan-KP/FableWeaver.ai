import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { novelId } = await req.json();
        if (!novelId) {
            return NextResponse.json({ error: "Novel ID is required" }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        // Fetch novel and chapters
        const [novelResponse, chaptersResponse] = await Promise.all([
            supabase.from("novels").select("*").eq("id", novelId).single(),
            supabase.from("chapters").select("*").eq("novel_id", novelId).order("chapter_number", { ascending: true })
        ]);

        if (novelResponse.error || !novelResponse.data) {
            return NextResponse.json({ error: "Novel not found" }, { status: 404 });
        }

        if (chaptersResponse.error || !chaptersResponse.data?.length) {
            return NextResponse.json({ error: "No chapters found" }, { status: 404 });
        }

        const novel = novelResponse.data;
        const chapters = chaptersResponse.data;

        // Create PDF document
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        // Set properties
        doc.setProperties({
            title: novel.title,
            author: session.user.name || "Anonymous",
            creator: "FableWeaver.ai",
            subject: "Novel Export",
            keywords: "novel, story, fableweaver"
        });

        // Helper function to add text with word wrap
        const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return lines.length;
        };

        // Title Page
        doc.setFontSize(24);
        doc.text(novel.title, doc.internal.pageSize.width / 2, 40, { align: "center" });

        doc.setFontSize(16);
        doc.text(`By ${session.user.name || "Anonymous"}`, doc.internal.pageSize.width / 2, 55, { align: "center" });

        if (novel.description) {
            doc.setFontSize(12);
            const descriptionLines = addWrappedText(
                novel.description,
                20,
                80,
                doc.internal.pageSize.width - 40
            );
        }

        // Table of Contents
        doc.addPage();
        doc.setFontSize(20);
        doc.text("Table of Contents", doc.internal.pageSize.width / 2, 20, { align: "center" });

        let currentY = 40;
        let currentPage = 3; // Start from page 3 (after title and TOC)

        // Calculate estimated pages for each chapter
        const chapterPages = chapters.map(chapter => {
            const titleLines = 2; // Chapter number and title
            const summaryLines = chapter.summary
                ? doc.splitTextToSize(chapter.summary, doc.internal.pageSize.width - 40).length
                : 0;
            const contentLines = chapter.content
                ? doc.splitTextToSize(chapter.content.trim(), doc.internal.pageSize.width - 40).length
                : 0;

            // Calculate total lines and convert to pages
            // Assuming ~40 lines per page (with margins)
            const totalLines = titleLines + summaryLines + contentLines;
            return Math.ceil(totalLines / 40);
        });

        // Update TOC with calculated page numbers
        let runningPage = 3; // Start from page 3
        chapters.forEach((chapter, index) => {
            doc.setFontSize(12);
            const title = `Chapter ${chapter.chapter_number}: ${chapter.title}`;
            doc.text(title, 20, currentY);
            doc.text(runningPage.toString(), doc.internal.pageSize.width - 25, currentY);
            currentY += 10;

            runningPage += chapterPages[index];

            if (currentY > doc.internal.pageSize.height - 20) {
                doc.addPage();
                currentY = 20;
            }
        });

        // Chapter Content
        chapters.forEach((chapter) => {
            doc.addPage();

            // Chapter title
            doc.setFontSize(20);
            doc.text(`Chapter ${chapter.chapter_number}`, doc.internal.pageSize.width / 2, 20, { align: "center" });

            doc.setFontSize(16);
            doc.text(chapter.title, doc.internal.pageSize.width / 2, 30, { align: "center" });

            let contentY = 50;
            const pageWidth = doc.internal.pageSize.width - 40; // Margins on both sides
            const pageHeight = doc.internal.pageSize.height - 20; // Bottom margin
            const lineHeight = 7; // Height per line in mm

            // Chapter summary
            if (chapter.summary) {
                doc.setFontSize(12);
                doc.setFont("helvetica", "italic");
                const summaryLines = doc.splitTextToSize(chapter.summary, pageWidth);

                for (let i = 0; i < summaryLines.length; i++) {
                    if (contentY > pageHeight) {
                        doc.addPage();
                        contentY = 20;
                    }
                    doc.text(summaryLines[i], 20, contentY);
                    contentY += lineHeight;
                }

                contentY += 10; // Extra space after summary
                doc.setFont("helvetica", "normal");
            }

            // Chapter content
            if (chapter.content) {
                doc.setFontSize(12);
                const contentLines = doc.splitTextToSize(chapter.content.trim(), pageWidth);

                for (let i = 0; i < contentLines.length; i++) {
                    if (contentY > pageHeight) {
                        doc.addPage();
                        contentY = 20;
                    }
                    doc.text(contentLines[i], 20, contentY);
                    contentY += lineHeight;
                }
            }
        });

        // Add page numbers
        const totalPages = doc.getNumberOfPages();
        for (let i = 2; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(
                String(i),
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: "center" }
            );
        }

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const filename = `${novel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

        const headers = new Headers({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length.toString()
        });

        return new NextResponse(pdfBuffer, { status: 200, headers });
    } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json({
            error: 'Failed to generate PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 