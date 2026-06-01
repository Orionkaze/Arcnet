import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function detectPlatformServer(url: string): string {
  const lowerUrl = url.toLowerCase().trim();
  
  if (lowerUrl.includes("mail.google.com") || lowerUrl.includes("gmail.com") || lowerUrl.includes("@gmail.com")) return "Gmail";
  if (lowerUrl.includes("snapchat.com") || lowerUrl.includes("snap.com")) return "Snapchat";
  if (lowerUrl.includes("instagram.com")) return "Instagram";
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) return "Facebook";
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return "Twitter/X";
  if (lowerUrl.includes("tiktok.com")) return "TikTok";
  if (lowerUrl.includes("threads.net")) return "Threads";
  if (lowerUrl.includes("pinterest.com")) return "Pinterest";
  
  // Reddit GameDev must be checked before plain Reddit
  if (lowerUrl.includes("reddit.com/r/gamedev")) return "Reddit GameDev";
  if (lowerUrl.includes("reddit.com")) return "Reddit";
  
  if (lowerUrl.includes("tumblr.com")) return "Tumblr";
  if (lowerUrl.includes("mastodon.social") || lowerUrl.includes("mastodon.online")) return "Mastodon";
  if (lowerUrl.includes("bsky.app") || lowerUrl.includes("bluesky.app")) return "Bluesky";
  if (lowerUrl.includes("bere.al")) return "BeReal";
  
  if (lowerUrl.includes("linkedin.com")) return "LinkedIn";
  if (lowerUrl.includes("polywork.com")) return "Polywork";
  if (lowerUrl.includes("wellfound.com") || lowerUrl.includes("angel.co")) return "Wellfound/AngelList";
  
  if (lowerUrl.includes("github.com")) return "GitHub";
  if (lowerUrl.includes("gitlab.com")) return "GitLab";
  if (lowerUrl.includes("bitbucket.org")) return "Bitbucket";
  if (lowerUrl.includes("codepen.io")) return "CodePen";
  if (lowerUrl.includes("leetcode.com")) return "LeetCode";
  if (lowerUrl.includes("hackerrank.com")) return "HackerRank";
  if (lowerUrl.includes("codeforces.com")) return "Codeforces";
  if (lowerUrl.includes("codechef.com")) return "CodeChef";
  if (lowerUrl.includes("atcoder.jp")) return "AtCoder";
  if (lowerUrl.includes("stackoverflow.com")) return "Stack Overflow";
  if (lowerUrl.includes("dev.to")) return "Dev.to";
  if (lowerUrl.includes("hashnode.com")) return "Hashnode";
  if (lowerUrl.includes("medium.com")) return "Medium";
  if (lowerUrl.includes("substack.com")) return "Substack";
  
  if (lowerUrl.includes("behance.net") || lowerUrl.includes("behance.com")) return "Behance";
  if (lowerUrl.includes("dribbble.com")) return "Dribbble";
  if (lowerUrl.includes("artstation.com")) return "ArtStation";
  if (lowerUrl.includes("figma.com")) return "Figma";
  if (lowerUrl.includes("notion.so")) return "Notion";
  if (lowerUrl.includes("adobe.com")) return "Adobe Portfolio";
  
  if (lowerUrl.includes("steamcommunity.com") || lowerUrl.includes("store.steampowered.com")) return "Steam";
  if (lowerUrl.includes("epicgames.com")) return "Epic Games";
  
  // Itch.io Game Jams must be checked before plain Itch.io
  if (lowerUrl.includes("itch.io/jams")) return "Itch.io Game Jams";
  if (lowerUrl.includes("itch.io")) return "Itch.io";
  
  if (lowerUrl.includes("xbox.com")) return "Xbox";
  if (lowerUrl.includes("psnprofiles.com")) return "PlayStation Network";
  if (lowerUrl.includes("battle.net")) return "Battle.net";
  
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "YouTube";
  if (lowerUrl.includes("twitch.tv")) return "Twitch";
  if (lowerUrl.includes("vimeo.com")) return "Vimeo";
  if (lowerUrl.includes("spotify.com")) return "Spotify";
  if (lowerUrl.includes("soundcloud.com")) return "SoundCloud";
  if (lowerUrl.includes("music.apple.com")) return "Apple Music";
  
  if (lowerUrl.includes("discord.gg") || lowerUrl.includes("discord.com")) return "Discord";
  if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.org")) return "Telegram";
  if (lowerUrl.includes("wa.me") || lowerUrl.includes("whatsapp.com")) return "WhatsApp";
  
  if (lowerUrl.includes("patreon.com")) return "Patreon";
  if (lowerUrl.includes("ko-fi.com")) return "Ko-fi";
  if (lowerUrl.includes("buymeacoffee.com")) return "Buy Me a Coffee";
  if (lowerUrl.includes("gumroad.com")) return "Gumroad";
  
  if (lowerUrl.includes("producthunt.com")) return "Product Hunt";
  if (lowerUrl.includes("linktr.ee")) return "Linktree";

  // NEW PLATFORMS

  // Game Engines & Development
  // Unreal Marketplace must be checked before plain Unreal Engine
  if (lowerUrl.includes("unrealengine.com/marketplace")) return "Unreal Marketplace";
  if (lowerUrl.includes("forums.unrealengine.com") || lowerUrl.includes("unrealengine.com")) return "Unreal Engine / Epic Games Forums";
  // Unity Asset Store must be checked before plain Unity
  if (lowerUrl.includes("assetstore.unity.com")) return "Unity Asset Store";
  if (lowerUrl.includes("discussions.unity.com") || lowerUrl.includes("unity.com")) return "Unity";
  if (lowerUrl.includes("godotengine.org")) return "Godot";
  if (lowerUrl.includes("gamemaker.io")) return "GameMaker";
  if (lowerUrl.includes("roblox.com")) return "Roblox";
  if (lowerUrl.includes("cryengine.com")) return "CryEngine";
  if (lowerUrl.includes("o3de.org")) return "Amazon Lumberyard / O3DE";
  if (lowerUrl.includes("defold.com")) return "Defold";
  if (lowerUrl.includes("construct.net")) return "Construct";
  if (lowerUrl.includes("rpgmakerweb.com")) return "RPG Maker";
  if (lowerUrl.includes("gdevelop.io")) return "GDevelop";
  if (lowerUrl.includes("cocos.com")) return "Cocos";

  // 3D / Art / Animation Tools & Communities
  if (lowerUrl.includes("blenderartists.org")) return "Blender Artists";
  if (lowerUrl.includes("blendermarket.com")) return "Blender Market";
  if (lowerUrl.includes("sketchfab.com")) return "Sketchfab";
  if (lowerUrl.includes("cgsociety.org")) return "CGSociety";
  if (lowerUrl.includes("cgtrader.com")) return "CGTrader";
  if (lowerUrl.includes("turbosquid.com")) return "TurboSquid";
  if (lowerUrl.includes("mixamo.com")) return "Mixamo";
  if (lowerUrl.includes("substance3d.adobe.com")) return "Adobe Substance";
  if (lowerUrl.includes("zbrushcentral.com")) return "ZBrushCentral";
  if (lowerUrl.includes("polycount.com")) return "Polycount";
  if (lowerUrl.includes("quixel.com")) return "Quixel";
  if (lowerUrl.includes("flippednormals.com")) return "FlippedNormals";
  if (lowerUrl.includes("pureref.com")) return "PureRef";

  // Game Asset Marketplaces
  if (lowerUrl.includes("gamedevmarket.net")) return "GameDev Market";
  if (lowerUrl.includes("opengameart.org")) return "OpenGameArt";
  if (lowerUrl.includes("kenney.nl")) return "Kenney";
  if (lowerUrl.includes("craftpix.net")) return "CraftPix";

  // Game Dev Communities & Forums
  if (lowerUrl.includes("gamejolt.com")) return "Game Jolt";
  if (lowerUrl.includes("indiedb.com")) return "IndieDB";
  if (lowerUrl.includes("moddb.com")) return "ModDB";
  if (lowerUrl.includes("tigsource.com")) return "TIGSource";
  if (lowerUrl.includes("gamedev.net")) return "GameDev.net";
  if (lowerUrl.includes("newgrounds.com")) return "Newgrounds";
  if (lowerUrl.includes("kongregate.com")) return "Kongregate";
  if (lowerUrl.includes("gamebanana.com")) return "Game Banana";
  if (lowerUrl.includes("nexusmods.com")) return "Nexus Mods";

  // Game Jams & Competitions
  if (lowerUrl.includes("ldjam.com")) return "Ludum Dare";
  if (lowerUrl.includes("globalgamejam.org")) return "Global Game Jam";

  // Programming & Scripting (game dev specific)
  if (lowerUrl.includes("shadertoy.com")) return "Shadertoy";
  if (lowerUrl.includes("rosettacode.org")) return "Rosetta Code";

  // Pixel Art & 2D Tools
  if (lowerUrl.includes("lospec.com")) return "Lospec";
  if (lowerUrl.includes("pixilart.com")) return "Pixilart";
  if (lowerUrl.includes("community.aseprite.org")) return "Aseprite community";

  // Music & Sound for Games
  if (lowerUrl.includes("freesound.org")) return "Freesound";
  if (lowerUrl.includes("fmod.com")) return "FMOD";
  if (lowerUrl.includes("audiokinetic.com")) return "Wwise";
  if (lowerUrl.includes("bandcamp.com")) return "Bandcamp";

  // Video / Streaming for Game Devs
  if (lowerUrl.includes("kick.com")) return "Kick";
  if (lowerUrl.includes("rumble.com")) return "Rumble";

  try {
    let domain = lowerUrl;
    if (domain.includes("://")) {
      domain = domain.split("://")[1];
    }
    domain = domain.split("/")[0];
    domain = domain.replace("www.", "");
    const name = domain.split(".")[0];
    return name || "generic";
  } catch {
    return "generic";
  }
}


export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, username, avatar, cover, bio, role, location, skills } = body;

    // Direct validation checks
    if (!firstName || !lastName || !username) {
      return NextResponse.json({ error: "First name, last name, and username are required" }, { status: 400 });
    }

    // Clean username format rules (matches setup-username rules)
    const cleanUsername = username.trim().replace(/^@/, "");
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 });
    }
    if (/\s/.test(cleanUsername)) {
      return NextResponse.json({ error: "Username cannot contain spaces" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      return NextResponse.json({ error: "Username can only contain alphanumeric characters, underscores, and dots" }, { status: 400 });
    }

    // Find current user database record
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { username: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If username is changing, check uniqueness
    if (cleanUsername.toLowerCase() !== (currentUser.username || "").toLowerCase()) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: cleanUsername,
            mode: "insensitive",
          },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    // Social Links Validation and Sanitization
    const sanitizedLinks: { platform: string; url: string }[] = [];
    if (body.socialLinks !== undefined) {
      if (!Array.isArray(body.socialLinks)) {
        return NextResponse.json({ error: "Social links must be an array" }, { status: 400 });
      }
      if (body.socialLinks.length > 8) {
        return NextResponse.json({ error: "Maximum 8 social links allowed" }, { status: 400 });
      }

      const seenUrls = new Set<string>();

      for (const item of body.socialLinks) {
        if (!item || typeof item !== "object" || !item.url) continue;
        
        // Strip any whitespace from URLs before saving
        const cleanUrl = String(item.url).replace(/\s+/g, "");
        
        if (cleanUrl.length > 500) {
          return NextResponse.json({ error: "Each URL must be under 500 characters" }, { status: 400 });
        }
        
        if (!cleanUrl.startsWith("https://")) {
          return NextResponse.json({ error: "Please enter a valid URL starting with https://" }, { status: 400 });
        }

        if (seenUrls.has(cleanUrl)) {
          return NextResponse.json({ error: "This link is already added" }, { status: 400 });
        }
        seenUrls.add(cleanUrl);

        // Server-side platform detection
        const platform = detectPlatformServer(cleanUrl);
        sanitizedLinks.push({ platform, url: cleanUrl });
      }
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: session.userId as string },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: cleanUsername,
        avatar: avatar || null,
        cover: cover !== undefined ? cover : undefined,
        bio: bio ? bio.trim() : null,
        role: role ? role.trim() : null,
        location: location ? location.trim() : null,
        skills: skills ? skills.trim() : null,
        socialLinks: body.socialLinks !== undefined ? sanitizedLinks : undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        avatar: true,
        cover: true,
        isVerified: true,
        isOnboarded: true,
        bio: true,
        role: true,
        location: true,
        skills: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
