<p align="center">
  <img src="logo.png" alt="BonsAI" width="80" />
</p>

<h1 align="center">BonsAI</h1>

<p align="center">
  <strong>Research distilled daily.</strong><br/>
  An AI-powered digest that summarizes academic papers from arXiv and HuggingFace into readable breakdowns — delivered fresh every morning.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#topics">Topics</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## What is BonsAI?

BonsAI is a daily research digest that pulls top papers from **HuggingFace Daily Papers** and **arXiv**, summarizes them with **Google Gemini**, and presents them in a clean, magazine-style interface. Think of it as your morning newspaper for research — three sections covering Research, Engineering, and Business.

Instead of skimming abstracts or reading 20-page PDFs, you get AI-generated summaries, key findings, technical breakdowns with LaTeX equations, and auto-generated architecture diagrams.

## Features

**Research Tab**
- Daily feed of top papers with AI-generated summaries and tags
- 7 topics with 50+ subtopics — from LLMs and computer vision to number theory and quantum physics
- AI-generated trend analysis identifying research gaps and emerging directions
- Browse and import papers on-demand from HuggingFace and arXiv

**Engineering Tab**
- Dev Pulse — AI analysis of engineering trends from the latest papers
- RSS integration with Simon Willison's blog
- Curated engineering guides and newsletter digests

**Business Tab**
- Live AI stock ticker
- AI-generated market trend analysis
- TechCrunch news aggregation
- Business-focused newsletter content

**Paper Deep Dives**
- Full markdown summaries with LaTeX math rendering (KaTeX)
- Auto-generated Mermaid diagrams for architectures and workflows
- PDF figure extraction with descriptions
- TLDR, key findings, and technical detail sections

**PWA Support**
- Installable on mobile and desktop
- Service worker with cache-first strategy
- Offline-capable for previously loaded content

## Topics

| Domain | Subtopics |
|--------|-----------|
| **A.I.** | LLMs, Computer Vision, Robotics, RL, Multimodal, Audio/Speech, Information Retrieval, Neural Architecture, ML Theory |
| **Computer Science** | Algorithms, Databases, Networks, Security, Software Eng., Distributed Systems, HCI, Programming Languages, Theory |
| **Mathematics** | Algebra, Analysis, Combinatorics, Geometry, Number Theory, Probability, Optimization, Topology |
| **Quant. Finance** | Comp. Finance, Mathematical Finance, Portfolio Mgmt, Pricing, Risk Mgmt, Trading |
| **Physics** | Astrophysics, Condensed Matter, HEP, Quantum, Statistical Mechanics |
| **Statistics** | Applications, Computation, Methodology, ML, Theory |
| **Elec. Eng.** | Audio/Speech, Image/Video, Signal Processing, Systems |

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion, shadcn/ui |
| **AI** | Google Gemini 2.5 Pro/Flash |
| **Rendering** | KaTeX (math), Mermaid (diagrams), react-markdown |
| **Data Sources** | arXiv API, HuggingFace API, RSS feeds |
| **PDF** | PDF.js for figure extraction |
| **Deployment** | Vercel with daily cron jobs |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### Setup

```bash
git clone https://github.com/your-username/bonsai.git
cd bonsai
npm install
```

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see BonsAI.

### Fetching Papers

Papers are fetched daily via a cron job. To trigger a manual fetch locally:

```bash
curl http://localhost:3000/api/fetch-papers
```

This pulls papers from HuggingFace and arXiv, summarizes them with Gemini, and stores them in `data/papers/`.

## Deployment

BonsAI is configured for **Vercel** out of the box.

1. Push to GitHub and import the repo on [Vercel](https://vercel.com)
2. Add `GEMINI_API_KEY` to your environment variables
3. Deploy — the daily cron job (`vercel.json`) will automatically fetch papers at 8:00 AM UTC

## Architecture

```
app/
├── page.tsx                     # Main feed with Research / Engineering / Business tabs
├── paper/[id]/page.tsx          # Paper deep-dive page
├── blog/[id]/page.tsx           # Blog post viewer
├── rundown/[id]/page.tsx        # Newsletter article viewer
└── api/
    ├── feed/                    # Paper feed endpoint
    ├── papers/[id]/             # Individual paper data
    ├── fetch-papers/            # Daily cron — fetches & summarizes papers
    ├── trends/                  # AI research trend analysis
    ├── browse-papers/           # Browse HuggingFace papers
    ├── import-paper/            # On-demand paper import
    ├── blog/                    # Simon Willison RSS
    ├── rundown/                 # The Rundown AI RSS
    ├── business/                # TechCrunch news
    ├── stocks/                  # AI stock quotes
    ├── market-trends/           # Market analysis
    └── dev-pulse/               # Engineering trends

components/                      # UI components (paper cards, nav, modals, etc.)
lib/                             # Core logic (Gemini, arXiv, HuggingFace, storage)
data/papers/                     # Cached paper summaries (date-organized JSON)
```

## License

MIT

---

<p align="center">
  Built with Next.js, Gemini, and too much coffee.
</p>
