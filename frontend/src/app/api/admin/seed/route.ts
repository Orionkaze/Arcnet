import { NextResponse } from "next/server";
import { seedHubs } from "@/lib/seedHubs";

export async function POST() {
  try {
    const results = await seedHubs();
    return NextResponse.json({ message: "Hubs seeded successfully", count: results.length, hubs: results }, { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error("Seed Hubs Error:", err);
    return NextResponse.json({ error: "Failed to seed hubs", details: err.message || String(err) }, { status: 500 });
  }
}
