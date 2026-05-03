import { NextResponse } from "next/server";

import { generationSchema } from "@/lib/schema/generation";
import {
  listGenerations,
  saveGeneration
} from "@/lib/services/generation-repository";
import { getVaultDir } from "@/lib/utils/env";

export async function GET() {
  const generations = await listGenerations(getVaultDir());

  return NextResponse.json(generations);
}

export async function POST(request: Request) {
  const generation = generationSchema.parse(await request.json());
  const savedGeneration = await saveGeneration(getVaultDir(), generation);

  return NextResponse.json(savedGeneration, { status: 201 });
}
