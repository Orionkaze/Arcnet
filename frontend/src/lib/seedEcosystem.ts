import { prisma } from "@/lib/prisma";

const DAY = 24 * 60 * 60 * 1000;

const JOBS = [
  { title: "Business Analyst", company: "McKinsey & Company", location: "Gurugram, HR", type: "Full-Time", ctc: "₹18-24 LPA", skills: ["Case Solving", "Excel", "PowerPoint", "Problem Structuring"], days: 2,
    description: "Join our consulting team to solve ambiguous business problems for top clients. You'll structure issues, build models, run analyses, and present crisp recommendations to senior stakeholders across industries." },
  { title: "Investment Banking Analyst", company: "Goldman Sachs", location: "Mumbai, MH", type: "Full-Time", ctc: "₹16-22 LPA", skills: ["Valuation", "Financial Modeling", "DCF", "Excel"], days: 3,
    description: "Support M&A and capital-markets deals on the IBD floor. Expect deep work on three-statement models, comparable-company analysis, pitch books, and due diligence for live transactions." },
  { title: "Data Analyst Intern", company: "Swiggy", location: "Bengaluru, KA", type: "Internship", ctc: "₹40,000/month", skills: ["SQL", "Python", "Tableau", "Statistics"], days: 1,
    description: "A 6-month internship on the analytics team. You'll write SQL, build dashboards, run A/B tests, and turn messy operational data into insights that drive product and growth decisions." },
  { title: "Consulting Associate", company: "Bain & Company", location: "New Delhi, DL", type: "Contract", ctc: "₹15-20 LPA", skills: ["Market Sizing", "Frameworks", "Client Comms", "Research"], days: 5,
    description: "12-month engagement supporting case teams on profitability, market-entry, and growth strategy work. Own workstreams, synthesize findings, and help shape the final client recommendation." },
  { title: "Associate Product Manager", company: "Flipkart", location: "Remote", type: "Remote", ctc: "₹18-26 LPA", skills: ["Product Sense", "Metrics", "Roadmapping", "SQL"], days: 4,
    description: "Own a slice of the product roadmap for a surface used by millions. You'll write PRDs, define metrics, partner with engineering and design, and iterate on what moves the numbers that matter." },
  { title: "Equity Research Intern", company: "Morgan Stanley", location: "Mumbai, MH", type: "Internship", ctc: "₹35,000/month", skills: ["Excel", "Valuation", "Industry Research", "Modeling"], days: 6,
    description: "Assist senior analysts in covering listed companies and sectors. Build models, track earnings, and draft the research notes that inform institutional investment decisions." },
  { title: "Data Scientist", company: "Zomato", location: "Bengaluru, KA", type: "Full-Time", ctc: "₹20-28 LPA", skills: ["Python", "SQL", "Machine Learning", "Experimentation"], days: 7,
    description: "Build models and experiments that power personalization, pricing, and growth for millions of users. You'll own the full loop from problem framing to production impact alongside product and engineering." },
  { title: "Strategy Consultant (Contract)", company: "BCG", location: "Remote", type: "Remote", ctc: "₹18-25 LPA", skills: ["Case Structuring", "Analytics", "Storylining", "Excel"], days: 7,
    description: "Remote engagement helping clients with growth and operations strategy. Structure problems, run the analysis, and turn findings into a clear, executive-ready storyline." },
];

const MENTORS = [
  { firstName: "Aarav", lastName: "Menon", role: "Engagement Manager", company: "McKinsey & Company", specialty: "Consulting", years: 11, rating: 4.9, sessions: 132, price: 1800, verified: true,
    bio: "Ex-BCG, now EM. I help you structure ambiguous cases and land a crisp, MECE recommendation.", expertise: ["Case Structuring", "Guesstimates", "Frameworks"] },
  { firstName: "Priya", lastName: "Sharma", role: "Investment Banking Associate", company: "Goldman Sachs", specialty: "Finance", years: 9, rating: 4.8, sessions: 88, price: 1500, verified: true,
    bio: "IB associate on the M&A desk. Valuation, LBOs, and building models that survive scrutiny.", expertise: ["DCF", "LBO", "Financial Modeling"] },
  { firstName: "Rohan", lastName: "Iyer", role: "Senior Product Manager", company: "Flipkart", specialty: "Product", years: 8, rating: 4.9, sessions: 64, price: 1600, verified: true,
    bio: "Shipped 0-to-1 features to millions. Sharpen your product sense and metric-driven thinking.", expertise: ["Product Sense", "Metrics", "Prioritization"] },
  { firstName: "Ananya", lastName: "Nair", role: "Data Scientist", company: "Swiggy", specialty: "Data", years: 7, rating: 5.0, sessions: 45, price: 2000, verified: true,
    bio: "SQL, statistics, and A/B testing. I review your case approach and clean up your analysis.", expertise: ["SQL", "A/B Testing", "Statistics"] },
  { firstName: "Vikram", lastName: "Reddy", role: "Placement Mentor", company: "Ex-CAT 99.8%iler", specialty: "Aptitude", years: 10, rating: 4.7, sessions: 97, price: 1500, verified: true,
    bio: "Quant and DI coach. From fundamentals to speed, I get you interview- and test-ready.", expertise: ["Quant", "Data Interpretation", "Logical Reasoning"] },
  { firstName: "Sneha", lastName: "Kulkarni", role: "Strategy Consultant", company: "Bain & Company", specialty: "Consulting", years: 6, rating: 4.8, sessions: 51, price: 1400, verified: false,
    bio: "Profitability and market-entry cases. I stress-test your logic before the interviewer does.", expertise: ["Profitability", "Market Entry", "Mock Interviews"] },
  { firstName: "Kabir", lastName: "Deshmukh", role: "Equity Research Analyst", company: "Morgan Stanley", specialty: "Finance", years: 8, rating: 4.9, sessions: 73, price: 1700, verified: true,
    bio: "Markets, comps, and three-statement models. I help you talk stocks like a pro in interviews.", expertise: ["Equity Research", "Comparables", "Markets"] },
  { firstName: "Meera", lastName: "Pillai", role: "Analytics Lead", company: "Zomato", specialty: "Data", years: 12, rating: 4.9, sessions: 110, price: 2200, verified: true,
    bio: "Dashboards, experimentation, and metrics. If your analysis is slow or fuzzy, talk to me.", expertise: ["Dashboards", "Experimentation", "Product Analytics"] },
];

/**
 * Seeds the ecosystem directories (Jobs, Mentors). Idempotent: it clears its
 * own tables (and their child applications/bookings) before re-creating.
 */
export async function seedEcosystem() {
  await prisma.jobApplication.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.mentorBooking.deleteMany({});
  await prisma.mentor.deleteMany({});

  const now = Date.now();
  for (const j of JOBS) {
    const { days, ...rest } = j;
    await prisma.job.create({ data: { ...rest, postedAt: new Date(now - days * DAY) } });
  }
  for (const m of MENTORS) {
    await prisma.mentor.create({ data: m });
  }
}
