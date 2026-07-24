/**
 * Caliber demo seed.
 *
 * Populates a fresh database with a coherent, fully-demoable dataset:
 *  - 3 verified/onboarded demo users you can log in as (see DEMO_PASSWORD)
 *  - Practice tracks + auto-scored problems (guesstimate / numeric / mcq)
 *  - A per-track rating + rating history so the credential page has data
 *  - An open-ended (peer-reviewed) problem that is already "scored"
 *  - A live competition with a ranked leaderboard (incl. a tie)
 *  - A DM conversation + a notification so those surfaces aren't empty
 *
 * Idempotent: it deletes the demo dataset it manages, then recreates it.
 * Run with:  npx prisma migrate dev && npx prisma db seed
 */
// `prisma db seed` runs this file directly via tsx, which — unlike Next.js or
// the Prisma CLI — does not auto-load `.env`. Load it explicitly first.
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { seedHubs } from "../src/lib/seedHubs";
import { seedEcosystem } from "../src/lib/seedEcosystem";

const DEMO_PASSWORD = "caliber1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // --- Users (idempotent upsert by email) ------------------------------------
  // Fully-filled profiles so the profile page (bio / role / location / skills /
  // social links) reads as a real credential rather than an empty shell.
  const userSpecs = [
    {
      email: "demo@caliber.dev", username: "demo", firstName: "Demo", lastName: "User",
      role: "Final-year student · Consulting aspirant", location: "Bengaluru, India",
      bio: "Prepping for consulting and product roles. Grinding guesstimates and cases daily, and tracking it all with a Caliber rating instead of a resume line.",
      skills: "Case Structuring,Guesstimates,Market Sizing,SQL,Product Sense",
      socialLinks: [
        { platform: "linkedin", url: "https://www.linkedin.com/in/demo" },
        { platform: "github", url: "https://github.com/demo" },
      ],
    },
    {
      email: "arjun@caliber.dev", username: "arjun", firstName: "Arjun", lastName: "Shah",
      role: "MBA candidate · Ex-analyst", location: "Mumbai, India",
      bio: "Recovering spreadsheet monkey turned case-cracker. Here to run mock interviews and lose to Sara on the leaderboard.",
      skills: "Valuation,DCF,Profitability Cases,Excel,Frameworks",
      socialLinks: [{ platform: "linkedin", url: "https://www.linkedin.com/in/arjun" }],
    },
    {
      email: "sara@caliber.dev", username: "sara", firstName: "Sara", lastName: "Iyer",
      role: "Data analyst · PM hopeful", location: "Pune, India",
      bio: "Numbers person moving into product. I like clean SQL, sharp metrics, and product-sense questions that force a real tradeoff.",
      skills: "SQL,Statistics,A/B Testing,Product Metrics,Dashboards",
      socialLinks: [
        { platform: "linkedin", url: "https://www.linkedin.com/in/sara" },
        { platform: "github", url: "https://github.com/sara" },
      ],
    },
  ];
  const users: Record<string, { id: string }> = {};
  for (const u of userSpecs) {
    const profile = {
      role: u.role, location: u.location, bio: u.bio, skills: u.skills,
      socialLinks: u.socialLinks,
    };
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { isVerified: true, isOnboarded: true, username: u.username, password: passwordHash, ...profile },
      create: {
        email: u.email,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        password: passwordHash,
        isVerified: true,
        isOnboarded: true,
        ...profile,
      },
      select: { id: true },
    });
    users[u.username] = user;
  }
  const demo = users["demo"].id;
  const arjun = users["arjun"].id;
  const sara = users["sara"].id;
  const demoIds = [demo, arjun, sara];

  // --- Clean the demo dataset (child-first) ----------------------------------
  await prisma.caliberReview.deleteMany({});
  await prisma.caliberOpenSubmission.deleteMany({});
  await prisma.caliberOpenProblem.deleteMany({});
  await prisma.caliberCompetition.deleteMany({}); // cascades entries / comp-problems / comp-submissions
  await prisma.caliberRatingHistory.deleteMany({});
  await prisma.caliberRating.deleteMany({});
  await prisma.caliberTrack.deleteMany({}); // cascades problems -> submissions & competition links
  await prisma.notification.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.hubMember.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.portfolioProject.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.experience.deleteMany({ where: { userId: { in: demoIds } } });
  // Channels survive re-seeding (seedHubs only creates missing ones), so clear
  // chat messages explicitly or they accumulate. Reactions have no cascade from
  // Message, and pinnedMessageId must be released before the rows are deleted.
  await prisma.messageReaction.deleteMany({});
  await prisma.channel.updateMany({ data: { pinnedMessageId: null } });
  await prisma.message.deleteMany({});
  // Post children have no cascade, so clear them before the posts themselves.
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.repost.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({
    where: { OR: [{ followerId: { in: demoIds } }, { followingId: { in: demoIds } }] },
  });
  await prisma.conversation.deleteMany({
    where: { OR: [{ user1Id: { in: demoIds } }, { user2Id: { in: demoIds } }] },
  }); // cascades direct messages

  // --- Tracks ----------------------------------------------------------------
  const guesstimates = await prisma.caliberTrack.create({
    data: { slug: "guesstimates", name: "Guesstimates", kind: "quant", description: "Order-of-magnitude estimation under structured rubrics." },
    select: { id: true },
  });
  const finance = await prisma.caliberTrack.create({
    data: { slug: "finance", name: "Finance & Valuation", kind: "quant", description: "Numeric valuation, DCF, and finance fundamentals." },
    select: { id: true },
  });
  const aptitude = await prisma.caliberTrack.create({
    data: { slug: "aptitude", name: "Aptitude & DI", kind: "quant", description: "Quantitative aptitude and data interpretation." },
    select: { id: true },
  });
  const consulting = await prisma.caliberTrack.create({
    data: { slug: "consulting", name: "Consulting Cases", kind: "open", description: "Open-ended case cracking, peer reviewed against a rubric." },
    select: { id: true },
  });

  // --- Auto-scored problems --------------------------------------------------
  const g1 = await prisma.caliberProblem.create({
    data: {
      trackId: guesstimates.id, type: "guesstimate", difficulty: 1500, maxPoints: 100,
      prompt: "How many piano tuners are there in Chicago?",
      config: { answer: 125, bands: [{ maxRatio: 2, points: 100 }, { maxRatio: 5, points: 60 }, { maxRatio: 10, points: 30 }] },
    },
    select: { id: true },
  });
  const g2 = await prisma.caliberProblem.create({
    data: {
      trackId: guesstimates.id, type: "guesstimate", difficulty: 1650, maxPoints: 100,
      prompt: "How many cups of coffee are sold in Mumbai per day?",
      config: { answer: 3_000_000, bands: [{ maxRatio: 2, points: 100 }, { maxRatio: 5, points: 60 }, { maxRatio: 10, points: 30 }] },
    },
    select: { id: true },
  });
  const g3 = await prisma.caliberProblem.create({
    data: {
      trackId: guesstimates.id, type: "guesstimate", difficulty: 1400, maxPoints: 100,
      prompt: "How many golf balls fit inside a standard school bus?",
      config: { answer: 500_000, bands: [{ maxRatio: 2, points: 100 }, { maxRatio: 5, points: 60 }, { maxRatio: 10, points: 30 }] },
    },
    select: { id: true },
  });
  await prisma.caliberProblem.create({
    data: {
      trackId: finance.id, type: "numeric", difficulty: 1550, maxPoints: 100,
      prompt: "A perpetuity pays ₹1,000 per year forever. At an 8% discount rate, what is its present value (₹)?",
      config: { answer: 12500, tolerance: 100 },
    },
  });
  await prisma.caliberProblem.create({
    data: {
      trackId: aptitude.id, type: "mcq", difficulty: 1300, maxPoints: 10,
      prompt: "A train travels 60 km in 45 minutes. Its speed is:  (1) 45 km/h  (2) 80 km/h  (3) 75 km/h  (4) 90 km/h",
      config: { correctIndex: 1, optionCount: 4 },
    },
  });

  // --- Ratings + history (so the credential page is alive) -------------------
  await prisma.caliberRating.create({ data: { userId: demo, trackId: guesstimates.id, value: 1340 } });
  await prisma.caliberRating.create({ data: { userId: demo, trackId: finance.id, value: 1275 } });
  await prisma.caliberRatingHistory.createMany({
    data: [
      { userId: demo, trackId: guesstimates.id, value: 1216, delta: 16, problemId: g1.id },
      { userId: demo, trackId: guesstimates.id, value: 1290, delta: 74, problemId: g2.id },
      { userId: demo, trackId: guesstimates.id, value: 1340, delta: 50, problemId: g3.id },
    ],
  });
  await prisma.caliberSubmission.create({
    data: { problemId: g1.id, userId: demo, value: 150, score: 100, feedback: "Great estimate — right order of magnitude.", countedForRating: true },
  });

  // --- Open (peer-reviewed) problem, already scored --------------------------
  const openProblem = await prisma.caliberOpenProblem.create({
    data: {
      trackId: consulting.id, maxPoints: 100,
      prompt: "A regional coffee chain's same-store sales fell 15% last quarter. Structure the problem and recommend two actions.",
      rubric: [
        { key: "structure", label: "Problem structure", maxPoints: 30 },
        { key: "analysis", label: "Analysis & insight", maxPoints: 40 },
        { key: "recommendation", label: "Recommendation", maxPoints: 30 },
      ],
    },
    select: { id: true },
  });
  const openSub = await prisma.caliberOpenSubmission.create({
    data: {
      problemId: openProblem.id, userId: demo, status: "scored", score: 81,
      answer: "I'd split the 15% decline into traffic vs. ticket size, then internal (menu, pricing, service) vs. external (competition, macro)...",
    },
    select: { id: true },
  });
  await prisma.caliberReview.createMany({
    data: [
      { submissionId: openSub.id, reviewerId: arjun, total: 78, scores: { structure: 24, analysis: 32, recommendation: 22 } },
      { submissionId: openSub.id, reviewerId: sara, total: 84, scores: { structure: 27, analysis: 34, recommendation: 23 } },
    ],
  });

  // Pending submissions from the *other* users, so the signed-in demo user
  // actually has something in their review inbox. (The queue excludes your own
  // submissions, so without these the peer-review feature looks empty.)
  const openProblem2 = await prisma.caliberOpenProblem.create({
    data: {
      trackId: consulting.id, maxPoints: 100,
      prompt: "A B2B SaaS company's net revenue retention dropped from 115% to 98% in two quarters. Diagnose the likely drivers and recommend where to focus first.",
      rubric: [
        { key: "structure", label: "Problem structure", maxPoints: 30 },
        { key: "analysis", label: "Analysis & insight", maxPoints: 40 },
        { key: "recommendation", label: "Recommendation", maxPoints: 30 },
      ],
    },
    select: { id: true },
  });
  await prisma.caliberOpenSubmission.createMany({
    data: [
      {
        problemId: openProblem2.id, userId: arjun, status: "pending",
        answer: "NRR is expansion minus churn and downgrade, so I'd decompose it into those three first. A 17-point drop is too large for pricing alone, so I'd check whether a cohort renewed onto a cheaper tier, whether seat counts shrank inside retained accounts, and whether logo churn concentrated in one segment. My hypothesis is seat contraction in the SMB cohort. First focus: instrument seat-level usage before touching price.",
      },
      {
        problemId: openProblem2.id, userId: sara, status: "pending",
        answer: "I'd start by splitting retained vs churned accounts and looking at expansion revenue separately, because NRR blends three very different motions. If gross retention held and expansion collapsed, that's a product-adoption problem, not a churn problem. I'd look at time-to-value for accounts onboarded in the last two quarters and prioritise the onboarding fix, since it compounds across every future cohort.",
      },
    ],
  });

  // --- Live competition with a ranked leaderboard (incl. a tie) --------------
  const now = Date.now();
  const comp = await prisma.caliberCompetition.create({
    data: {
      slug: "weekly-guesstimate-league", name: "Weekly Guesstimate League",
      description: "A timed set of guesstimates. Sharpest estimators top the board.",
      startsAt: new Date(now - 2 * 60 * 60 * 1000),
      endsAt: new Date(now + 5 * 24 * 60 * 60 * 1000),
      problems: {
        create: [
          { problemId: g1.id, order: 0 },
          { problemId: g2.id, order: 1 },
          { problemId: g3.id, order: 2 },
        ],
      },
    },
    select: { id: true },
  });
  // Entries drive the leaderboard (totalScore desc, lastScoredAt asc for ties).
  await prisma.caliberCompetitionEntry.createMany({
    data: [
      { competitionId: comp.id, userId: sara, totalScore: 200, lastScoredAt: new Date(now - 30 * 60 * 1000) },
      { competitionId: comp.id, userId: arjun, totalScore: 200, lastScoredAt: new Date(now - 10 * 60 * 1000) },
      { competitionId: comp.id, userId: demo, totalScore: 160, lastScoredAt: new Date(now - 5 * 60 * 1000) },
    ],
  });

  // --- A DM conversation + a notification (so those surfaces aren't empty) ----
  const [u1, u2] = [demo, arjun].sort();
  const convo = await prisma.conversation.create({
    data: { user1Id: u1, user2Id: u2 },
    select: { id: true },
  });
  await prisma.directMessage.createMany({
    data: [
      { conversationId: convo.id, senderId: arjun, content: "Nice score on the piano-tuners one 👀", isRead: true },
      { conversationId: convo.id, senderId: demo, content: "haha thanks — the coffee one wrecked me though", isRead: false },
    ],
  });
  await prisma.notification.create({
    data: { type: "follow", userId: demo, fromUserId: arjun },
  });

  // --- Community hubs --------------------------------------------------------
  // The left sidebar links to /hub/{consulting,finance,product,data,aptitude};
  // seed the hubs (+ channels) so those aren't "Hub not found", and make the
  // three demo users members so each hub shows a populated community.
  const hubs = await seedHubs();
  for (const hub of hubs) {
    await prisma.hubMember.createMany({
      data: [
        { hubId: hub.id, userId: demo, role: "owner" },
        { hubId: hub.id, userId: arjun, role: "member" },
        { hubId: hub.id, userId: sara, role: "member" },
      ],
    });
    await prisma.hub.update({ where: { id: hub.id }, data: { memberCount: 3 } });
  }
  const hubBySlug = Object.fromEntries(hubs.map((h) => [h.slug, h.id])) as Record<string, string>;

  // --- Hub chatroom messages -------------------------------------------------
  // Every hub channel was empty ("This channel is quiet"), so the chatroom —
  // the main reason to open a hub — looked unbuilt. Seed real conversations in
  // the busiest channels, plus a reaction and a pinned message.
  const chatSeed: { hub: string; channel: string; lines: { by: string; text: string; mins: number }[] }[] = [
    {
      hub: "consulting", channel: "general", lines: [
        { by: arjun, text: "Morning all — running a case drill Thursday 8pm if anyone wants a partner.", mins: 240 },
        { by: sara, text: "I'm in. Profitability or market entry?", mins: 232 },
        { by: arjun, text: "Market entry. I keep rushing the framework and missing the competitive piece.", mins: 228 },
        { by: demo, text: "Same problem here. Count me in as the third.", mins: 219 },
        { by: sara, text: "Perfect. I'll bring two prompts so nobody has seen them before.", mins: 210 },
      ],
    },
    {
      hub: "consulting", channel: "case-cracking", lines: [
        { by: demo, text: "Does anyone actually write out the full issue tree in the interview, or just the top two branches?", mins: 180 },
        { by: sara, text: "Top two, then say out loud which branch you'd go down first and why. Interviewers care about the prioritisation more than completeness.", mins: 174 },
        { by: arjun, text: "Agreed. Full tree eats four minutes you don't have.", mins: 170 },
      ],
    },
    {
      hub: "finance", channel: "valuation", lines: [
        { by: sara, text: "Quick sanity check: for a stable consumer business would you use a perpetuity growth or an exit multiple for TV?", mins: 300 },
        { by: arjun, text: "Exit multiple for the base case, perpetuity growth as the cross-check. If they disagree wildly your assumptions are off somewhere.", mins: 292 },
        { by: demo, text: "That cross-check framing is genuinely useful, thanks.", mins: 286 },
      ],
    },
    {
      hub: "data", channel: "sql", lines: [
        { by: arjun, text: "Reminder that ROW_NUMBER, RANK and DENSE_RANK differ on ties — that's the classic screening gotcha.", mins: 150 },
        { by: demo, text: "Got caught by exactly that last week. RANK skips numbers after a tie, DENSE_RANK doesn't.", mins: 143 },
      ],
    },
    {
      hub: "product", channel: "product-sense", lines: [
        { by: sara, text: "If you're asked to improve a metric, always ask what the guardrail metric is first. Nobody wants engagement up and retention down.", mins: 200 },
        { by: demo, text: "Saving this one.", mins: 195 },
      ],
    },
    {
      hub: "aptitude", channel: "quant", lines: [
        { by: demo, text: "Anyone have a good drill set for percentage/ratio speed? My accuracy is fine but I'm slow.", mins: 130 },
        { by: arjun, text: "Do 20 a day timed at 40s each. Speed comes from recognising the pattern, not from calculating faster.", mins: 124 },
      ],
    },
  ];

  for (const block of chatSeed) {
    const channel = await prisma.channel.findFirst({
      where: { hubId: hubBySlug[block.hub], name: block.channel },
      select: { id: true },
    });
    if (!channel) continue;
    const made = [];
    for (const line of block.lines) {
      made.push(await prisma.message.create({
        data: {
          channelId: channel.id, authorId: line.by, content: line.text,
          createdAt: new Date(now - line.mins * 60 * 1000),
        },
        select: { id: true },
      }));
    }
    // Pin the opening message of each hub's #general so the pin UI has data.
    if (block.channel === "general" && made[0]) {
      await prisma.channel.update({ where: { id: channel.id }, data: { pinnedMessageId: made[0].id } });
    }
    // A couple of reactions so the reaction UI isn't empty either.
    if (made[1]) {
      await prisma.messageReaction.createMany({
        data: [
          { messageId: made[1].id, userId: demo, emoji: "🔥" },
          { messageId: made[1].id, userId: arjun, emoji: "🔥" },
        ],
        skipDuplicates: true,
      });
    }
  }

  // --- Follows ---------------------------------------------------------------
  // The home feed shows posts from people you follow or hubs you've joined, so
  // without follows the landing page is empty on a fresh demo.
  await prisma.follow.createMany({
    data: [
      { followerId: demo, followingId: arjun },
      { followerId: demo, followingId: sara },
      { followerId: arjun, followingId: demo },
      { followerId: sara, followingId: demo },
      { followerId: arjun, followingId: sara },
    ],
  });

  // --- Community posts -------------------------------------------------------
  // Populates the home feed, /latest "Trending", each hub's Feed tab, and the
  // profile Posts tab — all of which were empty on a fresh demo.
  const minsAgo = (m: number) => new Date(now - m * 60 * 1000);
  const postSeed: { authorId: string; content: string; hub?: string; createdAt: Date }[] = [
    { authorId: arjun, hub: "consulting", createdAt: minsAgo(25),
      content: "Cracked a market-sizing case today by segmenting demand before supply instead of the other way round. Way cleaner math, and the interviewer actually followed the logic. Anyone else default to supply-side first?" },
    { authorId: sara, hub: "finance", createdAt: minsAgo(70),
      content: "Reminder that a DCF is only as good as your terminal value assumption. Ran the same model at 2% vs 3% perpetual growth and the implied share price moved 22%. Always show the sensitivity table." },
    { authorId: demo, hub: "consulting", createdAt: minsAgo(120),
      content: "Went 3 for 3 on guesstimates this week. The trick that finally clicked: state your assumptions out loud *before* touching numbers, then the arithmetic is the easy part." },
    { authorId: sara, hub: "product", createdAt: minsAgo(190),
      content: "Product sense tip from a PM screen I just did: they don't want your feature list, they want to know which metric you'd move and what you'd sacrifice to move it. Pick a tradeoff and defend it." },
    { authorId: arjun, hub: "data", createdAt: minsAgo(260),
      content: "Window functions show up in almost every analyst screen now. If you can write a running total and a rank-per-group without looking it up, you're ahead of most candidates." },
    { authorId: demo, hub: "aptitude", createdAt: minsAgo(330),
      content: "Timed 30 DI questions this morning. Accuracy is fine, speed isn't — averaging 70s per question and the target is 45s. Going to drill percentage tables next week." },
    { authorId: arjun, createdAt: minsAgo(400),
      content: "Hit 1400 on the Guesstimates track. The rating actually moving with each submission makes practice feel like it counts for something." },
  ];

  const createdPosts = [];
  for (const p of postSeed) {
    const post = await prisma.post.create({
      data: {
        authorId: p.authorId,
        content: p.content,
        hubId: p.hub ? hubBySlug[p.hub] ?? null : null,
        createdAt: p.createdAt,
      },
      select: { id: true, authorId: true },
    });
    createdPosts.push(post);
  }

  // A little engagement so counts aren't all zero (and trending has signal).
  const [p1, p2, p3, p4, p5, p6] = createdPosts;
  await prisma.like.createMany({
    data: [
      { postId: p1.id, userId: demo }, { postId: p1.id, userId: sara },
      { postId: p2.id, userId: demo }, { postId: p2.id, userId: arjun },
      { postId: p3.id, userId: arjun }, { postId: p3.id, userId: sara },
      { postId: p4.id, userId: demo }, { postId: p5.id, userId: sara },
      { postId: p6.id, userId: arjun },
    ],
  });
  await prisma.comment.createMany({
    data: [
      { postId: p1.id, userId: demo, content: "Segmenting demand first saved me on a retail case too. Stealing this." },
      { postId: p2.id, userId: demo, content: "The sensitivity table point is underrated — nobody asks for it until it's missing." },
      { postId: p4.id, userId: arjun, content: "This is exactly what I got dinged on last round. Pick a metric, commit to it." },
      { postId: p3.id, userId: sara, content: "Assumptions-first is the whole game. Congrats on the streak!" },
      { postId: p6.id, userId: arjun, content: "45s is aggressive but doable — ratio tables are what got me there." },
    ],
  });
  await prisma.repost.createMany({
    data: [{ postId: p2.id, userId: demo }, { postId: p3.id, userId: arjun }],
  });
  // Notifications the *demo* user will actually see, so their inbox shows the
  // full range of types rather than just the seeded follow.
  await prisma.notification.createMany({
    data: [
      { type: "like", userId: arjun, fromUserId: demo, postId: p1.id },
      { type: "comment", userId: sara, fromUserId: demo, postId: p2.id },
      { type: "like", userId: demo, fromUserId: arjun, postId: p3.id },
      { type: "like", userId: demo, fromUserId: sara, postId: p3.id },
      { type: "comment", userId: demo, fromUserId: sara, postId: p3.id },
      { type: "repost", userId: demo, fromUserId: arjun, postId: p3.id },
      { type: "comment", userId: demo, fromUserId: arjun, postId: p6.id },
    ],
  });

  // --- Portfolio projects ----------------------------------------------------
  // The profile Portfolio tab was empty on the seeded demo; give the demo user
  // a couple of case-style artifacts so it demonstrates the feature.
  await prisma.portfolioProject.createMany({
    data: [
      {
        userId: demo,
        title: "Coffee-chain turnaround — case deck",
        description: "Full structuring of a 15% same-store-sales decline: traffic-vs-ticket split, root-cause tree, and two prioritised recommendations. Scored 81/100 in peer review.",
        tags: ["Consulting", "Profitability", "Structuring"],
        link: "https://example.com/demo/coffee-case",
      },
      {
        userId: demo,
        title: "Market-sizing playbook",
        description: "A reusable demand-first framework for order-of-magnitude estimates, with worked examples (EV charging stations, coffee cups/day) and the assumption checklist I run before touching numbers.",
        tags: ["Guesstimates", "Market Sizing"],
        link: null,
      },
    ],
  });

  // Experience, so the profile About tab's experience section demos populated.
  await prisma.experience.createMany({
    data: [
      {
        userId: demo, role: "Strategy Consulting Intern", company: "Meridian Advisory",
        startDate: "2025-05", endDate: "2025-07", current: false,
        description: "Supported a market-entry study for a D2C brand: sized the addressable market, built the competitive map, and drafted the go/no-go recommendation.",
      },
      {
        userId: demo, role: "Case Club Lead", company: "University Consulting Society",
        startDate: "2024-08", endDate: null, current: true,
        description: "Run weekly case-practice sessions and mock interviews for 40+ members preparing for consulting and product roles.",
      },
    ],
  });

  // --- Ecosystem directories (Jobs, Mentors) ---------------------------------
  await seedEcosystem();

  console.log("\n✅ Caliber demo seed complete.\n");
  console.log("   Log in at /login with any of these (all password: " + DEMO_PASSWORD + "):");
  console.log("     • demo@caliber.dev   (demo)");
  console.log("     • arjun@caliber.dev  (arjun)");
  console.log("     • sara@caliber.dev   (sara)\n");
  console.log("   Try: /caliber (practice) · /caliber/competitions/weekly-guesstimate-league · /caliber/reviews · /caliber/me\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
