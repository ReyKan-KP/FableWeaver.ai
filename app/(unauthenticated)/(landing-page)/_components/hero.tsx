"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { WavyBackground } from "@/components/ui/wavy-background";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export function Hero() {
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

  return (
    <motion.div
      className="min-h-screen relative z-0 flex items-center justify-center"
      style={{ opacity, scale }}
    >
      <WavyBackground className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 sm:py-24">
          <ContainerScroll
            titleComponent={
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text mb-6">
                  Fable Weaver
                </h1>
                <motion.p
                  className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed bg-gradient-to-r from-gray-600 via-pink-300 to-teal-800 text-transparent bg-clip-text mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Where AI weaves personalized anime recommendations into your
                  unique story tapestry
                </motion.p>
              </motion.div>
            }
          >
            <motion.div
              className="w-full max-w-4xl mx-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/images/hero.svg"
                alt="hero"
                width={1400}
                height={720}
                className="w-full h-auto rounded-2xl object-cover transition-all duration-300"
                draggable={false}
              />
            </motion.div>
          </ContainerScroll>
        </div>
      </WavyBackground>
    </motion.div>
  );
}
