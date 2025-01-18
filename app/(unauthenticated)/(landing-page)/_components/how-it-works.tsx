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
  const opacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);
  const y = useTransform(scrollYProgress, [0.2, 0.4], [50, 0]);

  return (
    <LazyMotion features={domAnimation}>
      <motion.section className="py-24" style={{ opacity, y }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="text-center mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover your next favorite anime in three simple steps
            </p>
          </m.div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Describe Your Interests",
                description: "Tell us what kind of story you're looking for",
              },
              {
                step: "02",
                title: "AI Analysis",
                description:
                  "Our AI processes your preferences and search history",
              },
              {
                step: "03",
                title: "Get Recommendations",
                description: "Receive personalized anime suggestions",
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
                  className="inline-block mb-6 text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.step}
                </m.div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
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
