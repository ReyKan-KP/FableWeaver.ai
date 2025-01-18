import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";

const Newsletter = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
  const y = useTransform(scrollYProgress, [0.6, 0.8], [50, 0]);

  return (
    <LazyMotion features={domAnimation}>
      <motion.section className="py-24" style={{ opacity, y }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Stay Updated
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
              Get notified about new features and improvements
            </p>
            <m.form
              className="flex gap-4 max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <m.input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-50 dark:bg-gray-800 text-lg py-6 rounded-full flex-grow transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02 }}
              />
              <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-6 rounded-full transition-all duration-300"
                >
                  Subscribe
                </Button>
              </m.div>
            </m.form>
          </m.div>
        </div>
      </motion.section>
    </LazyMotion>
  );
};

export default Newsletter;
