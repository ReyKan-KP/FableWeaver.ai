"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

// Expanded emoji sets
const EMOJI_SETS = {
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨"],
  gestures: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  objects: ["💻", "📱", "📞", "📠", "🔋", "🔌", "💡", "🔦", "🕯️", "📚", "📖", "🧰", "🔨", "⚙️", "🔧", "🔩", "⛓️", "📝", "✏️", "🖊️", "📌"],
  symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️"],
}

const categoryIcons = {
  smileys: "😀",
  gestures: "👍",
  objects: "💻",
  symbols: "❤️"
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState("smileys")

  const emojiAnimation = {
    hover: { scale: 1.2, y: -5, transition: { duration: 0.2 } }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      <Card className="w-72 p-3 shadow-lg border-2 rounded-xl backdrop-blur-sm bg-background/95">
        <Tabs defaultValue="smileys" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-3 p-1 bg-muted/60 rounded-lg">
            {Object.entries(categoryIcons).map(([category, icon]) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200 ease-in-out"
              >
                <motion.span whileHover={{ scale: 1.2 }} className="text-lg">
                  {icon}
                </motion.span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(EMOJI_SETS).map(([category, emojis]) => (
            <TabsContent key={category} value={category} className="m-0 h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-7 gap-1">
                {emojis.map((emoji, index) => (
                  <motion.button
                    key={index}
                    className="p-1.5 hover:bg-muted/80 rounded-lg cursor-pointer text-xl"
                    onClick={() => onEmojiSelect(emoji)}
                    whileHover="hover"
                    variants={emojiAnimation}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 20px;
          }
        `}</style>
      </Card>
    </motion.div>
  )
}

