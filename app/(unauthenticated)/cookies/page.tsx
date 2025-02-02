"use client";

import React from "react";
import { motion } from "framer-motion";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Cookie, Shield, Settings, Info } from "lucide-react";

const CookiesPage = () => {
  const sections = [
    {
      icon: Cookie,
      title: "What Are Cookies",
      content:
        "Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.",
    },
    {
      icon: Shield,
      title: "How We Use Cookies",
      content:
        "We use cookies to enhance your experience on our platform, including: remembering your login details, understanding how you use our services, and providing personalized content and recommendations.",
    },
    {
      icon: Settings,
      title: "Managing Cookies",
      content:
        "You can control and manage cookies in your browser settings. You can choose to accept or decline cookies, though declining some cookies may impact your experience on our site.",
    },
    {
      icon: Info,
      title: "Types of Cookies We Use",
      content:
        "Essential cookies for site functionality, analytics cookies to improve our service, and preference cookies to remember your settings.",
    },
  ];

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
            {/* Hero Section */}
            <motion.div
              variants={itemVariants}
              className="text-center space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
                Cookie Policy
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Understanding how we use cookies to improve your experience on
                FableWeaver.ai
              </p>
            </motion.div>

            {/* Cookie Policy Sections */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {sections.map((section) => (
                <motion.div
                  key={section.title}
                  variants={itemVariants}
                  className="bg-secondary/10 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-primary/50 transition-colors"
                >
                  <section.icon className="w-10 h-10 text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-3">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground">{section.content}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Additional Information */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="bg-secondary/10 backdrop-blur-sm rounded-xl p-8 border border-border">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                  Your Privacy Matters
                </h2>
                <p className="text-muted-foreground mb-4">
                  We respect your privacy and are committed to being transparent
                  about our use of cookies. You can always change your cookie
                  preferences by adjusting your browser settings.
                </p>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Cookie Duration</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>
                      Session Cookies: These expire when you close your browser
                    </li>
                    <li>
                      Persistent Cookies: These remain on your device for a set
                      period
                    </li>
                    <li>
                      Third-party Cookies: These are placed by external services
                      we use
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CookiesPage;
