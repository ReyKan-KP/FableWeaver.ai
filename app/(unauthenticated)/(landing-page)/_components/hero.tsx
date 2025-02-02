"use client";
import React, { useState } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { WavyBackground } from "@/components/ui/wavy-background";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";

// Theme constants for consistent styling
const THEME = {
  colors: {
    primary: "from-violet-600 via-blue-600 to-teal-500",
    secondary: "from-purple-600 to-blue-600",
    accent: "from-teal-500 to-blue-500",
    text: {
      primary: "text-gray-900 dark:text-white",
      secondary: "text-gray-600 dark:text-gray-300",
    },
  },
  animation: {
    duration: 0.8,
    delay: 0.2,
    ease: [0.43, 0.13, 0.23, 0.96],
  },
};

export function Hero() {
  const { scrollY } = useScroll();
  const [isHovered, setIsHovered] = useState(false);

  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
  const y = useTransform(scrollY, [0, 300], [0, 100]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(mouseY, [-300, 300], [15, -15]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-300, 300], [-15, 15]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left - width / 2);
    mouseY.set(clientY - top - height / 2);
  };

  return (
    <motion.div
      className="min-h-[85vh] sm:min-h-[90vh] relative z-0 flex items-center justify-center overflow-hidden py-8 sm:py-0"
      style={{ opacity, scale, y }}
      onMouseMove={handleMouseMove}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <WavyBackground
        className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8"
        colors={["#c084fc", "#60a5fa", "#2dd4bf"]}
        animate={{
          backgroundPosition: isHovered
            ? ["0% 0%", "100% 100%"]
            : ["0% 0%", "0% 0%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="flex flex-col items-center justify-center py-8 sm:py-16 md:py-20 lg:py-24">
          <ContainerScroll
            titleComponent={
              <motion.div
                className="text-center space-y-4 sm:space-y-6 md:space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: THEME.animation.duration,
                  ease: THEME.animation.ease,
                }}
              >
                <motion.h1
                  className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight bg-gradient-to-r ${THEME.colors.primary} text-transparent bg-clip-text px-4 sm:px-0`}
                  style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    transformPerspective: 1000,
                  }}
                >
                  FableWeaver.ai
                </motion.h1>
                <motion.p
                  className={`text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-[90%] sm:max-w-2xl md:max-w-3xl mx-auto leading-relaxed ${THEME.colors.text.secondary} px-4 sm:px-6`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: THEME.animation.delay,
                    duration: THEME.animation.duration,
                  }}
                >
                  Where AI Weaves Your Stories to Life
                </motion.p>
                <motion.div
                  className="flex gap-4 sm:gap-6 justify-center mt-6 sm:mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: THEME.animation.delay * 2,
                    duration: THEME.animation.duration,
                  }}
                >
                  {/* <motion.button
                    className={`px-8 py-4 rounded-full bg-gradient-to-r ${THEME.colors.secondary} text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Your Journey
                  </motion.button> */}
                  {/* <motion.button
                    className={`px-8 py-4 rounded-full border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transform hover:scale-105 transition-all duration-300`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Watch Demo
                  </motion.button> */}
                </motion.div>
              </motion.div>
            }
          >
            <motion.div
              className="w-full max-w-[95%] sm:max-w-5xl mx-auto sm:mt-12"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: THEME.animation.duration,
                ease: THEME.animation.ease,
              }}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                transformPerspective: 1000,
              }}
            >
              <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-shadow duration-300">
                <Image
                  src="/images/hero.svg"
                  alt="FableWeaver Hero"
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover transition-all duration-300"
                  priority
                  draggable={false}
                />
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${THEME.colors.secondary} opacity-20`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 0.2 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </ContainerScroll>
        </div>
      </WavyBackground>
    </motion.div>
  );
}
