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

export default function Home() {
  const [data, setData] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();

  const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

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
    <div className="flex flex-col min-h-screen relative">
      {/* <AnimatedGradient /> */}

      {/* <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(147, 197, 253, 0.15) 0%, transparent 80%)",
          scale: scaleProgress,
          opacity: opacityProgress,
        }}
      /> */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10"
      >
        <Hero />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <Features />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <HowItWorks />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <CharacterShowcase />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
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
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <FAQ />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <Newsletter />
      </motion.div>
    </div>
  );
}
