"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Bot, Brain, Zap, Sparkles, History, Palette } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  motion,
  useInView,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";

const FeatureAnimation1 = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2 ml-auto bg-[#bccff1] dark:bg-zinc-900"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-full bg-background h-10 rounded-full px-5 flex items-center justify-end"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          What makes a good story?
        </motion.div>
        <Image
          src="/images/user_avatar-feature.png"
          alt="AI response"
          width={55}
          height={55}
          className="rounded-full bg-gradient-to-r from-blue-500 to-teal-500"
        />
      </motion.div>
      <motion.div
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2
        bg-[#bccff1] dark:bg-zinc-900"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/images/kimdokja-feature.png"
          alt="AI recommendation"
          width={55}
          height={55}
          className="rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
        />
        <motion.div
          className="w-full  h-10 rounded-full bg-background px-5 flex items-center text-left"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          The best stories are the ones you&apos;re willing to die for... or
          maybe live for.
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const FeatureAnimation2 = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <Image
        src="/images/studying-windy-feature.gif"
        alt="Feature visualization"
        width={320}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy"
        unoptimized={true}
      />
    </motion.div>
  );
};

const FeatureAnimation3 = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col"
      initial={{ opacity: 0, rotate: -5 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, rotate: 5 }}
    >
      <Image
        src="/images/real-time-features.png"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy flex items-center justify-center"
      />
    </motion.div>
  );
};

const FeatureAnimation5 = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <Image
        src="/images/genius-smart-feature.gif"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy flex items-center justify-center"
        unoptimized={true}
      />
    </motion.div>
  );
};

const FeatureAnimation6 = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, rotate: 2 }}
    >
      <Image
        src="/images/anime-write.gif"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover flex items-center justify-center"
      />
    </motion.div>
  );
};

const FeatureAnimation7 = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const cardVariants = {
    initial: (custom: number) => ({
      x: custom * 20,
      rotate: custom * -5,
      opacity: 0,
      scale: 0.9,
    }),
    animate: {
      x: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const flipVariants = {
    front: { rotateY: 0 },
    back: { rotateY: 180 },
  };

  const characters = [
    { name: "Writer", image: "/images/writer.png", color: "red" },
    { name: "Reader", image: "/images/reader.png", color: "green" },
    { name: "Protagonist", image: "/images/protagonist.png", color: "orange" },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] rounded-xl p-4 gap-4"
    >
      {characters.map((character, index) => (
        <motion.div
          key={character.name}
          custom={index - 1}
          variants={cardVariants}
          className={cn(
            "h-full flex-1 rounded-2xl   dark:border-white/[0.1] border-neutral-200",
            "flex items-center justify-center overflow-hidden cursor-pointer",
            "transition-colors hover:bg-[#d2e1fe] dark:hover:bg-neutral-900"
          )}
          onHoverStart={() => setHoveredCard(index)}
          onHoverEnd={() => setHoveredCard(null)}
        >
          <motion.div
            className="w-full h-full relative"
            initial="front"
            animate={hoveredCard === index ? "back" : "front"}
            variants={flipVariants}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <Image
                src={character.image || "/placeholder.svg"}
                alt={character.name}
                fill
                className="object-cover rounded-3xl"
              />
            </div>
            {/* <div
              className={cn(
                "absolute inset-0 w-full h-full backface-hidden rounded-2xl",
                "flex items-center justify-center",
                `bg-${character.color}-100 dark:bg-${character.color}-900/20`
              )}
              style={{ transform: "rotateY(180deg)" }}
            >
              <p
                className={cn(
                  "text-lg font-medium",
                  `text-${character.color}-600 dark:text-${character.color}-400`
                )}
              >
                {character.name}
              </p>
            </div> */}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
};

const AnimatedTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.h1
      className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.h1>
  );
};

const AnimatedDescription = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.p
      className="text-base sm:text-lg text-gray-600 dark:text-gray-400"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {children}
    </motion.p>
  );
};

const items = [
  {
    title: "AI Character Creation",
    description:
      "Create unique characters with rich personalities, backstories, and traits that come to life through advanced AI",
    header: <FeatureAnimation1 />,
    className: "md:col-span-2",
    icon: <Sparkles className="h-4 w-4 text-violet-500" />,
  },
  {
    title: "Smart Recommendations",
    description:
      "Get personalized anime suggestions based on your preferences, watch history, and story interests",
    header: <FeatureAnimation2 />,
    className: "md:col-span-1",
    icon: <Brain className="h-4 w-4 text-blue-500" />,
  },
  {
    title: "Character Confluence",
    description:
      "Experience dynamic group chats where multiple AI characters interact with each other and users naturally",
    header: <FeatureAnimation7 />,
    className: "md:col-span-1",
    icon: <Palette className="h-4 w-4 text-violet-500" />,
  },
  {
    title: "Story Weaving",
    description:
      "Craft immersive narratives with AI assistance, blending your creativity with intelligent story generation and chapter management",
    header: <FeatureAnimation6 />,
    className: "md:col-span-1",
    icon: <Bot className="h-4 w-4 text-violet-500" />,
  },
  {
    title: "Personalized History",
    description:
      "Your watch history and character interactions shape future recommendations and experiences",
    header: <FeatureAnimation5 />,
    className: "md:col-span-1",
    icon: <History className="h-4 w-4 text-blue-500" />,
  },
];

export default function FeaturesPage() {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  if (inView) {
    controls.start("visible");
  }

  return (
    <div className="min-h-screen py-12 sm:py-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent mb-4">
          Powerful Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover stories and bring characters to life in your personalized
          realm
        </p>
      </motion.div>

      <BentoGrid className="max-w-7xl mx-auto">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={item.className}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </div>
  );
}
