import { prisma } from "@/lib/prisma";

export async function seedHubs() {
  const hubsData = [
    {
      slug: "game-developers",
      name: "Game Developers",
      description: "Chatroom and community feed for game developers, programmers, and designers.",
      icon: "🎮",
      channels: ["general", "engine-talk", "bug-help", "game-jams", "showcase", "resources", "opportunities"],
    },
    {
      slug: "2d-3d-artists",
      name: "2D / 3D Artists",
      description: "Hub for digital artists, concept artists, 3D modelers, and texturing specialists.",
      icon: "🎨",
      channels: ["general", "wip", "critique", "references", "tutorials", "showcase", "opportunities"],
    },
    {
      slug: "animators",
      name: "Animators",
      description: "Space for animation feedback, rig sharing, motion capture, and keyframe talk.",
      icon: "🎬",
      channels: ["general", "rigs", "motion", "feedback", "showcase", "resources", "opportunities"],
    },
    {
      slug: "storywriters",
      name: "Storywriters",
      description: "Collaborate on worldbuilding, pitch story concepts, and review narratives.",
      icon: "✍️",
      channels: ["general", "pitches", "worldbuilding", "collab", "showcase", "resources", "opportunities"],
    },
    {
      slug: "game-testers",
      name: "Game Testers",
      description: "Submit bug reports, request playtests, and discuss QA standards.",
      icon: "🐛",
      channels: ["general", "bug-reports", "test-my-game", "qa-talk", "showcase", "resources", "opportunities"],
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
