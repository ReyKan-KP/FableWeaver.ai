"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { Hero } from "./(landing-page)/_components/hero";
import Features from "./(landing-page)/_components/features";
import HowItWorks from "./(landing-page)/_components/how-it-works";
import Newsletter from "./(landing-page)/_components/newsletter";
import AnimeRecommendationFlow from "./(landing-page)/_components/flow";

export default function Home() {
  const [data, setData] = useState<string | null>(null);

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
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Hero />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Features />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <HowItWorks />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <AnimeRecommendationFlow />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <Newsletter />
      </motion.div>
    </div>
  );
}
