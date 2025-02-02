"use client";

import React from "react";
import { motion } from "framer-motion";
import { WavyBackground } from "@/components/ui/wavy-background";
import {
  Scale,
  FileText,
  UserCheck,
  AlertTriangle,
  Ban,
  HelpCircle,
} from "lucide-react";

const TermsPage = () => {
  const sections = [
    {
      icon: FileText,
      title: "Agreement to Terms",
      content:
        "By accessing or using FableWeaver.ai, you agree to be bound by these Terms of Service and all applicable laws and regulations governing the platform.",
    },
    {
      icon: UserCheck,
      title: "User Responsibilities",
      content:
        "You must be at least 13 years old to use FableWeaver.ai. You are responsible for maintaining the confidentiality of your account and all activities that occur under it.",
    },
    {
      icon: Scale,
      title: "Intellectual Property",
      content:
        "While you retain rights to your original content, you grant FableWeaver.ai a license to use it for service improvement and AI model training. All AI-generated content is subject to our intellectual property terms.",
    },
    {
      icon: AlertTriangle,
      title: "Prohibited Activities",
      content:
        "Users must not engage in any illegal activities, harassment, or actions that could harm the platform or other users. I reserve the right to terminate accounts that violate these terms.",
    },
    {
      icon: Ban,
      title: "Limitation of Liability",
      content:
        "While I strive to provide reliable services, I cannot guarantee uninterrupted access. FableWeaver.ai is not liable for any damages arising from your use of the services.",
    },
    {
      icon: HelpCircle,
      title: "Changes to Terms",
      content:
        "These terms may be modified at any time. Continued use of FableWeaver.ai after changes constitutes acceptance of the modified terms.",
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
                Terms of Service
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Please read these terms carefully before using FableWeaver.ai.
                These terms govern your use of the platform.
              </p>
            </motion.div>

            {/* Terms Sections */}
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
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please
                  contact me at{" "}
                  <a
                    href="mailto:kanishakpranjal@gmail.com"
                    className="text-primary hover:underline"
                  >
                    kanishakpranjal@gmail.com
                  </a>
                </p>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Governing Law</h3>
                  <p className="text-muted-foreground">
                    These terms shall be governed by and construed in accordance
                    with applicable laws, without regard to conflicts of law
                    principles.
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

export default TermsPage;
