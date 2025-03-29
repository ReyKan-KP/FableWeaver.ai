"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { 
  MessageCircle, 
  X, 
  Send, 
  Paperclip, 
  Smile, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Sparkles,
  Bot,
  Mic,
  Square,
  Play,
  Pause,
  Headphones
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ChatMessage from "./chat-message"
import SuggestionChip from "./suggestion-chip"
import EmojiPicker from "./emoji-picker"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import VoiceRecordingHelp from "./VoiceRecordingHelp"

const SUGGESTIONS = [
  "Tell me something interesting about the website",
  "Tell me about FableWeaver.ai",
  "Who is your Creator?",
  "How to make friends in this website",
]

// Define message type
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt?: Date;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotification, setShowNotification] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { data: session, status } = useSession();
  const supabase = createBrowserSupabaseClient();
  const user = session?.user;

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  // Audio playback states
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageSound = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Add recordingTip state to show the help component
  const [showRecordingTips, setShowRecordingTips] = useState(false);

  // Show recording tips when starting to record for the first time
  useEffect(() => {
    if (isRecording) {
      setShowRecordingTips(true);
    }
  }, [isRecording]);

  // Add a display for the current speaking status for better feedback
  const [activeText, setActiveText] = useState('');

  // Add state for tracking ElevenLabs loading
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);

  useEffect(() => {
    if (isLoadingTTS) {
      setActiveText('Loading ElevenLabs voice...');
    } else if (isSpeakingResponse) {
      setActiveText('Speaking with ElevenLabs...');
    } else if (isProcessingSpeech) {
      setActiveText('Processing voice...');
    } else if (isRecording) {
      setActiveText('Recording...');
    } else {
      setActiveText('');
    }
  }, [isSpeakingResponse, isProcessingSpeech, isRecording, isLoadingTTS]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      messageSound.current = new Audio("/message-sound.mp3")
    }
  }, [])

  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight

      // Play sound when new message arrives
      if (soundEnabled && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
        messageSound.current?.play().catch((e) => console.log("Audio play error:", e))
      }
    }
  }, [messages, soundEnabled])

  // Cleanup recording resources
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  // Set up a dedicated timer effect that runs independently
  useEffect(() => {
    if (isRecording) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      
      // Reset the timer
      setRecordingTime(0)
      startTimeRef.current = Date.now()
      
      // Start a new timer that updates every 500ms
      timerIntervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
        console.log('Timer update:', elapsedSeconds)
        setRecordingTime(elapsedSeconds)
      }, 500)
    } else {
      // Clear the timer when not recording
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
    
    // Clean up on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Cleanup effect for audio URL
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  // Effect to set up audio player
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }, [])

  // Function to convert speech to text
  const convertSpeechToText = async (audioBlob: Blob): Promise<string> => {
    setIsProcessingSpeech(true);
    setSpeechError(null);
    
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send the audio file to the server for speech-to-text processing
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to convert speech to text');
      }
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error converting speech to text:', error);
      setSpeechError('Could not convert your speech to text. Please try again.');
      throw error;
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  // Add an audio ref for ElevenLabs audio playback
  const elevenLabsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Update speakText function to use ElevenLabs
  const speakText = async (text: string) => {
    if (!textToSpeechEnabled) return;
    
    // Stop any ongoing speech first
    stopSpeaking();
    
    try {
      setIsLoadingTTS(true);
      setIsSpeakingResponse(true);
      
      // Call ElevenLabs API through our backend endpoint
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to convert text to speech');
      }
      
      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('No audio content returned');
      }
      
      // Convert base64 to audio
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      
      // Play the audio
      if (elevenLabsAudioRef.current) {
        elevenLabsAudioRef.current.src = audioSrc;
        // Store the text being spoken for comparison
        elevenLabsAudioRef.current.dataset.lastSpoken = text;
        await elevenLabsAudioRef.current.play().catch(err => {
          console.error("Error playing ElevenLabs audio:", err);
          throw err;
        });
      }
    } catch (error) {
      console.error('Error with ElevenLabs TTS:', error);
      setIsSpeakingResponse(false);
    } finally {
      setIsLoadingTTS(false);
    }
  };

  // Update stopSpeaking function
  const stopSpeaking = () => {
    if (elevenLabsAudioRef.current) {
      elevenLabsAudioRef.current.pause();
      elevenLabsAudioRef.current.currentTime = 0;
    }
    setIsSpeakingResponse(false);
  };

  // Update useEffect for initializing audio element
  useEffect(() => {
    if (elevenLabsAudioRef.current) {
      elevenLabsAudioRef.current.onended = () => {
        setIsSpeakingResponse(false);
      };
    }
  }, []);

  // Toggle text-to-speech
  const toggleTextToSpeech = () => {
    if (textToSpeechEnabled) {
      stopSpeaking();
    }
    setTextToSpeechEnabled(!textToSpeechEnabled);
  };

  // Effect to speak new AI messages
  useEffect(() => {
    if (textToSpeechEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speakText(lastMessage.content);
      }
    }
  }, [messages, textToSpeechEnabled]);

  const startRecording = async () => {
    try {
      setSpeechError(null);
      // Clear any existing audio URL
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset state
      audioChunksRef.current = [];
      
      // Create the MediaRecorder with proper mime type
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm' 
          });
          setAudioBlob(audioBlob);
          
          // Create URL for audio playback
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      });
      
      // Start recording with 100ms timeslices to ensure we get data
      mediaRecorder.start(100);
      setIsRecording(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setSpeechError("Could not access microphone. Please check browser permissions and try again.");
    }
  }
  
  const stopRecording = () => {
    console.log('Stopping recording, recorder state:', mediaRecorderRef.current?.state)
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
        console.log('Recording stopped')
      } catch (error) {
        console.error('Error stopping recording:', error)
      }
      
      setIsRecording(false)
    } else {
      console.warn('MediaRecorder not available or already inactive')
    }
  }

  // Modified sendRecording function to send audio directly to AI
  const sendRecording = async () => {
    if (!audioBlob) return;
    
    try {
      console.log('Processing audio recording of size:', audioBlob.size);
      
      // Add user audio message immediately - show a placeholder in the UI
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: "🎤 Voice message sent",
        role: 'user',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setAudioBlob(null);
      
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send the audio directly to the AI endpoint
      try {
        const response = await fetch('/api/chatbot-audio', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to process audio message');
        }
        
        const aiMessage = await response.json();
        setMessages(prev => [...prev, aiMessage]);
        
        // Play sound when new message arrives
        if (soundEnabled && messageSound.current) {
          messageSound.current.play().catch(e => console.log("Audio play error:", e));
        }
      } catch (error) {
        console.error('Error processing audio message:', error);
        setSpeechError("There was a problem processing your voice message.");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error processing audio message:", error);
      setSpeechError("There was a problem with your voice message.");
      setAudioBlob(null);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current || !audioURL) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.src = audioURL;
      audioPlayerRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);
    }
  };

  const cancelRecording = () => {
    console.log('Cancelling recording')
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (error) {
        console.error('Error stopping recording during cancel:', error)
      }
    }
    
    // Revoke any existing audio URL
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
      setAudioURL(null)
    }
    
    setAudioBlob(null)
    setIsRecording(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setShowNotification(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    
    const fakeEvent = {
      preventDefault: () => {},
      currentTarget: {
        elements: {
          message: { value: suggestion },
        },
      },
    } as unknown as React.FormEvent<HTMLFormElement>

    setTimeout(() => handleSubmit(fakeEvent), 100)
  }

  const handleEmojiSelect = (emoji: string) => {
    setInput(input + emoji);
    setShowEmojiPicker(false)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Function to handle message submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      role: 'user',
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const currentInput = input;
    setInput('');
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const aiMessage = await response.json();
      setMessages(prev => [...prev, aiMessage]);
      
      // Play sound when new message arrives
      if (soundEnabled && messageSound.current) {
        messageSound.current.play().catch(e => console.log("Audio play error:", e));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally add error UI feedback here
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim()) {
      handleSubmit(e)
      
      // If still recording, stop it
      if (isRecording) {
        cancelRecording()
      }
    }
  }

  const buttonVariants = {
    open: { rotate: 0 },
    closed: { rotate: 0 },
  }

  const iconVariants = {
    open: { rotate: 90, scale: 1 },
    closed: { rotate: 0, scale: 1 },
  }

  const chatContainerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        staggerChildren: 0.07
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.9,
      transition: { duration: 0.2 } 
    }
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: { 
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }

  // Update the handleSpeakMessage function
  const handleSpeakMessage = (content: string) => {
    if (!textToSpeechEnabled) {
      // If text-to-speech is disabled, enable it first
      setTextToSpeechEnabled(true);
      setTimeout(() => speakText(content), 100); // Short delay to ensure state is updated
    } else {
      // If already speaking, stop the current speech
      if (isSpeakingResponse) {
        stopSpeaking();
        
        // If clicking the same message that's being spoken, just stop
        if (elevenLabsAudioRef.current && elevenLabsAudioRef.current.dataset.lastSpoken === content) {
          return;
        }
      }
      
      // Speak the new message
      speakText(content);
    }
  };

  // Add state for direct audio mode
  const [directAudioMode, setDirectAudioMode] = useState(true);

  // Add tooltip text based on current mode
  const getAudioModeTooltip = () => {
    return directAudioMode 
      ? "Currently sending audio directly to AI. Click to transcribe first." 
      : "Currently transcribing audio to text first. Click to send audio directly.";
  };

  // Function to toggle between direct audio mode and transcription mode
  const toggleAudioMode = () => {
    setDirectAudioMode(!directAudioMode);
  };

  // Add a processSpeechToText function for the transcription mode
  const processSpeechToText = async () => {
    if (!audioBlob) return;
    
    try {
      console.log('Processing speech to text, size:', audioBlob.size);
      
      setIsProcessingSpeech(true);
      const transcribedText = await convertSpeechToText(audioBlob);
      setIsProcessingSpeech(false);
      
      if (transcribedText && transcribedText.trim()) {
        // Use the transcribed text as user input
        setInput(transcribedText);
        
        // Clear the audio blob
        setAudioBlob(null);
        
        // Focus the input field
        setTimeout(() => {
          const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (inputElement) {
            inputElement.focus();
          }
        }, 100);
      } else {
        setSpeechError("I couldn't understand what you said. Please try again.");
      }
    } catch (error) {
      console.error("Error processing voice message:", error);
      setSpeechError("There was a problem processing your voice message.");
      setAudioBlob(null);
    }
  };

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 ${isDarkMode ? "dark" : ""}`}>
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={chatContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-xl mb-4 w-[350px] sm:w-[400px] h-[500px] flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary to-primary/90 text-background"
              >
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.2 }}>
                    <Avatar className="h-8 w-8 bg-card text-primary shadow-md border border-primary/10">
                      <Image src="/images/logo.png" alt="Weaver Logo" width={32} height={32} />
                    </Avatar>
                  </motion.div>
                  <div>
                    <h3 className="font-semibold">Weaver Whisperer</h3>
                    <div className="flex items-center text-xs">
                      <span className="flex items-center">
                        <motion.span 
                          className="h-2 w-2 rounded-full bg-green-500 mr-1"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        ></motion.span>
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-full text-primary-foreground hover:bg-primary/80 ${
                              textToSpeechEnabled ? "bg-background/70" : ""
                            } ${isSpeakingResponse ? "animate-pulse" : ""} ${isLoadingTTS ? "opacity-70" : ""}`}
                            onClick={toggleTextToSpeech}
                            disabled={isLoadingTTS}
                          >
                            {isLoadingTTS ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                              />
                            ) : (
                              <Headphones size={16} />
                            )}
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{textToSpeechEnabled ? "Disable ElevenLabs voice" : "Enable ElevenLabs voice"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary/80"
                      onClick={toggleChat}
                    >
                      <X size={16} />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Chat Messages */}
              <motion.div 
                variants={chatContainerVariants}
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5 custom-scrollbar"
              >
                {messages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center justify-center h-full space-y-6"
                  >
                    <motion.div 
                      animate={pulseAnimation}
                      className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-full shadow-md"
                    >
                      <Sparkles size={30} />
                    </motion.div>
                    <div className="text-center">
                      <h3 className="font-medium text-lg mb-2">Welcome to our Chat!</h3>
                      <p className="text-muted-foreground text-sm">How can we help you today?</p>
                      <div className="flex items-center justify-center mt-2 gap-1">
                        <Mic size={14} className="text-primary" />
                        <p className="text-muted-foreground text-xs">Try speaking by clicking the microphone icon</p>
                      </div>
                    </div>
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                      className="flex flex-wrap gap-2 justify-center mt-4 w-full"
                    >
                      {SUGGESTIONS.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <SuggestionChip
                            text={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  <>
                    {showRecordingTips && (
                      <VoiceRecordingHelp directModeEnabled={directAudioMode} />
                    )}
                    
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        isSpeaking={isSpeakingResponse && message.role === "assistant" && message === messages[messages.length - 1]}
                        onSpeakMessage={handleSpeakMessage}
                      />
                    ))}
                  </>
                )}
                
                {/* Speech error message */}
                {speechError && (
                  <div className="bg-red-50 text-red-600 p-2 rounded-md text-xs">
                    {speechError}
                  </div>
                )}
                
                {(isProcessingSpeech || isLoading || activeText) && (
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 bg-background">
                      {isProcessingSpeech ? (
                        <Mic size={16} className="text-blue-500" />
                      ) : isSpeakingResponse ? (
                        <Volume2 size={16} className="text-primary" />
                      ) : (
                        <Image src="/images/logo.png" alt="Weaver Whisperer" width={32} height={32} />
                      )}
                    </Avatar>
                    <div className={cn(
                      "p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm",
                      isProcessingSpeech ? "bg-blue-50" : 
                      isSpeakingResponse ? "bg-primary/10" : 
                      "bg-muted"
                    )}>
                      {activeText ? (
                        <p className="text-sm">{activeText}</p>
                      ) : isLoading ? (
                        <motion.div 
                          animate={{ 
                            y: [0, -5, 0],
                            transition: { 
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }
                          }}
                          className="flex space-x-2"
                        >
                          <motion.div
                            className="h-2 w-2 bg-primary rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                          ></motion.div>
                          <motion.div
                            className="h-2 w-2 bg-primary rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatType: "reverse" }}
                          ></motion.div>
                          <motion.div
                            className="h-2 w-2 bg-primary rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, delay: 0.4, repeat: Infinity, repeatType: "reverse" }}
                          ></motion.div>
                        </motion.div>
                      ) : null}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Chat Input */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 border-t bg-background/90 backdrop-blur-sm"
              >
                <form onSubmit={onSubmit} className="flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    {!isRecording && !audioBlob ? (
                      <motion.div 
                        key="input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative flex-1 mx-1"
                      >
                        <Input
                          value={input}
                          onChange={handleInputChange}
                          placeholder="Type a message..."
                          className="pr-24 shadow-sm focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        />
                        
                        {/* Emoji button */}
                        <motion.div 
                          className="absolute right-12 top-1/2 -translate-y-1/2"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full flex items-center justify-center p-0"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <Smile size={16} />
                          </Button>
                        </motion.div>
                        
                        {/* Mic button */}
                        <motion.div 
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 rounded-full flex items-center justify-center p-0 ${
                              audioBlob ? 'bg-primary/20' : ''
                            }`}
                            onClick={startRecording}
                          >
                            <Mic size={16} />
                          </Button>
                        </motion.div>
                        
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-2 z-50">
                            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="recording-ui"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex-1 mx-1"
                      >
                        {isRecording ? (
                          <div className="flex items-center justify-between bg-red-500/10 px-4 py-2 rounded-full">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                              <span className="text-sm font-medium text-red-500">{formatTime(recordingTime)}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full hover:bg-red-500/20 text-red-500"
                              onClick={stopRecording}
                            >
                              <Square size={14} />
                            </Button>
                          </div>
                        ) : audioBlob ? (
                          <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-full">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-primary/10 hover:bg-primary/20 p-0"
                                onClick={toggleAudioPlayback}
                              >
                                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                              </Button>
                              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                              
                              {/* <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className={`h-6 w-6 rounded-full p-0 ${directAudioMode ? 'text-blue-500' : 'text-green-500'}`}
                                      onClick={toggleAudioMode}
                                    >
                                      {directAudioMode ? <MessageCircle size={12} /> : <Volume2 size={12} />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{getAudioModeTooltip()}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider> */}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-background/80 p-0"
                                onClick={cancelRecording}
                              >
                                <X size={12} />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-primary/20 text-primary p-0"
                                onClick={sendRecording}
                                disabled={isProcessingSpeech}
                              >
                                <Send size={12} />
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isRecording && !audioBlob && (
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      type="submit"
                      size="icon"
                      className={`h-9 w-9 rounded-full shadow-md transition-all duration-300 flex-shrink-0 ${
                        !input.trim() || isRecording || !!audioBlob ? 'opacity-70' : 'bg-primary hover:bg-primary/90'
                      }`}
                      disabled={isLoading || !input.trim() || isRecording || !!audioBlob || isProcessingSpeech}
                    >
                      <Send size={16} />
                    </Button>
                    </motion.div>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Button */}
        <motion.div 
          initial={false}
          animate={isOpen ? "open" : "closed"}
          variants={buttonVariants}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          className="relative"
        >
          <Button 
            onClick={toggleChat} 
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-primary/20 hover:shadow-xl transition-all duration-300" 
            size="icon"
          >
            <motion.div
              variants={iconVariants}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.div>
          </Button>

          {/* Notification Badge */}
          {/* {showNotification && !isOpen && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Badge className="bg-red-500 text-white animate-pulse">1</Badge>
            </motion.div>
          )} */}
        </motion.div>
      </div>

      {/* Audio element for message sound */}
      <audio ref={messageSound} src="/message-sound.mp3" preload="auto" />
      
      {/* Audio element for recording playback */}
      <audio ref={audioPlayerRef} />

      {/* Audio element for ElevenLabs audio playback */}
      <audio 
        ref={elevenLabsAudioRef} 
        onEnded={() => setIsSpeakingResponse(false)} 
        className="hidden"
      />

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
    </>
  )
}

