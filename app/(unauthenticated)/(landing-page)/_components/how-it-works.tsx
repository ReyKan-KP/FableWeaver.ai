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
              How It Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover, create, and interact in your personalized fable
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Discover Stories",
                description:
                  "Get personalized anime recommendations based on your preferences and watch history",
              },
              {
                step: "02",
                title: "Create Characters",
                description:
                  "Design unique characters or choose from our collection to bring your favorite stories to life",
              },
              {
                step: "03",
                title: "Connect & Chat",
                description:
                  "Engage in immersive conversations and group chats while discovering new anime adventures",
              },
              {
                step: "04",
                title: "Weave Your Tale",
                description:
                  "Craft immersive narratives with AI assistance, blending your creativity with intelligent story generation and chapter management",
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
