"use client"

import { motion } from "framer-motion"
import { MessageCircle, Volume2 } from "lucide-react"

interface VoiceRecordingHelpProps {
  directModeEnabled: boolean;
}

export default function VoiceRecordingHelp({ directModeEnabled }: VoiceRecordingHelpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-4"
    >
      <p className="font-medium mb-1">Voice Recording Tips:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Speak clearly and at a normal pace</li>
        <li>Minimize background noise for better results</li>
        <li>Keep messages concise (under 30 seconds)</li>
      </ul>
      
      <div className="mt-2 pt-2 border-t border-blue-100">
        {/* <p className="font-medium mb-1">Current mode:</p> */}
        <div className="flex items-center gap-1">
          {directModeEnabled ? (
            <>
              <MessageCircle size={14} className="text-blue-500" />
              <span>
                <strong>Direct voice to AI</strong> - Your voice recording is sent directly
              </span>
            </>
          ) : (
            <>
              <Volume2 size={14} className="text-green-500" />
              <span>
                <strong>Speech-to-text</strong> - Your voice is converted to text first
              </span>
            </>
          )}
        </div>
        {/* <p className="mt-1 text-blue-600 text-[10px]">
          You can toggle between modes using the button when recording
        </p> */}
      </div>
    </motion.div>
  )
} 