<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Grok_AI-Powered-orange?style=for-the-badge" alt="Grok AI" />
</p>

<h1 align="center">GROKIFY</h1>

<p align="center">
  <strong>Transform any X timeline into bespoke AI artwork, savage roasts, and intelligence dossiers.</strong>
</p>

<p align="center">
  <a href="https://www.grokify.ai">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## Overview

**X-pressionist** analyzes public X (Twitter) accounts using xAI's Grok model with real-time search capabilities, then generates unique AI-powered content including satirical artwork, comedy roasts, FBI-style profiles, comprehensive OSINT dossiers, and street-style caricatures.

No login required. No API keys needed from users. Just enter a username and go.

---

## Features

| Feature | Description |
|---------|-------------|
| 🎨 **AI Artwork** | Generates satirical cartoon illustrations based on posting personality |
| 🔥 **Roast Letter** | Comedy Central-style therapy notes from the fictional "Dr. Burn Notice" |
| 🕵️ **FBI Profile** | Satirical FBI behavioral analysis reports with dark humor |
| 🔍 **OSINT Dossier** | Comprehensive intelligence-style analysis with viral content deep dive |
| ✏️ **Caricature** | Upload a photo and get a Times Square street artist-style caricature |
| ✨ **Grokify Prompt** | Transform any idea into a polished AI prompt with Grok |
| ⚡ **Grok Imagine** | Generate images & videos with xAI's Grok Imagine model - local IndexedDB gallery |
| 👥 **Joint Picture** | Generate artwork combining two X accounts together |
| 🖼️ **38 Art Styles** | 5 categories: Classic, Anime, Modern, Artistic, and Fun (see [full list](#art-styles)) |
| 📜 **Prompt History** | Local storage-based history with copy/delete functionality |
| 🔗 **Shareable Links** | Generate shareable URLs for created artwork |
| 📱 **Responsive Design** | Beautiful mobile-first UI with iPhone-style interface |

---

## Art Styles

X-pressionist offers **38 unique art styles** organized into 5 categories:

### Classic (8 styles)

| Style | ID | Description |
|-------|-----|-------------|
| MAD Magazine | `default` | Bold satirical cartoon style with vibrant colors and exaggerated expressions |
| Oil Painting | `oil` | Classical oil painting with rich textures and dramatic chiaroscuro lighting |
| Watercolor | `watercolor` | Soft, dreamy painting with flowing colors and gentle gradients |
| Charcoal Sketch | `charcoal` | Dramatic drawing with bold strokes, deep blacks, and expressive lines |
| Renaissance | `renaissance` | Classical Leonardo/Raphael style portrait with sfumato technique |
| Baroque | `baroque` | Ornate dramatic lighting in the style of Caravaggio or Rembrandt |
| Pencil Sketch | `pencil` | Detailed pencil drawing with fine linework and crosshatching |
| Art Deco | `artdeco` | 1920s geometric elegance with luxurious gold and black colors |

### Anime (7 styles)

| Style | ID | Description |
|-------|-----|-------------|
| Studio Ghibli | `ghibli` | Whimsical Miyazaki fantasy style with soft pastels and warm nostalgia |
| Anime | `anime` | Dynamic Japanese anime with bold lines and expressive eyes |
| Manga B&W | `manga` | Black & white manga panels with dramatic ink work and screentone shading |
| Chibi | `chibi` | Super-cute kawaii style with oversized head and tiny body |
| Ukiyo-e | `ukiyo` | Japanese woodblock prints in elegant Hokusai aesthetic |
| Shonen Action | `shonen` | Epic battle manga style like Dragon Ball or Naruto |
| Manhwa | `manhwa` | Korean webtoon style with clean digital linework |

### Modern (9 styles)

| Style | ID | Description |
|-------|-----|-------------|
| Pixar 3D | `pixar` | 3D animated movie style with expressive characters and vibrant colors |
| Cyberpunk | `cyberpunk` | Neon-lit futuristic style with holographic elements and pink/cyan palette |
| Vaporwave | `vaporwave` | 80s/90s aesthetic nostalgia with glitchy effects and gradient sunsets |
| Low Poly | `lowpoly` | Geometric 3D faceted style with clean angular shapes |
| Neon Glow | `neon` | Glowing neon light art with bright luminous outlines on dark background |
| Minimalist | `minimalist` | Clean minimal illustration with simple shapes and lots of white space |
| Glitch Art | `glitch` | Digital corruption aesthetic with RGB splitting and scan lines |
| Synthwave | `synthwave` | Retro-futuristic 80s with neon grids and sunset gradients |
| Hyperrealistic | `hyperreal` | Ultra-detailed photorealism with perfect textures |

### Artistic (8 styles)

| Style | ID | Description |
|-------|-----|-------------|
| Comic Book | `comic` | Bold Marvel/DC style with thick outlines, halftone dots, and action lines |
| Retro Pop Art | `retro` | 80s/90s pop art with neon colors, pixel elements, and synthwave vibes |
| Impressionist | `impressionist` | Monet/Renoir style with visible brushstrokes and dappled light |
| Surrealism | `surreal` | Dreamlike Salvador Dalí style with impossible imagery |
| Warhol Pop | `warhol` | Andy Warhol screen print aesthetic with bold flat colors |
| Film Noir | `noir` | Moody black & white 1940s cinema aesthetic |
| Expressionist | `expressionist` | Bold emotional distortion like Edvard Munch |
| Psychedelic | `psychedelic` | Trippy 60s colorful swirls and optical illusions |

### Fun (11 styles)

| Style | ID | Description |
|-------|-----|-------------|
| Sticker Art | `sticker` | Die-cut sticker aesthetic with bold outlines and flat vibrant colors |
| Claymation | `claymation` | Stop-motion clay style like Wallace & Gromit with charming handmade quality |
| Street Graffiti | `graffiti` | Urban spray paint art with dripping effects and raw street energy |
| Pixel Art | `pixel` | 8-bit retro game style with chunky pixels |
| LEGO | `lego` | Brick-built minifigure style with plastic sheen |
| Paper Cut | `papercut` | Layered paper craft art with visible shadows |
| Balloon Animal | `balloon` | Twisted balloon sculpture style |
| Plushie | `plushie` | Cute stuffed toy style with fuzzy textures |
| Vintage Photo | `vintage` | Old timey sepia portrait with Victorian styling |
| Steampunk | `steampunk` | Victorian brass & gears retro-futuristic aesthetic |
| Fantasy RPG | `fantasy` | Epic D&D character art with magical effects |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Database** | [Neon](https://neon.tech/) (Serverless Postgres) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **AI Analysis** | [xAI Grok](https://x.ai/) (grok-4-1-fast) |
| **Image Generation** | [xAI Grok Imagine](https://x.ai/) + [Google Gemini](https://ai.google.dev/) via [OpenRouter](https://openrouter.ai/) |
| **Video Generation** | [xAI Grok Imagine Video](https://x.ai/) |
| **Image Storage** | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) + IndexedDB (local) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Installation

### Prerequisites

- Node.js 18.17+
- npm, yarn, or pnpm
- API keys for [xAI](https://x.ai/) and [OpenRouter](https://openrouter.ai/)
- [Neon](https://neon.tech/) database (free tier available)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/xpressionist.git
cd xpressionist

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# xAI API (Grok analysis + X search)
XAI_API_KEY="xai-..."

# OpenRouter API (Gemini image generation)
OPENROUTER_API_KEY="sk-or-..."

# Vercel Blob (image storage)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Optional: GetImg.ai API (Flux fallback)
GETIMG_API_KEY="key-..."
```

---

## API Reference

### Generate Artwork

```http
POST /api/analyze-account
Content-Type: application/json

{ "handle": "username" }
```

```http
POST /api/generate-image
Content-Type: application/json

{ "prompt": "...", "handle": "username", "style": "ghibli" }
```

### Roast Letter

```http
POST /api/roast-account
Content-Type: application/json

{ "handle": "username" }
```

### FBI Profile

```http
POST /api/fbi-profile
Content-Type: application/json

{ "handle": "username" }
```

### OSINT Dossier

```http
POST /api/osint-profile
Content-Type: application/json

{ "handle": "username", "timeRange": "90" }
```

### Caricature

```http
POST /api/caricature
Content-Type: application/json

{ "imageDataUrl": "data:image/jpeg;base64,..." }
```

### Grokify Prompt

```http
POST /api/prompt-generate
Content-Type: application/json

{ "idea": "A dragon fighting a robot", "style": "cinematic" }
```

### Grok Imagine (Image)

```http
POST /api/imagine
Content-Type: application/json

{ "prompt": "...", "n": 2, "aspect_ratio": "16:9", "response_format": "b64_json" }
```

### Grok Imagine (Video)

```http
POST /api/imagine-video
Content-Type: application/json

{ "prompt": "...", "aspect_ratio": "16:9", "duration": 5 }
```

### Joint Picture

```http
POST /api/joint-pic
Content-Type: application/json

{ "handle1": "username1", "handle2": "username2" }
```

---

## Project Structure

```
xpressionist/
├── app/
│   ├── api/
│   │   ├── analyze-account/    # Profile analysis → image prompt
│   │   ├── generate-image/     # Prompt → Gemini image
│   │   ├── imagine/            # Grok Imagine image generation
│   │   ├── imagine-video/      # Grok Imagine video generation
│   │   ├── joint-pic/          # Joint picture for two accounts
│   │   ├── roast-account/      # Comedy roast generator
│   │   ├── fbi-profile/        # Satirical FBI report
│   │   ├── osint-profile/      # Intelligence dossier
│   │   ├── caricature/         # Photo → caricature
│   │   ├── prompt-generate/    # Grokify Prompt generator
│   │   └── upload-image/       # Vercel Blob storage
│   ├── imagine/                # Grok Imagine gallery page
│   ├── prompt/                 # Grokify Prompt page
│   ├── share/[id]/             # Shareable artwork pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── home/                   # Home page sections
│   ├── imagine/                # Grok Imagine components (gallery, sidebar, input bar)
│   ├── prompt/                 # Grokify Prompt components
│   ├── ui/                     # shadcn/ui components
│   ├── LoadingOverlay.tsx      # Animated loading states
│   ├── OsintReport.tsx         # OSINT dossier renderer
│   ├── PromptHistorySidebar.tsx
│   ├── ShareButton.tsx
│   └── StyleSelectorModal.tsx  # 38 art style selector
├── db/
│   ├── index.ts                # Neon connection
│   └── schema.ts               # Drizzle schema
├── hooks/
│   └── usePromptHistory.ts
├── hooks/
│   ├── usePromptHistory.ts     # Prompt history hook
│   └── useImagineStore.ts      # Grok Imagine gallery state
└── lib/
    ├── circuit-breaker.ts      # API resilience
    ├── fetchWithTimeout.ts     # API timeout handling
    ├── imagine-storage.ts      # IndexedDB storage for images
    ├── prompt-config.ts        # Grokify Prompt configuration
    ├── schemas.ts              # Zod validation schemas
    └── utils.ts
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables
4. Deploy

The database schema auto-applies on first request with Neon's serverless driver.

---

## AI Personas

X-pressionist uses specialized AI personas powered by Grok:

| Persona | Endpoint | Description |
|---------|----------|-------------|
| **Art Director AI** | `/api/analyze-account` | Translates X personalities into satirical cartoon prompts |
| **Dr. Burn Notice** | `/api/roast-account` | Comedy Central-style therapist delivering affectionate roasts |
| **FBI Profiler** | `/api/fbi-profile` | Cold, clinical behavioral analyst with dark humor |
| **OSINT Analyst** | `/api/osint-profile` | Elite intelligence analyst building comprehensive dossiers |
| **Street Artist** | `/api/caricature` | NYC Times Square caricature artist with quick wit |
| **Prompt Alchemist** | `/api/prompt-generate` | Expert prompt engineer transforming ideas into polished AI prompts |
| **Grok Imagine** | `/api/imagine` | xAI's native image generation with local gallery storage |

---

## Contributing

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

X-pressionist is funded by fees from **$GROKIFY** token.

<p align="center">
  <a href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS">
    <img src="https://img.shields.io/badge/$GROKIFY-8F2Fvu...BAGs-10B981?style=for-the-badge" alt="$GROKIFY Token" />
  </a>
</p>

---

## Acknowledgments

- [xAI](https://x.ai/) — Grok API with real-time X search
- [OpenRouter](https://openrouter.ai/) — Unified AI model access
- [Neon](https://neon.tech/) — Serverless Postgres
- [Vercel](https://vercel.com/) — Hosting & Blob storage
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components

---

<p align="center">
  <strong>Created by <a href="https://x.com/lamps_apple">Apple Lamps</a></strong>
</p>

<p align="center">
  <a href="https://x.com/lamps_apple">
    <img src="https://img.shields.io/badge/Follow-@lamps__apple-1DA1F2?style=for-the-badge&logo=x" alt="Follow @lamps_apple" />
  </a>
</p>

<p align="center">
  <sub>Powered by Grok AI & Gemini • Built with Next.js • Deployed on Vercel</sub>
</p>
