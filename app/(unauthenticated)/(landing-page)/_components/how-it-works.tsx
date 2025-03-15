import React from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";

const HowItWorks = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.2, 0.4], [50, 0]);

  return (
    <LazyMotion features={domAnimation}>
      <motion.section className="py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent mb-4">
              Your Storytelling Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From imagination to immersion, follow the path to your own narrative universe
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Explore the Fable Sanctum",
                description:
                  "Discover a curated collection of stories and get personalized recommendations through the magical Lore Lens",
              },
              {
                step: "02",
                title: "Forge Your Characters",
                description:
                  "Breathe life into unique AI companions with rich personalities in the Character Realm that evolve with every interaction",
              },
              {
                step: "03",
                title: "Weave Your Narrative",
                description:
                  "Craft epic tales with AI assistance in Story Weaver, building immersive worlds chapter by chapter with intelligent story generation",
              },
              {
                step: "04",
                title: "Connect & Collaborate",
                description:
                  "Join the community through Thread Tapestry and Tale Tethers to share your creations and experience magical Character Confluence interactions",
              },
            ].map((step, index) => (
              <m.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <m.div
                  className="inline-block mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.step}
                </m.div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                  {step.description}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </motion.section>
    </LazyMotion>
  );
};

export default HowItWorks;
