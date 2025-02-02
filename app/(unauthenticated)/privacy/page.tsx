"use client";

import React from "react";
import { motion } from "framer-motion";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Shield, Lock, Eye, Database, Share2, Bell } from "lucide-react";
import Image from "next/image";

const PrivacyPage = () => {
  const sections = [
    {
      icon: Shield,
      title: "Data Protection",
      content:
        "I implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction.",
    },
    {
      icon: Database,
      title: "Data Collection",
      content:
        "I collect only essential information that you provide directly, including your name, email address, and any other information you choose to provide when using FableWeaver.ai.",
    },
    {
      icon: Eye,
      title: "Data Usage",
      content:
        "Your data is used solely to provide, maintain, and improve FableWeaver.ai services, communicate with you, and enhance your storytelling experience.",
    },
    {
      icon: Share2,
      title: "Data Sharing",
      content:
        "I do not sell your personal information. Data sharing is limited to essential service providers who help operate and improve FableWeaver.ai.",
    },
    {
      icon: Bell,
      title: "Your Rights",
      content:
        "You have full rights to access, correct, or delete your personal information. You can also opt out of receiving communications from FableWeaver.ai.",
    },
    {
      icon: Lock,
      title: "Data Security",
      content:
        "Using modern security protocols and regular security audits, I ensure your data is protected during transmission and storage.",
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
                Privacy Policy
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Your privacy is my top priority. Learn how I collect, use, and
                protect your personal information on FableWeaver.ai.
              </p>
            </motion.div>

            {/* Privacy Policy Sections */}
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
                  Contact About Privacy
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or how I
                  handle your data, please contact me at{" "}
                  <a
                    href="mailto:kanishakpranjal@gmail.com"
                    className="text-primary hover:underline"
                  >
                    kanishakpranjal@gmail.com
                  </a>
                </p>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Updates to This Policy
                  </h3>
                  <p className="text-muted-foreground">
                    This privacy policy may be updated from time to time. Any
                    changes will be posted on this page with an updated revision
                    date.
                  </p>
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

export default PrivacyPage;
