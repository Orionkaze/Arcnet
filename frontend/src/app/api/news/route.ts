import { NextResponse } from "next/server";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
}

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string | null;
  source?: {
    name?: string;
  } | null;
  publishedAt: string;
}

// Simple in-memory cache
let cachedNews: NewsArticle[] | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const MOCK_NEWS: NewsArticle[] = [
  {
    title: "Epic Games Unveils Unreal Engine 5.6: Major Nanite and Lumen Performance Breakthroughs",
    description: "Epic Games showcases next-gen rendering, path tracing updates, and real-time AI physics integration designed to optimize open-world game creation.",
    url: "https://www.gamedeveloper.com",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800",
    source: "Game Developer",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    title: "How Indie Developers are Redefining Procedural Generation in Metroidvanias",
    description: "Leading independent creators discuss balancing hand-crafted level design with algorithmic generation to create highly replayable explore-action titles.",
    url: "https://www.gamedeveloper.com",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800",
    source: "Game Developer",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
  },
  {
    title: "The Rise of Retro-Inspired Low-Poly Art Styles in Modern Horror Game Jams",
    description: "A look into how game developers are leveraging PS1-era graphics and crunch aesthetics to build atmospheric and highly immersive psychological horror experiences.",
    url: "https://www.ign.com",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800",
    source: "IGN",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
  },
  {
    title: "Unity 2026.2 LTS Released: Focuses on Mobile Workflows and WebGL Performance",
    description: "Unity's latest Long Term Support release brings substantial memory optimizations, DOTS integration updates, and faster compilation times for multi-platform teams.",
    url: "https://www.eurogamer.net",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800",
    source: "Eurogamer",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h ago
  },
  {
    title: "Top Game Design Trends from GDC 2026: Accessibility and Multi-Modal Inputs",
    description: "Industry veterans highlight how adaptive triggers, speech-to-text, and simplified control schemes are becoming standard design practices in AAA development.",
    url: "https://www.pcgamer.com",
    imageUrl: "https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=800",
    source: "PC Gamer",
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18h ago
  },
  {
    title: "Why Godot Engine is Seeing a Massive Surge in Professional Studio Adaptations",
    description: "From lightweight 2D physics to a modular C# workflow, mid-sized studios share their transition stories from proprietary platforms to open-source tech.",
    url: "https://www.kotaku.com",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800",
    source: "Kotaku",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
  }
];

export async function GET() {
  try {
    const now = Date.now();

    // Return from cache if valid
    if (cachedNews && now - lastFetched < CACHE_DURATION) {
      return NextResponse.json({ news: cachedNews, cached: true }, { status: 200 });
    }

    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      console.warn("NEWS_API_KEY is not defined, returning mock news.");
      cachedNews = MOCK_NEWS;
      lastFetched = now;
      return NextResponse.json({ news: MOCK_NEWS, cached: false }, { status: 200 });
    }

    // Query NewsAPI
    const query = encodeURIComponent("game development OR gaming OR unity OR unreal engine OR indie game");
    const domains = "gamedeveloper.com,eurogamer.net,pcgamer.com,rockpapershotgun.com,polygon.com,ign.com,kotaku.com";
    const url = `https://newsapi.org/v2/everything?q=${query}&domains=${domains}&language=en&sortBy=publishedAt&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error("Invalid response format from NewsAPI");
    }

    // Exclude casino, gambling, betting keywords from title/description
    const filterKeywords = ["casino", "gambling", "betting"];
    const filteredArticles: NewsArticle[] = data.articles
      .filter((article: NewsAPIArticle) => {
        const title = (article.title || "").toLowerCase();
        const description = (article.description || "").toLowerCase();
        return !filterKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
      })
      .map((article: NewsAPIArticle) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage || null,
        source: article.source?.name || "Gaming News",
        publishedAt: article.publishedAt,
      }));

    // Cache the successful results
    cachedNews = filteredArticles.length > 0 ? filteredArticles : MOCK_NEWS;
    lastFetched = now;

    return NextResponse.json({ news: cachedNews, cached: false }, { status: 200 });
  } catch (error) {
    console.error("Fetch News Error:", error);
    // Graceful fallback to mock news
    return NextResponse.json({ news: MOCK_NEWS, cached: false, error: "Failed to fetch from NewsAPI, falling back to mock news" }, { status: 200 });
  }
}
