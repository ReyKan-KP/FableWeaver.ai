"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Github,
  Twitter,
  Mail,
  BookOpen,
  Users,
  Bot,
  Tv,
  User,
  MessageSquare,
  Sparkles,
  Star,
  Heart,
  ExternalLink,
  Linkedin,
  Loader2,
  Wand2,
  Handshake,
  Search,
  NotebookPen
} from "lucide-react";
import { toast } from "sonner";
import { CgFeed as FeedIcon } from "react-icons/cg";
import { useSession } from "next-auth/react";

interface FooterLink {
  href: string;
  label: string;
  icon?: React.ElementType;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const Footer = () => {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_id: session?.user?.id, type: "newsletter" }),
      });

      if (!response.ok) throw new Error("Failed to subscribe");

      setEmail("");
      toast("Subscribed!", {
        description: "You've been successfully subscribed to our newsletter",
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Error", {
        description: "Failed to subscribe. Please try again later.",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const mainLinks: FooterSection[] = [
    {
      title: "Create",
      links: [
        { href: "/story-weaver", label: "Story Weaver", icon:  NotebookPen, },
        { href: "/character-realm", label: "Character Realm", icon: Bot },
        { href: "/lore-lens", label: "Lore Lens", icon: Wand2 },
        { href: "/fable-trail", label: "Fable Sanctum", icon: BookOpen },
      ],
    },
    {
      title: "Connect",
      links: [
        { href: "/thread-tapestry", label: "Thread Tapestry", icon: FeedIcon },
        { href: "/tale-tethers", label: "Tale Tethers", icon: Handshake },
        {
          href: "/character-confluence",
          label: "Character Confluence",
          icon: Users,
        },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About Us", icon: User },
        { href: "/contact", label: "Contact Us", icon: MessageSquare },
        {
          href: "https://portfolio-kanishaka-pranjal.vercel.app/",
          label: "Portfolio",
          icon: ExternalLink,
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/cookies", label: "Cookie Policy" },
      ],
    },
  ];

  const socialLinks: Required<Pick<FooterLink, "href" | "icon" | "label">>[] = [
    { href: "https://github.com/ReyKan-KP", icon: Github, label: "GitHub" },
    {
      href: "https://www.linkedin.com/in/kanishaka-pranjal-070a45235/",
      icon: Linkedin,
      label: "LinkedIn",
    },
    { href: "mailto:kanishakpranjal@gmail.com", icon: Mail, label: "Email" },
  ];

  return (
    <footer className="w-full mt-auto bg-gradient-to-b from-background via-background/80 to-background border-t border-border">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        {/* Logo and Description */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-[280px] sm:max-w-sm"
          >
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              FableWeaver.ai
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
              Craft your narrative universe with AI-powered storytelling. Create characters, weave tales, and connect with fellow creators.
            </p>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full sm:w-auto min-w-[280px] sm:min-w-[320px] md:min-w-[380px]"
          >
            <div className=" backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-border">
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Join the Storytelling Community
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Subscribe for creative tips, feature updates, and storytelling inspiration.
              </p>
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="sr-only">Subscribing...</span>
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12">
          {mainLinks.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">
                {section.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                    >
                      {link.icon && (
                        <link.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-primary transition-colors duration-200" />
                      )}
                      {link.label}
                      {link.href.startsWith("http") && (
                        <ExternalLink className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 sm:pt-8 border-t border-border">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 sm:gap-6"
          >
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label={social.label}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs sm:text-sm text-muted-foreground"
          >
            <p className="flex items-center justify-center gap-1 sm:gap-2">
              Made with{" "}
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 animate-pulse" />{" "}
              by Kanishaka Pranjal
              <span className="mx-1 sm:mx-2">•</span>©{" "}
              {new Date().getFullYear()} All rights reserved
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
