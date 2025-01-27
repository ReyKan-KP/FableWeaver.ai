import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
  character?: {
    name: string;
    image: string;
  };
}

const presetConversation: Message[] = [
  {
    id: 1,
    text: "Hey Gojo! What's your take on power and responsibility?",
    sender: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    text: "With great power comes great... well, in my case, it comes with looking absolutely fabulous while being the strongest! 😎✨ But seriously, strength isn't just about raw power—it's about protecting what matters.",
    sender: "ai",
    timestamp: new Date().toISOString(),
    character: {
      name: "Gojo",
      image: "/images/gojo.png",
    },
  },
  {
    id: 3,
    text: "That's interesting! How do you balance being so powerful with teaching your students?",
    sender: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: 4,
    text: "Teaching is actually the most powerful technique of all! Passing knowledge to the next generation ensures our strength lives on. Plus, watching my students grow is infinitely more satisfying than any battle.",
    sender: "ai",
    timestamp: new Date().toISOString(),
    character: {
      name: "Gojo",
      image: "/images/gojo.png",
    },
  },
];

function TypewriterText({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 30);
      return () => clearTimeout(timeout);
    } else {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return <span>{displayedText}</span>;
}

export default function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Start the conversation when component mounts
  useEffect(() => {
    if (!isStarted) {
      setIsStarted(true);
      setMessages([{ ...presetConversation[0], text: "" }]);
      setIsTyping(true);
    }
  }, [isStarted]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTypewriterComplete = () => {
    setIsTyping(false);
    const currentMessage = presetConversation[currentMessageIndex];

    // Update the current message with full text
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === prev.length - 1 ? { ...currentMessage } : msg
      )
    );

    // Add next message after a delay
    if (currentMessageIndex < presetConversation.length - 1) {
      setTimeout(() => {
        setCurrentMessageIndex((prev) => prev + 1);
        setMessages((prev) => [
          ...prev,
          { ...presetConversation[currentMessageIndex + 1], text: "" },
        ]);
        setIsTyping(true);
      }, 1000);
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const inputVariants = {
    focused: {
      boxShadow: "0 0 0 2px rgba(147, 197, 253, 0.5)",
      scale: 1.02,
    },
    unfocused: {
      boxShadow: "none",
      scale: 1,
    },
  };

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
            Experience the Magic
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See how our AI characters come to life through natural conversations
            and unique personalities.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl mx-auto"
        >
          <Card className="bg-[#bccff1] dark:bg-zinc-900 border-none shadow-lg transform-gpu transition-all duration-300 hover:shadow-xl">
            <ScrollArea
              className="h-[600px] px-4 py-6 dark:bg-dot-white/[0.2] bg-dot-black/[0.2]"
              ref={scrollAreaRef}
            >
              <CardContent className="space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.sender === "ai" && (
                        <motion.div
                          className="w-[55px] h-[55px] rounded-full overflow-hidden mr-2 flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <Image
                            src={
                              message.character?.image ||
                              "/images/default-character.png"
                            }
                            alt={message.character?.name || "Character"}
                            className="w-full h-full object-cover"
                            width={55}
                            height={55}
                          />
                        </motion.div>
                      )}
                      <motion.div
                        className={cn(
                          "flex flex-row rounded-full border p-2 items-center space-x-2 backdrop-blur-sm",
                          message.sender === "user"
                            ? "ml-auto bg-blue-500/10"
                            : "bg-purple-500/10"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <motion.div
                          className="bg-background rounded-full px-5 py-2 flex items-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {index === messages.length - 1 && isTyping ? (
                            <p className="whitespace-pre-wrap leading-relaxed text-sm dark:text-gray-200">
                              <TypewriterText
                                text={
                                  presetConversation[currentMessageIndex].text
                                }
                                onComplete={handleTypewriterComplete}
                              />
                            </p>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed text-sm dark:text-gray-200">
                              {message.text}
                            </p>
                          )}
                          <motion.span
                            className="text-[10px] text-gray-500 dark:text-gray-400 ml-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {new Date(message.timestamp).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </motion.span>
                        </motion.div>
                      </motion.div>
                      {message.sender === "user" && (
                        <motion.div
                          className="w-[55px] h-[55px] rounded-full overflow-hidden ml-2 flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <Image
                            src="/images/default-avatar.png"
                            alt="User"
                            className="w-full h-full object-cover bg-gradient-to-r from-blue-500 to-teal-500"
                            width={55}
                            height={55}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </ScrollArea>
            <CardFooter className="p-4 border-t bg-background/80 backdrop-blur-sm">
              <motion.div
                className="flex w-full items-center space-x-2"
                variants={inputVariants}
                animate={isInputFocused ? "focused" : "unfocused"}
                transition={{ duration: 0.2 }}
              >
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="flex-1 bg-transparent border-none focus:ring-0"
                />
                <motion.button
                  className="p-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9, rotate: -10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
