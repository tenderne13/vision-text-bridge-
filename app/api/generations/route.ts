import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generationSchema } from "@/lib/schema/generation";
import {
  listGenerations,
  saveGeneration
} from "@/lib/services/generation-repository";
import { getVaultDir } from "@/lib/utils/env";
import { handleGenerationRequest } from "@/app/api/generations/utils";

export async function GET() {
  const generations = await listGenerations(getVaultDir());

  return NextResponse.json(generations);
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const generation = generationSchema.parse(body);
    const savedGeneration = await saveGeneration(getVaultDir(), generation);

    return NextResponse.json(savedGeneration, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const generated = await handleGenerationRequest(getVaultDir(), body);
      return NextResponse.json(generated, { status: 201 });
    }

    throw error;
  }
}
