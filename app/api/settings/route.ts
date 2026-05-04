import { NextResponse } from "next/server";

import { settingsSchema } from "@/lib/schema/settings";
import { loadSettings, saveSettings } from "@/lib/services/settings-service";
import { getVaultDir } from "@/lib/utils/env";

export async function GET() {
  const settings = await loadSettings(getVaultDir());

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const settings = settingsSchema.parse(await request.json());
  const savedSettings = await saveSettings(getVaultDir(), settings);

  return NextResponse.json(savedSettings, { status: 201 });
}
