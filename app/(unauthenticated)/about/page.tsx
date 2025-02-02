"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Code,
  Sparkles,
  Brain,
  BookOpen,
  Users,
  Tv,
  Star,
  ChevronRight,
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const AboutPage = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  const features = [
    {
      icon: Bot,
      title: "Character Realm",
      description:
        "Create and customize unique AI characters with distinct personalities, backstories, and traits. Engage in natural conversations and watch your characters evolve through interactions.",
      demo: "/images/character-realm-demo.gif",
      link: "/character-realm",
    },
    {
      icon: BookOpen,
      title: "Story Weaver",
      description:
        "Craft intricate narratives with AI assistance. Our advanced story generation engine helps develop plots, create twists, and maintain narrative consistency throughout your stories.",
      demo: "/images/story-weaver-demo.gif",
      link: "/story-weaver",
    },
    {
      icon: Users,
      title: "Character Confluence",
      description:
        "Experience multi-character interactions where AI characters engage with each other, creating dynamic and unpredictable storylines. Perfect for developing complex character relationships.",
      demo: "/images/character-confluence-demo.gif",
      link: "/character-confluence",
    },
    {
      icon: Tv,
      title: "Weave Anime",
      description:
        "Transform your stories into anime-style narratives. Create and customize anime characters, scenes, and storylines with our specialized anime generation tools.",
      demo: "/images/weave-anime-demo.gif",
      link: "/weave-anime",
    },
  ];

  const techFeatures = [
    {
      icon: Brain,
      title: "Advanced AI Integration",
      description:
        "Powered by cutting-edge GenAI technologies, enabling natural language processing and dynamic character interactions.",
      //   techStack: ["LangChain", "OpenAI GPT-4", "Vercel AI SDK"],
    },
    {
      icon: Star,
      title: "Personalization",
      description:
        "GenAI-driven recommendation system that learns from your preferences to suggest relevant content and character interactions, improving engagement by 18%.",
      //   techStack: [
      //     "Machine Learning",
      //     "Neural Networks",
      //     "Recommendation Algorithms",
      //   ],
    },
    {
      icon: Sparkles,
      title: "Real-time Generation",
      description:
        "Fast and responsive content generation with our optimized AI pipeline, delivering instant responses and story progression.",
      //   techStack: ["WebSocket", "Server-Sent Events", "Stream Processing"],
    },
    {
      icon: Code,
      title: "Modern Architecture",
      description:
        "Built with Next.js, TypeScript, and Tailwind CSS for a robust, scalable platform with beautiful UI/UX design and optimal performance.",
      //   techStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "PostgreSQL"],
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com/ReyKan-KP",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/kanishaka-pranjal-070a45235/",
    },
    {
      icon: Mail,
      label: "Email",
      href: "mailto:kanishakpranjal@gmail.com",
    },
    {
      icon: Globe,
      label: "Portfolio",
      href: "https://portfolio-kanishaka-pranjal.vercel.app/",
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

            {/* Hero Section with Animated Background */}
            <motion.div
              variants={itemVariants}
              className="text-center space-y-6 relative"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-violet-500/20 via-transparent to-transparent blur-3xl" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
                About FableWeaver.ai
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                An innovative AI-driven storytelling platform that empowers
                creators to craft immersive narratives, develop dynamic
                characters, and bring their creative visions to life.
              </p>
              <motion.div
                className="flex justify-center gap-4 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/story-weaver"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  Try it Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 border border-primary/50 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  Contact Me <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Platform Overview with Stats */}
            <motion.div
              variants={itemVariants}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                Platform Overview
              </h2>
              <div className="text-lg text-muted-foreground max-w-3xl mx-auto space-y-4">
                <p>
                  FableWeaver.ai revolutionizes storytelling by combining
                  advanced AI technology with creative tools. The platform
                  features multiple interconnected systems: Character Realm for
                  character creation, Story Weaver for narrative development,
                  Character Confluence for multi-character interactions, and
                  Weave Anime for anime-style content creation.
                </p>
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
                  {[
                    { value: "15%", label: "Engagement Increase" },
                    { value: "20%", label: "User Retention" },
                    { value: "1000+", label: "Characters Created" },
                    { value: "500+", label: "Stories Generated" },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      className="p-4 bg-secondary/10 rounded-lg backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-2xl font-bold text-primary">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div> */}
              </div>
            </motion.div>

            {/* Interactive Core Features */}
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text text-center">
                Core Features
              </h2>
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
              >
                {features.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={itemVariants}
                    className="group relative bg-secondary/10 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() =>
                      setActiveFeature(
                        activeFeature === feature.title ? null : feature.title
                      )
                    }
                  >
                    <feature.icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                    <Link
                      href={feature.link}
                      className="mt-4 inline-flex items-center text-primary hover:underline"
                    >
                      Try it out <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                    <AnimatePresence>
                      {activeFeature === feature.title && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4"
                        >
                          <Image
                            src={feature.demo}
                            alt={`${feature.title} Demo`}
                            width={400}
                            height={225}
                            className="rounded-lg shadow-lg"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Interactive Technical Features */}
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-blue-500 text-transparent bg-clip-text text-center">
                Technical Excellence
              </h2>
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
              >
                {techFeatures.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={itemVariants}
                    className="bg-secondary/10 backdrop-blur-sm rounded-xl p-6 border border-border transition-all"
                    onHoverStart={() => setHoveredTech(feature.title)}
                    onHoverEnd={() => setHoveredTech(null)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <feature.icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                    {/* <AnimatePresence>
                      {hoveredTech === feature.title && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="mt-4 flex flex-wrap gap-2"
                        >
                          {feature.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="px-3 py-1 bg-primary/10 rounded-full text-sm text-primary"
                            >
                              {tech}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence> */}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Interactive Developer Section */}
            <motion.div
              variants={itemVariants}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                Meet the Developer
              </h2>
              <div className="text-lg text-muted-foreground max-w-3xl mx-auto space-y-4">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <Image
                    src="/images/kp.jpg"
                    alt="Kanishaka Pranjal"
                    fill
                    className="rounded-full object-cover border-4 border-primary/20"
                  />
                </div>
                <p>
                  Hi, I&apos;m Kanishaka Pranjal, a Full Stack Developer and AI
                  enthusiast currently pursuing my BTech in CSE at Indian
                  Institute of Information Technology, Sri City.
                </p>
                <p>
                  With experience in Full Stack Development at Intellify and a
                  passion for AI technology, I&apos;ve created FableWeaver.ai to
                  revolutionize digital storytelling through the power of
                  artificial intelligence.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  {socialLinks.map((link) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-secondary/10 rounded-full hover:bg-primary/10 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <link.icon className="w-6 h-6 text-primary" />
                    </motion.a>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-secondary/10 rounded-xl backdrop-blur-sm border border-border">
                  <h3 className="text-xl font-semibold mb-4">
                    Technical Expertise
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "JavaScript",
                      "TypeScript",
                      "Next.js",
                      "React",
                      "Node.js",
                      "Express.js",
                      "PostgreSQL",
                      "Tailwind CSS",
                      "LangChain",
                      "OpenAI API",
                      "Vercel AI SDK",
                      "Docker",
                    ].map((tech) => (
                      <motion.span
                        key={tech}
                        className="px-4 py-2 bg-primary/10 rounded-full text-sm text-primary"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
