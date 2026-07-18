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
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "caliber1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // --- Users (idempotent upsert by email) ------------------------------------
  const userSpecs = [
    { email: "demo@caliber.dev", username: "demo", firstName: "Demo", lastName: "User" },
    { email: "arjun@caliber.dev", username: "arjun", firstName: "Arjun", lastName: "Shah" },
    { email: "sara@caliber.dev", username: "sara", firstName: "Sara", lastName: "Iyer" },
  ];
  const users: Record<string, { id: string }> = {};
  for (const u of userSpecs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { isVerified: true, isOnboarded: true, username: u.username, password: passwordHash },
      create: {
        email: u.email,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        password: passwordHash,
        isVerified: true,
        isOnboarded: true,
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
