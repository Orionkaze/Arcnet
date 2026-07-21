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
    title: "McKinsey's 2026 State of Consulting: Why Case Skills Still Beat Credentials",
    description: "A new report finds that structured problem-solving and hypothesis-driven thinking remain the strongest predictors of early-career consulting performance, ahead of school pedigree.",
    url: "https://www.mckinsey.com/featured-insights",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800",
    source: "McKinsey Insights",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    title: "Investment Banks Rework Analyst Screening Around Live Valuation Tests",
    description: "Bulge-bracket recruiters are shifting from resume-first funnels to timed DCF and LBO modeling exercises, rewarding candidates who can reason about numbers under pressure.",
    url: "https://www.efinancialcareers.com",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800",
    source: "eFinancialCareers",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
  },
  {
    title: "The Product Sense Interview, Decoded: What Great PM Answers Have in Common",
    description: "Hiring managers break down how strong candidates frame ambiguous product problems, pick metrics that matter, and defend tradeoffs instead of listing features.",
    url: "https://www.lennysnewsletter.com",
    imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800",
    source: "Lenny's Newsletter",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
  },
  {
    title: "SQL and Statistics Still Dominate 2026 Data Analyst Screens, Survey Finds",
    description: "Despite the AI tooling boom, employers report that fluency in joins, window functions, and basic inference separates job-ready analysts from the rest of the pipeline.",
    url: "https://www.kdnuggets.com",
    imageUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=800",
    source: "KDnuggets",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h ago
  },
  {
    title: "Guesstimates Make a Comeback: How Estimation Drills Sharpen Business Judgment",
    description: "Coaches argue that order-of-magnitude estimation—long a consulting staple—builds the numerical intuition that shows up across finance, product, and strategy roles.",
    url: "https://hbr.org",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    source: "Harvard Business Review",
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18h ago
  },
  {
    title: "Skills-Based Hiring Overtakes Degree Filters at Top Employers in 2026",
    description: "A wave of firms is dropping degree requirements in favor of demonstrated ability, putting portfolios and verified assessments at the center of the recruiting process.",
    url: "https://www.weforum.org/agenda",
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800",
    source: "World Economic Forum",
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
    const query = encodeURIComponent("management consulting OR investment banking OR product management OR data analytics OR case interview OR careers");
    const domains = "hbr.org,mckinsey.com,efinancialcareers.com,lennysnewsletter.com,kdnuggets.com,weforum.org,cnbc.com";
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
        source: article.source?.name || "Careers News",
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
