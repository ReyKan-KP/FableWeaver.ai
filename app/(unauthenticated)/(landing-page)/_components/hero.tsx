"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { WavyBackground } from "@/components/ui/wavy-background";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export function Hero() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="h-[110vh]">
      <WavyBackground className="max-w-4xl mx-auto pb-40">
        <motion.div
          className="flex flex-col overflow-hidden pb-[600px] pt-[1000px]"
          style={{ opacity, scale }}
        >
          <ContainerScroll
            titleComponent={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
                  Fable Weaver
                </h1>
                <motion.p
                  className="text-xl sm:text-2xl pb-10 max-w-3xl mx-auto leading-relaxed bg-gradient-to-r from-gray-600 via-pink-300 to-teal-800 text-transparent bg-clip-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Where AI weaves personalized anime recommendations into your
                  unique story tapestry
                  <br />
                </motion.p>
              </motion.div>
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/images/hero.svg"
                alt="hero"
                height={720}
                width={1400}
                className="mx-auto rounded-2xl object-cover h-full object-left-top transition-all duration-300"
                draggable={false}
              />
            </motion.div>
          </ContainerScroll>
        </motion.div>
      </WavyBackground>
    </div>
  );
}
