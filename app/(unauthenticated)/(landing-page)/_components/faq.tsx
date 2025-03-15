import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is FableWeaver.ai?",
    answer:
      "FableWeaver.ai is an innovative AI platform that lets you create, customize, and interact with anime and fictional characters. You can have one-on-one conversations or create group chats with multiple characters, bringing your favorite stories to life.",
  },
  {
    question: "What is Thread Tapestry and how does it work?",
    answer:
      "Thread Tapestry is our interactive storytelling platform where writers can create branching narrative threads that readers can follow, comment on, and contribute to. It allows for community-driven storytelling with real-time feedback and collaboration.",
  },
  {
    question: "How can Lore Lens help with my writing?",
    answer:
      "Lore Lens is an AI-powered research assistant that helps you explore and discover rich story worlds. It can help you research historical periods, mythology, or generate creative concepts to enhance your storytelling with accurate and inspiring information.",
  },
  {
    question: "What makes Tale Tethers different from other social platforms?",
    answer:
      "Tale Tethers is specifically designed for writers to connect and collaborate. Unlike general social platforms, it focuses on creative partnerships, writing groups, and project collaboration with tools tailored for storytellers.",
  },
  {
    question: "How does Fable Trail enhance the reading experience?",
    answer:
      "Fable Trail provides an immersive reading platform where you can discover new stories, track your reading progress, bookmark favorite chapters, and connect directly with authors. It offers personalized recommendations based on your reading preferences.",
  },
  {
    question: "How does Character Confluence work?",
    answer:
      "Character Confluence is our unique group chat feature that allows multiple AI characters to interact with each other and users simultaneously. You can create different scenarios, roleplay sessions, or just enjoy watching your favorite characters interact naturally.",
  },
  {
    question: "Can I create my own characters?",
    answer:
      "Yes! You can create custom characters with unique personalities, backstories, and traits. Our AI will bring them to life, maintaining consistent behavior and responses based on your specifications.",
  },
  {
    question: "Is there a limit to how many characters I can create?",
    answer:
      "Free users can create up to 3 characters. Pro users get unlimited character creation, along with advanced customization options and features.",
  },
  {
    question: "How accurate are the character interactions?",
    answer:
      "Our AI is trained to maintain character consistency and authenticity. Characters will respond based on their defined personalities, backgrounds, and the context of your source material.",
  },
  {
    question: "Can I use FableWeaver for commercial purposes?",
    answer:
      "Yes, with our Enterprise plan. This includes API access, custom branding, and the ability to integrate FableWeaver's technology into your own applications.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function FAQ() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions about FableWeaver.ai and its
            features.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={item}>
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-[#bccff1] dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
