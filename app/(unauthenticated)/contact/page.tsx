"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Send,
  User,
  Github,
  Linkedin,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const ContactPage = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          ...formState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast("Success!", {
        description: "Message sent successfully! I'll get back to you soon.",
      });

      // Reset form
      setFormState({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to send message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const contactLinks = [
    {
      icon: Mail,
      label: "Email",
      href: "mailto:kanishakpranjal@gmail.com",
      value: "kanishakpranjal@gmail.com",
    },
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com/ReyKan-KP",
      value: "github.com/ReyKan-KP",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/kanishaka-pranjal-070a45235/",
      value: "linkedin.com/in/kanishaka-pranjal-070a45235",
    },
    {
      icon: Globe,
      label: "Portfolio",
      href: "https://portfolio-kanishaka-pranjal.vercel.app/",
      value: "portfolio-kanishaka-pranjal.vercel.app",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-16"
          >
            {/* Logo */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                initial={{ rotate: -5 }}
                animate={{ rotate: 5 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/logo-with-text.png"
                  alt="FableWeaver.ai Logo"
                  width={500}
                  height={100}
                  className="mb-8"
                  priority
                  draggable={false}
                />
              </motion.div>
            </motion.div>

            {/* Hero Section */}
            <motion.div
              variants={itemVariants}
              className="text-center space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
                Get in Touch
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Have questions about FableWeaver.ai? I&apos;d love to hear from
                you and help with any queries you might have.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Contact Form */}
              <motion.div variants={itemVariants}>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <motion.div
                    variants={itemVariants}
                    className="bg-secondary/10 backdrop-blur-sm rounded-xl p-8 border border-border"
                  >
                    {/* Name Input */}
                    <div className="mb-6">
                      <label
                        htmlFor="name"
                        className=" text-sm font-medium mb-2 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Email Input */}
                    <div className="mb-6">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium mb-2 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formState.email}
                        onChange={(e) =>
                          setFormState({ ...formState, email: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Message Input */}
                    <div className="mb-6">
                      <label
                        htmlFor="message"
                        className="text-sm font-medium mb-2 flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Your Message
                      </label>
                      <textarea
                        id="message"
                        value={formState.message}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            message: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>

              {/* Contact Information */}
              <motion.div variants={itemVariants} className="space-y-8">
                <div className="bg-secondary/10 backdrop-blur-sm rounded-xl p-8 border border-border">
                  <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                    Connect With Me
                  </h2>
                  <div className="space-y-6">
                    {contactLinks.map((link) => (
                      <motion.a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors group"
                        whileHover={{ x: 5 }}
                      >
                        <link.icon className="w-5 h-5" />
                        <span className="flex-grow">{link.value}</span>
                      </motion.a>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary/10 backdrop-blur-sm rounded-xl p-8 border border-border">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                    Quick Response
                  </h2>
                  <p className="text-muted-foreground">
                    I aim to respond to all inquiries within 24 hours. For
                    urgent matters, please reach out via email or LinkedIn.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
