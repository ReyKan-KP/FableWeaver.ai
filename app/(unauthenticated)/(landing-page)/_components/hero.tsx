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
      className="min-h-screen relative z-0 flex items-center justify-center overflow-hidden"
      style={{ opacity, scale, y }}
      onMouseMove={handleMouseMove}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <WavyBackground
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
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
        <div className="flex flex-col items-center justify-center py-12 sm:py-24">
          <ContainerScroll
            titleComponent={
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text mb-6"
                  style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    transformPerspective: 1000,
                  }}
                >
                  Fable Weaver
                </motion.h1>
                <motion.p
                  className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-primary mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Where AI weaves personalized anime recommendations into your
                  unique story tapestry
                </motion.p>
                {/* <motion.div
                  className="flex gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <motion.button
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                  <motion.button
                    className="px-8 py-3 rounded-full border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Learn More
                  </motion.button>
                </motion.div> */}
              </motion.div>
            }
          >
            <motion.div
              className="w-full max-w-4xl mx-auto mt-12"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                transformPerspective: 1000,
              }}
            >
              <div className="relative w-full h-full aspect-auto rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                <Image
                  src="/images/hero.svg"
                  alt="hero"
                  width={1400}
                  height={1420}
                  className="w-full h-[80%] object-cover transition-all duration-300"
                  draggable={false}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
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
