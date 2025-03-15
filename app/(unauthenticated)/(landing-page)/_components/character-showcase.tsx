import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Sparkles, Bot, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface Character {
  id: number;
  name: string;
  description: string;
  image_url: string;
  content_source: string;
  content_types: string[];
  is_public: boolean;
  creator_id: string;
}

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
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function CharacterShowcase() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const supabase = createBrowserSupabaseClient();

        const { data, error } = await supabase
          .from("character_profiles")
          .select("*")
          .eq("is_public", true)
          .eq("featured", true);

        if (error) throw error;

        setCharacters(data || []);
      } catch (err) {
        console.error("Error fetching characters:", err);
        setError("Failed to load characters");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCharacters();
  }, []);

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

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
            Featured Characters
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Meet some of our most popular AI characters. Interact with them and
            create your own unique stories.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </motion.div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">
              No characters available at the moment.
            </p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {characters.map((character) => (
              <motion.div
                key={character.id}
                variants={item}
                whileHover={{ scale: 1.02 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="relative h-48 w-full p-[1px]">
                  <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]"></div>
                  <Image
                    src={character.image_url || "/images/default-character.png"}
                    alt={character.name}
                    className="w-full h-full object-contain"
                    width={500}
                    height={500}
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                      {character.name}
                    </h2>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {character.content_types?.map((type, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 
                            text-purple-800 dark:text-purple-300 rounded-full whitespace-nowrap"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1 justify-end">
                        {character.is_public && (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                            Public
                          </span>
                        )}
                        {character.creator_id === "system" && (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            Official
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[3rem]">
                    {character.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      From: {character.content_source}
                    </span>
                    <motion.a
                      href={`/chatbot/${character.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white 
                      rounded-full hover:shadow-lg transform transition-all duration-300 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Chat Now
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
