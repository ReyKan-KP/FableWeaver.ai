import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactFormEmail } from "@/components/emails/contact-form-email";
import { NewsletterWelcomeEmail } from "@/components/emails/newsletter-welcome-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, ...data } = body;

        let emailResponse;

        if (type === "contact") {
            emailResponse = await resend.emails.send({
                from: "FableWeaver.ai<FableWeaver.ai@resend.dev>",
                to: ["kanishakpranjal@gmail.com"],
                subject: `New Contact Form Submission from ${data.name}`,
                react: ContactFormEmail({
                    name: data.name,
                    email: data.email,
                    message: data.message,
                }),
            });

            // Send an auto-reply to the user
            await resend.emails.send({
                from: "FableWeaver.ai<FableWeaver.ai@resend.dev>",
                to: [data.email],
                subject: "Thanks for contacting FableWeaver.ai!",
                react: ContactFormEmail({
                    name: data.name,
                    isAutoReply: true,
                }),
            });
        } else if (type === "newsletter") {
            emailResponse = await resend.emails.send({
                from: "FableWeaver.ai<FableWeaver.ai@resend.dev>",
                to: [data.email],
                subject: "Welcome to FableWeaver.ai's Creative Journey! 🎭✨",
                react: NewsletterWelcomeEmail({
                    email: data.email,
                }),
            });
        }

        return NextResponse.json({ success: true, data: emailResponse });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
} 