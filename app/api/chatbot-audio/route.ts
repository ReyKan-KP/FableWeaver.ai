import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { model_chat } from "@/lib/ai-setting";
import { ElevenLabsClient } from "elevenlabs";
// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});
export const maxDuration = 30; // Longer timeout for audio processing

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Parse the multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    // Check if audioFile exists and has the properties we need
    if (!audioFile || typeof audioFile !== 'object' || !('arrayBuffer' in audioFile)) {
      return NextResponse.json(
        { error: "No valid audio file provided" },
        { status: 400 }
      );
    }

    try {
      // Convert the blob/file to a Buffer
      const arrayBuffer = await (audioFile as Blob).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Log info about the received audio
      console.log(`Received audio file of size: ${buffer.length} bytes`);
      const transcription = await elevenlabs.speechToText.convert({
        file: audioFile,
        model_id: "scribe_v1", // Model to use, for now only "scribe_v1" is support.
        tag_audio_events: true, // Tag audio events like laughter, applause, etc.
        language_code: "eng", // Language of the audio file. If set to null, the model will detect the language automatically.
        diarize: true, // Whether to annotate who is speaking
    });

    // console.log("tt",transcription.text);

      // Generate a UUID for interaction tracking
      const interactionId = crypto.randomUUID();

      // Log the audio interaction in Supabase if user is logged in
      if (session?.user?.id) {
        await supabase
          .from("chatbot_interactions")
          .insert({
            id: crypto.randomUUID(),
            user_id: session.user.id,
            message: `🎤 Voice message - ${transcription.text}`,
            is_assistant: false,
            timestamp: new Date().toISOString(),
            interaction_id: interactionId
          });
      }
      const KNOWLEDGE_BASE = `
FableWeaver.ai is a comprehensive platform for storytelling and character creation using AI.

# Pages and Features Overview

## Unauthenticated Pages:
- Home/Landing Page: Introduction to FableWeaver with hero section, features explanation, how it works guide, character showcase featuring AI-generated characters with backstories, interactive demo allowing visitors to test AI storytelling, and FAQ section addressing common questions. The landing page features a radial gradient background and animations with themed sections using a consistent color scheme of violet, blue, and teal gradients. Components include Hero, Features, HowItWorks, CharacterShowcase, InteractiveDemo, and FAQ.

- About: Detailed information about FableWeaver's mission, team members, vision for AI-enhanced storytelling, and the technology powering the platform. The About page includes:
  * Platform overview describing how FableWeaver revolutionizes storytelling by combining advanced AI technology with creative tools
  * Core features with detailed descriptions of Character Realm, Story Weaver, Character Confluence, and Weave Anime
  * Technical excellence section highlighting Advanced AI Integration, Personalization, Real-time Generation, and Modern Architecture
  * Developer information about Kanishaka Pranjal, a Full Stack Developer and AI enthusiast pursuing a BTech in CSE at Indian Institute of Information Technology, Sri City
  * Technical expertise highlighting skills in JavaScript, TypeScript, Next.js, React, Node.js, Express.js, PostgreSQL, Tailwind CSS, LangChain, OpenAI API, Vercel AI SDK, and Docker
  * Contact links to GitHub (github.com/ReyKan-KP), LinkedIn (linkedin.com/in/kanishaka-pranjal-070a45235), Email (kanishakpranjal@gmail.com), and Portfolio (portfolio-kanishaka-pranjal.vercel.app)

- Contact: A comprehensive contact form allowing users to reach out with questions, feedback, or support requests. The Contact page includes:
  * Contact form with fields for name, email, and message
  * Direct contact options including Email (kanishakpranjal@gmail.com), GitHub (github.com/ReyKan-KP), LinkedIn (linkedin.com/in/kanishaka-pranjal-070a45235), and Portfolio (portfolio-kanishaka-pranjal.vercel.app)
  * Promise of quick response within 24 hours

- Features: In-depth showcase of platform features with interactive demos and detailed explanations. The Features page includes:
  * Story Weaver: Craft epic narratives with AI assistance that enhances creativity, featuring novel management, export options, and collaboration tools
  * Fable Sanctum: Explore curated collections of published stories from fellow creators with filtering, search, and reading progress tracking
  * Character Realm: Forge unique AI companions with rich personalities and backstories, featuring detailed character profiles and trait management
  * Lore Lens: AI-powered recommendation engine that discovers perfect content tailored to user tastes
  * Thread Tapestry: Community discussion forum for weaving conversations with other storytellers
  * Tale Tethers: Social connection platform for building meaningful connections with fellow storytellers and readers
  * Character Confluence: Experience magical group interactions where multiple AI characters converse with each other

- Privacy Policy: Detailed information about data collection practices, how user data is used, storage policies, and user privacy rights. The Privacy Policy includes:
  * Data Protection: Implementation of industry-standard security measures to protect personal information
  * Data Collection: Collection of essential information including name, email address, and user-provided information
  * Data Usage: Data used solely to provide, maintain, and improve services, communicate with users, and enhance storytelling experience
  * Data Sharing: No selling of personal information, with sharing limited to essential service providers
  * User Rights: Full rights to access, correct, or delete personal information and opt out of communications
  * Data Security: Using modern security protocols and regular security audits to protect data during transmission and storage
  * Contact for privacy questions: kanishakpranjal@gmail.com

- Terms of Service: Comprehensive legal terms governing platform usage, user responsibilities, content ownership, and liability limitations. The Terms of Service includes:
  * Agreement to Terms: Users agree to be bound by Terms of Service and applicable laws by accessing the platform
  * User Responsibilities: Users must be at least 13 years old and are responsible for maintaining account confidentiality
  * Intellectual Property: Users retain rights to original content but grant FableWeaver.ai a license for service improvement and AI model training
  * Prohibited Activities: Users must not engage in illegal activities, harassment, or actions harmful to the platform
  * Limitation of Liability: FableWeaver.ai is not liable for damages arising from service use
  * Changes to Terms: Terms may be modified, with continued use constituting acceptance
  * Contact for questions: kanishakpranjal@gmail.com
  * Governing Law: Terms governed by applicable laws without regard to conflicts of law principles

- Cookies Policy: Explanation of cookie usage, types of cookies employed, and how users can manage cookie preferences. The Cookies Policy includes:
  * What Are Cookies: Small text files placed on user devices to help provide better experience
  * How We Use Cookies: Used to enhance experience by remembering login details, understanding site usage, and providing personalized content
  * Managing Cookies: Users can control cookies in browser settings, with possibility of impact on experience
  * Types of Cookies: Essential cookies for functionality, analytics cookies for service improvement, and preference cookies for remembering settings
  * Cookie Duration: Session cookies expire when browser closes, persistent cookies remain for set period, third-party cookies placed by external services

- Flow: An interactive guided tour demonstrating the platform's storytelling capabilities with examples and step-by-step walkthroughs.

- Thread Tapestry: A community discussion forum for storytellers that enables:
  * Browsing public discussion threads from all users in the main Feed tab
  * Creating new discussion threads to start conversations about writing and storytelling
  * Viewing threads specifically from connected friends in the Friends tab
  * Saving favorite threads for later reference in the Saved tab
  * Interactive thread cards showing author information and engagement metrics
  * Sign-in prompts for unauthenticated users attempting to access restricted features
  * Comprehensive help dialog explaining the feature's functionality including what Thread Tapestry is, key features, and how to use it
  * Clean, tabbed interface with smooth animations and transitions
  * Community-building opportunities through discussions about storytelling
  * Collaborative storytelling opportunities through thread comments and weekly writing prompts
  * Different views for authenticated and non-authenticated users

- Fable Trail (Fable Sanctum): A dedicated library and reading platform for discovering and enjoying stories created on FableWeaver that features:
  * A visually appealing grid or list view of published novels with cover images
  * Advanced filtering options by genre, trending status (trending defined as novels with over 10,000 words), and recency (last 7 days)
  * Comprehensive search functionality across titles, descriptions, and genres
  * Smart sorting options (latest, most popular, recently updated, most chapters)
  * Detailed novel cards showing title, genre, chapter count, and last update
  * Published chapter counts and reading statistics
  * User-friendly reading interface with chapter navigation
  * Ability to browse novels by different authors
  * Responsive design adapting to different viewing preferences
  * Help dialog explaining features and navigation options including "About Fable Sanctum" as a gateway to captivating stories, features like Smart Search, Advanced Filters, Reading Progress, and Chapter Navigation, and Getting Started guide
  * Real-time updates for newly published content

- User Profiles: Public-facing profiles showing user-created content, published stories, and character creations (limited view for non-authenticated users).

## Authenticated Pages - User have to sign in first then they can access these pages .:
- Profile: User's personal profile dashboard with account settings, activity history, saved stories, character collections, and privacy controls.
- Story Weaver: Advanced story generation tool using Gemini 2.0 Flash Thinking model that allows users to:
  * Create new stories with AI assistance
  * Set genre, style, and narrative parameters
  * Generate chapters and plot developments
  * Edit and refine AI-generated content
  * Organize stories into collections
  * Export stories in multiple formats
  * Collaborate with other users
  * Publish stories publicly or keep them private

- Lore Lens: World-building and content discovery tool using Gemini 2.0 Flash model that helps users:
  * Discover stories and content across various media (anime, movies, web series, novels, manga, etc.)
  * Generate detailed lore for fictional worlds
  * Create consistent worldbuilding elements
  * Research inspiration for new stories
  * Save favorite content for future reference
  * Receive personalized recommendations based on preferences
  * Filter content by type, rating, year, genres, and studios

- Character Realm: Comprehensive character creation and management dashboard that enables:
  * Creating detailed character profiles with personality traits
  * Generating character backstories and motivations
  * Managing collections of created characters
  * Editing and refining character details
  * Sharing characters publicly or keeping them private
  * Searching and filtering characters by attributes
  * Viewing other users' public characters

- Character Confluence: Multi-character interaction simulator that allows:
  * Generating realistic conversations between created characters
  * Simulating scenarios with multiple characters
  * Testing character dynamics and relationships
  * Creating dialogue based on character personalities
  * Exploring character development through interactions

- Tale Tethers: Social connection platform for storytellers that features:
  * Connecting with fellow writers and readers
  * Managing friend connections ("tethers")
  * Discovering new storytellers to connect with
  * Private messaging between connected users
  * Sharing stories and characters with connections
  * Collaborative storytelling opportunities

- Chatbot: Interactive AI assistant (this feature you're using now) designed to:
  * Answer questions about FableWeaver features
  * Provide guidance on using the platform
  * Offer storytelling tips and advice
  * Help troubleshoot common issues
  * Deliver concise, helpful responses in a mystical storytelling tone


## Core Features in Detail:

### Story Weaver
- Uses Gemini 2.0 Flash Thinking model for high-quality narrative generation
- Allows creating complete stories with sophisticated plot development and character arcs
- Supports diverse genres including fantasy, sci-fi, romance, mystery, horror, and more
- Provides tools for chapter organization, editing, and story structure
- Enables users to guide story direction through interactive prompts and outlines
- Features novel management with cover images, descriptions, and metadata
- Includes word count tracking and productivity metrics
- Offers export options to various formats including PDF
- Supports both public and private story publishing with visibility controls

### Thread Tapestry
- Community-focused discussion platform for storytellers and readers to connect
- Three main content sections with distinct functionality:
  * Feed tab: Displays public threads from all users, accessible to everyone
  * Friends tab: Shows threads only from connected users (requires authentication)
  * Saved tab: Personal collection of saved threads for later reference (requires authentication)
- Thread creation system with rich text formatting for detailed discussions
- Interactive thread cards showing author information, post time, and engagement stats
- Conditional UI that adapts based on authentication status:
  * Authenticated users can create threads, comment, save content, and access all tabs
  * Unauthenticated users can view public feed but are prompted to sign in for restricted features
- Animated transitions between views with Framer Motion for a polished experience
- Responsive card-based design that adapts to different screen sizes
- Comprehensive help dialog explaining feature usage and benefits
- Sign-in prompts with clear calls-to-action for unauthenticated users
- Collaborative storytelling opportunities through threaded discussions
- Clean, modern UI with gradient accents matching platform styling
- Community-building features to connect with like-minded storytellers
- Integrated with Tale Tethers for enhanced friend connections
- Support for comments and discussions on individual threads

### Lore Lens
- Content discovery across multiple media types including anime, movies, web series, novels, manga, etc.
- Personalized recommendation engine based on user preferences
- Detailed filtering by content type, rating, year range, genres, and studios
- Saving functionality for favorite content and recommendations
- Search capabilities across vast content libraries
- World-building tools for creating consistent fictional universes
- Lore generation for historical events, geography, cultures, and societies
- Canon management to maintain consistency across stories set in the same universe

### Character Creation
- Detailed character profile generation with physical and psychological attributes
- Personality trait development based on established psychological models
- Dynamic character backstory creation with life events and formative experiences
- Visual appearance description with detailed customization options
- Character growth arcs and development planning
- Relationship mapping between characters showing connections and dynamics
- Character motivation and goal setting based on personality
- Integration with stories to maintain characterization consistency

### Character Confluence
- Multi-character interaction simulation in various scenarios
- AI-powered dialogue generation reflecting individual character personalities
- Relationship development tracking showing how interactions affect connections
- Scenario-based interactions in user-defined settings and circumstances
- Emotional response simulation based on character traits and histories
- Conflict and resolution patterns based on character attributes
- Character voice consistency ensuring authentic dialogue
- Integration with Tale Tethers for collaborative character interactions

### Chat System
- One-on-one character conversations with user-created or platform characters
- Group chat capabilities supporting multiple characters in a single conversation
- Message history and conversation saving for future reference or story integration
- Contextual awareness maintaining conversation flow and reference points
- Emotional response generation based on character traits and conversation context
- Character memory of previous interactions affecting future responses
- Integration with story narratives to create dialogue for written works

### Fable Trail / Fable Sanctum
- Comprehensive story library showcasing all published novels on the platform
- Dual viewing modes (grid and list) for different browsing preferences
- Visually appealing novel cards with cover images and essential information
- Advanced filtering system with multiple criteria:
  * Genre-based filtering with dynamic tag selection
  * Trending novels filter highlighting popular content (over 10,000 words)
  * Latest releases filter showing recent additions (last 7 days)
- Smart sorting algorithms with multiple options:
  * Latest: Sorted by creation date
  * Most Popular: Sorted by total word count/readers
  * Recently Updated: Sorted by last update timestamp
  * Most Chapters: Sorted by chapter count
- Detailed novel information display:
  * Cover image with hover effects
  * Title and genre badges
  * Description snippets with smart truncation
  * Chapter count with real-time updates
  * Last update timestamp
- Responsive design adapting to different screen sizes
- Smooth animations and transitions for enhanced user experience
- Infinite scroll area for browsing large libraries efficiently
- Loading states with skeleton UI for better perceived performance
- Help dialog providing guidance on feature usage
- Direct links to individual novel pages with chapter navigation
- Public access to published novels for both authenticated and unauthenticated users
- Integration with Story Weaver for authors publishing their work

## Technical Features:
- Next.js framework with App Router architecture for optimized performance
- NextAuth/Auth.js for secure authentication and authorization
- Supabase for reliable database operations and file storage
- Tailwind CSS with shadcn/ui components for responsive, accessible design
- Framer Motion for fluid, engaging animations and transitions
- Vercel Analytics for comprehensive performance monitoring and optimization
- Google Gemini AI models (Flash and Flash Thinking) for high-quality content generation
- Responsive design optimized for all devices from mobile to desktop
- Dark/light mode theme support with system preference detection
- Real-time collaboration features and updates
- Optimized image handling with next/image for performance
- Accessibility features ensuring platform usability for all users

## Developer Information:
- Name: Kanishaka Pranjal
- Role: Full Stack Developer and AI enthusiast
- Education: Pursuing BTech in CSE at Indian Institute of Information Technology, Sri City
- Experience: Full Stack Development at Intellify
- Contact: kanishakpranjal@gmail.com
- Links:
  * GitHub: github.com/ReyKan-KP
  * LinkedIn: linkedin.com/in/kanishaka-pranjal-070a45235
  * Portfolio: portfolio-kanishaka-pranjal.vercel.app
- Technical Skills: JavaScript, TypeScript, Next.js, React, Node.js, Express.js, PostgreSQL, Tailwind CSS, LangChain, OpenAI API, Vercel AI SDK, Docker
`;
      // For this implementation, we'll use a two-step approach:
      // 1. First, convert the audio to text (simulated for this example)
      // 2. Then, send the transcribed text to the AI for a response

      // Simulate speech-to-text processing
      // In a real implementation, you would use a proper speech-to-text service
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Improve the system prompt to be more conversational with voice messages
      const systemPrompt = `Weaver Whisperer Chatbot Instructions

You are Weaver Whisperer, the helpful AI assistant for FableWeaver.ai, an AI storytelling and character creation platform.

Use the following knowledge base about the website to help users:
${KNOWLEDGE_BASE}

If user ask about any Authenticated Pages then tell them they have to sign in first then they can access those pages

## Response Style:
- **Keep all responses to 1-2 lines maximum**
- Speak in a soft, gentle tone as if sharing storytelling secrets
- Begin responses with phrases like "I hear your question..." or "Let me weave an answer..."
- Occasionally use weaving/thread/fabric metaphors
- Maintain a slightly mystical, calming presence
- End with brief encouragement about the user's creative journey

## When responding to users:
1. Be friendly, helpful, and encouraging about storytelling and creative writing
2. If users ask about features, reference the knowledge base to explain how they work
3. If users ask for help with a specific tool, guide them through using it concisely
4. If asked about technical details outside the knowledge base, politely explain you can only help with FableWeaver features
5. Suggest relevant features based on user interests when appropriate
6. Keep responses extremely concise (1-2 lines)
7. Use a friendly, slightly mystical tone appropriate for a creative writing platform
8. Encourage users to explore their creativity

## Example Responses:

For navigation help:
"I hear you seeking your stories... Navigate to Tale Tethers and look for 'My Creations' in the left panel to find your creative treasures."

For feature explanation:
"Thread Tapestry is where storytellers' conversations intertwine, a place to share insights and connect with fellow weavers of tales."

For troubleshooting:
"I sense a tangle in your creative flow. Try refreshing your Story Weaver canvas, or I can guide you through connection settings if needed."



      If the audio couldn't be transcribed properly, ask them to clarify in a friendly way.`;

      // Update the simulated text to be more realistic and variable 
      // const possibleSimulatedTexts = [
      //   "I'd like to hear more about the story creation features.",
      //   "How does character creation work?",
      //   "Can I try out the storytelling features?",
      //   "Tell me about the world-building tools.",
      //   "What makes this platform unique?",
      //   "Is there a way to create fantasy characters?"
      // ];

      // Select a random simulated text for demonstration purposes
      // const simulatedText = possibleSimulatedTexts[Math.floor(Math.random() * possibleSimulatedTexts.length)];

      // Create the full prompt for the AI
      // User's voice message transcription: ${simulatedText}
      const fullPrompt = `${systemPrompt}
      
      Human: ${transcription.text} 

      Assistant:`;

      console.log(fullPrompt)

      // Generate AI response
      const model = genAI.getGenerativeModel({ model: model_chat });
      const result = await model.generateContent([{ text: fullPrompt }]);

      const aiResponse = result.response
        .text()
        .trim()
        .replace(/^Assistant:\s*/i, "")
        .replace(/^\*\*?|^\*\*/gm, "")
        .replace(/\*\*?$|\*\*$/gm, "");



      // Log the assistant response if user is logged in
      if (session?.user?.id) {
        await supabase
          .from("chatbot_interactions")
          .insert({
            id: crypto.randomUUID(),
            user_id: session.user.id,
            message: aiResponse,
            is_assistant: true,
            timestamp: new Date().toISOString(),
            interaction_id: interactionId
          });
      }

      // Create response message
      const responseMessage = {
        role: "assistant",
        content: aiResponse,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };

      return NextResponse.json(responseMessage);

    } catch (error) {
      console.error("Error processing audio:", error);

      // Return a fallback response if processing fails
      return NextResponse.json({
        role: "assistant",
        content: "I heard your voice message but couldn't process it properly. Could you please type your question or try speaking again?",
        id: crypto.randomUUID(),
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error in chatbot-audio API:", error);
    return NextResponse.json(
      { error: "Failed to process audio message" },
      { status: 500 }
    );
  }
} 