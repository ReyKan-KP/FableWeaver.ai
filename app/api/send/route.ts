import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactFormEmail } from "@/components/emails/contact-form-email";
import { NewsletterWelcomeEmail } from "@/components/emails/newsletter-welcome-email";
import { createServerSupabaseClient } from "@/lib/supabase";
import { useSession } from "next-auth/react";

const resend = new Resend(process.env.RESEND_API_KEY);

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, ...data } = body;

        let emailResponse;
        const supabase = createServerSupabaseClient();

        if (type === "contact") {
            // Store contact form data in Supabase
            const { error: contactError } = await supabase
                .from('contact')
                .insert({
                    sender_name: data.name,
                    sender_email: data.email,
                    sender_message: data.message,
                    message_type: 'contact_form',
                    sender_id: data.user_id
                });

            if (contactError) {
                console.error("Error storing contact data:", contactError);
                throw new Error("Failed to store contact data");
            }
            
            // Send emails
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
            const { data: userData } = await supabase
                .from('user')
                .select('user_name')
                .eq('user_id', data.user_id)
                .single();

            const { error: newsletterError } = await supabase
                .from('contact')
                .insert({
                    sender_email: data.email,
                    sender_id: data.user_id,
                    message_type: 'newsletter_signup',
                    sender_name: userData?.user_name || "",
                    sender_message: "I would like to subscribe to your newsletter."
                });
            
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
        console.error("API error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
} 