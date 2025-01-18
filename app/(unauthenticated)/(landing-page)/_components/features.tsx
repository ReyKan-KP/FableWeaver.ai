"use client";

import Image from "next/image";
import {
  Bot,
  Brain,
  Zap,
  Sparkles,
  History,
  Star,
  Palette,
  Heart,
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const FeatureAnimation1 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2">
      <div className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2  ml-auto bg-white dark:bg-black">
        <div className="w-full bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-900 dark:to-neutral-800 h-10 rounded-full  px-5 flex items-center justify-end">
          What makes a good story?
        </div>
        <Image
          src="/images/user_avatar-feature.png"
          alt="AI response"
          width={55}
          height={55}
          className="rounded-full bg-gradient-to-r from-blue-500 to-teal-500"
        />
      </div>
      <div className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2 bg-white dark:bg-black ">
        <Image
          src="/images/kimdokja-feature.png"
          alt="AI recommendation"
          width={55}
          height={55}
          className="rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
        />

        <div className="w-full bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-900 dark:to-neutral-800 h-10  rounded-full px-5 flex items-center text-left ">
          The best stories are the ones you're willing to die for... or maybe
          live for.
        </div>
      </div>
    </div>
  );
};

const FeatureAnimation2 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col">
      <Image
        src="/images/studying-windy-feature.gif"
        alt="Feature visualization"
        width={320}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy"
        unoptimized={true}
      />
    </div>
  );
};

const FeatureAnimation3 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col">
      <Image
        src="/images/real-time-features.png"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy flex items-center justify-center"
      />
    </div>
  );
};

const FeatureAnimation4 = () => {
  return (
    <div className="grid grid-cols-2 gap-2 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2]">
      {[...Array(2)].map((_, i) => (
        <Image
          key={i}
          src="/placeholder.svg?height=120&width=160"
          alt={`Feature preview ${i + 1}`}
          width={160}
          height={120}
          className="rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-pulse"
        />
      ))}
    </div>
  );
};
const FeatureAnimation5 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col">
      <Image
        src="/images/genius-smart-feature.gif"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy flex items-center justify-center"
        unoptimized={true}
      />
    </div>
  );
};
const FeatureAnimation6 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col">
      <Image
        src="/images/recommendations.svg"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-contain flex items-center justify-center"
      />
    </div>
  );
};
const FeatureAnimation7 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col">
      <Image
        src="/images/real-time-features.png"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy flex items-center justify-center"
      />
    </div>
  );
};
const FeatureAnimation8 = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col">
      <Image
        src="/images/real-time-features.png"
        alt="Feature icon"
        width={340}
        height={320}
        className="w-full h-full rounded-lg object-cover bg-gradient-to-br from-violet-500 via-blue-500 to-teal-500 animate-gradient-xy flex items-center justify-center"
      />
    </div>
  );
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen  p-8">
      <div className="max-w-2xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
          Powerful Features
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover the magic of AI-powered anime recommendations and
          personalization
        </p>
      </div>

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

const items = [
  {
    title: "Personalized Character Chatbot",
    description:
      "Create your own personalized character chatbot that learns and evolves with you",
    header: <FeatureAnimation1 />,
    className: "md:col-span-2",
    icon: <Sparkles className="h-4 w-4 text-violet-500" />,
  },
  {
      title: "Smart Learning",
      description:
      "The more you interact, the better it gets at understanding your unique taste",
      header: <FeatureAnimation2 />,
      className: "md:col-span-1",
      icon: <Brain className="h-4 w-4 text-blue-500" />,
    },
    {
        title: "Real-time Processing",
    description:
      "Get instant, personalized recommendations based on your current interests",
    header: <FeatureAnimation3 />,
    className: "md:col-span-1",
    icon: <Zap className="h-4 w-4 text-teal-500" />,
},
{
  title: "AI-Powered Recommendations",
  description:
    "Our advanced AI understands your preferences and suggests anime that truly resonates with you",
  header: <FeatureAnimation6 />,
  className: "md:col-span-1",
  icon: <Bot className="h-4 w-4 text-violet-500" />,
},
  {
    title: "Watch History Analysis",
    description:
      "Deep insights into your watching patterns to enhance recommendations",
    header: <FeatureAnimation5 />,
    className: "md:col-span-1",
    icon: <History className="h-4 w-4 text-blue-500" />,
  },
//   {
//     title: "Art Style Matching",
//     description: "Find anime with similar art styles to your favorites",
//     header: <FeatureAnimation3 />,
//     className: "md:col-span-1",
//     icon: <Palette className="h-4 w-4 text-violet-500" />,
//   },
//   {
//     title: "Emotion-Based Discovery",
//     description:
//       "Find anime that matches your current mood and emotional preferences",
//     header: <FeatureAnimation4 />,
//     className: "md:col-span-1",
//     icon: <Heart className="h-4 w-4 text-blue-500" />,
//   },
];
