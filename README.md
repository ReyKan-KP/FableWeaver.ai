# FableWeaver.ai 🎭✨

<p align="center">
  <h3 align="center">Where AI Weaves Your Story Universe</h3>
  <p align="center">An innovative AI-powered platform for creating and interacting with dynamic story characters and personalized story recommendations.</p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#development">Development</a> •
  <a href="#deployment">Deployment</a>
</p>

## ✨ Features

### 🤖 AI-Powered Character Interactions
- Dynamic character conversations with context awareness
- Real-time message exchange with animated responses
- Character personality persistence across sessions

### 🎭 Character Realm
- Create and customize unique story characters
- Character confluence for multi-character interactions
- Interactive character showcases

### 🎯 Smart Recommendation System
- Personalized story and character suggestions
- AI-driven content curation based on user preferences
- Watch history tracking and analysis
- Collaborative filtering for better recommendations
- Real-time recommendation updates

### 🔐 Secure Authentication
- Multiple sign-in options (Google & Email)
- Protected routes and secure sessions
- Seamless profile management

### 💫 Modern UI/UX
- Responsive design with beautiful animations
- Dark/Light theme support
- Interactive components with Framer Motion
- Toast notifications and loading states

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: Supabase
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Analytics**: Vercel Analytics
- **Recommendation Engine**: Custom AI model with collaborative filtering
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- npm or yarn
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/ReyKan-KP/FableWeaver.ai
cd fableweaver.ai
```


2. Install dependencies
```bash
npm install   # or yarn install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in the required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

5. Run the development server
```bash
npm run dev   # or yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## 📁 Project Structure

```
├── app/
│   ├── (authenticated)/     # Protected routes
│   ├── (unauthenticated)/  # Public routes
│   ├── (auth)/             # Auth routes
│   ├── api/                # API endpoints
│   ├── types/              # Type definitions
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # UI components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   ├── recommendation-form.tsx  # Recommendation system UI
│   ├── watched-anime-list.tsx   # User's watch history
│   └── [feature].tsx      # Feature components
└── lib/
    ├── auth.ts            # Auth config
    ├── supabase.ts        # Database config
    ├── types.ts           # Shared types
    ├── recommendation.ts  # Recommendation engine logic
    └── utils.ts           # Utilities
```

## 💻 Development

### Code Style
- Use TypeScript for type safety
- Follow component-based architecture
- Implement proper error handling
- Maintain consistent styling with Tailwind CSS

### Running Tests
```bash
npm run test   # or yarn test
```

### Linting
```bash
npm run lint   # or yarn lint
```

### Environment Variables

Ensure these environment variables are set in your deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `RECOMMENDATION_API_KEY`  # For recommendation system
- `AI_MODEL_ENDPOINT`       # For AI model integration

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@fableweaver.ai or join our Discord community.

---

<p align="center">Made with ❤️ by the FableWeaver Team</p>
