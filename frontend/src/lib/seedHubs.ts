import { prisma } from "@/lib/prisma";

export async function seedHubs() {
  const hubsData = [
    {
      slug: "consulting",
      name: "Consulting & Cases",
      description: "Community feed and chatroom for case cracking, frameworks, and guesstimates.",
      icon: "💼",
      channels: ["general", "case-cracking", "frameworks", "guesstimates", "showcase", "resources", "opportunities"],
    },
    {
      slug: "finance",
      name: "Finance & IB",
      description: "Hub for valuation, financial modeling, and markets prep.",
      icon: "📈",
      channels: ["general", "valuation", "modeling", "markets", "showcase", "resources", "opportunities"],
    },
    {
      slug: "product",
      name: "Product & PM",
      description: "Space for product sense, metrics, and strategy discussion.",
      icon: "📦",
      channels: ["general", "product-sense", "metrics", "strategy", "showcase", "resources", "opportunities"],
    },
    {
      slug: "data",
      name: "Data & Analytics",
      description: "Collaborate on SQL, statistics, and dashboard building.",
      icon: "📊",
      channels: ["general", "sql", "stats", "dashboards", "showcase", "resources", "opportunities"],
    },
    {
      slug: "aptitude",
      name: "Aptitude & Placements",
      description: "Quant, data interpretation, and interview prep for placements.",
      icon: "🎓",
      channels: ["general", "quant", "data-interpretation", "interview-prep", "showcase", "resources", "opportunities"],
    },
  ];

  const results = [];

  for (const hub of hubsData) {
    // Upsert Hub
    const dbHub = await prisma.hub.upsert({
      where: { slug: hub.slug },
      update: {
        name: hub.name,
        description: hub.description,
        icon: hub.icon,
      },
      create: {
        slug: hub.slug,
        name: hub.name,
        description: hub.description,
        icon: hub.icon,
      },
    });

    // Create channels for this hub
    for (const channelName of hub.channels) {
      // Check if channel already exists
      const existingChannel = await prisma.channel.findFirst({
        where: {
          hubId: dbHub.id,
          name: channelName,
        },
      });

      if (!existingChannel) {
        await prisma.channel.create({
          data: {
            hubId: dbHub.id,
            name: channelName,
          },
        });
      }
    }

    results.push(dbHub);
  }

  return results;
}
