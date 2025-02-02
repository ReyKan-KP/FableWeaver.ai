"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { Hero } from "./(landing-page)/_components/hero";
import Features from "./(landing-page)/_components/features";
import HowItWorks from "./(landing-page)/_components/how-it-works";
import Newsletter from "./(landing-page)/_components/newsletter";
// import Testimonials from "./(landing-page)/_components/testimonials";
import FAQ from "./(landing-page)/_components/faq";
import CharacterShowcase from "./(landing-page)/_components/character-showcase";
import InteractiveDemo from "./(landing-page)/_components/interactive-demo";
import { AnimatedGradient } from "@/components/ui/animated-gradient";

// Define theme constants for consistent styling
const THEME = {
  colors: {
    primary: "from-violet-600 via-blue-600 to-teal-500",
    secondary: "from-purple-600 to-blue-600",
    accent: "from-teal-500 to-blue-500",
    background:
      "bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
    text: "text-gray-900 dark:text-white",
  },
  animation: {
    duration: 0.8,
    delay: 0.2,
    ease: [0.43, 0.13, 0.23, 0.96],
  },
};

export default function Home() {
  const [data, setData] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();

  const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/initialize-backend");
        const result = await response.json();
        setData(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error fetching data:", error);
        setData("Failed to fetch data");
      }
    };

    fetchData();
  }, []);

  return (
    <div className={`flex flex-col min-h-screen relative ${THEME.colors.text}`}>
      {/* <AnimatedGradient className="fixed inset-0 pointer-events-none opacity-40" /> */}

      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at center, rgba(147, 197, 253, 0.15) 0%, transparent 80%)`,
          scale: scaleProgress,
          opacity: opacityProgress,
        }}
      />

      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: THEME.animation.duration }}
          className="relative"
        >
          <Hero />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: THEME.animation.duration,
            ease: THEME.animation.ease,
          }}
          className="relative py-20"
        >
          <Features />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: THEME.animation.duration,
            ease: THEME.animation.ease,
          }}
          className="relative py-20"
        >
          <HowItWorks />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: THEME.animation.duration,
            ease: THEME.animation.ease,
          }}
          className="relative py-20"
        >
          <CharacterShowcase />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: THEME.animation.duration,
            ease: THEME.animation.ease,
          }}
          className="relative py-20"
        >
          <InteractiveDemo />
        </motion.div>

        {/* <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <Testimonials />
        </motion.div> */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: THEME.animation.duration,
            ease: THEME.animation.ease,
          }}
          className="relative py-20"
        >
          <FAQ />
        </motion.div>

        {/* <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: THEME.animation.duration,
            ease: THEME.animation.ease,
          }}
          className="relative py-20"
        >
          <Newsletter />
        </motion.div> */}
      </div>
    </div>
  );
}
