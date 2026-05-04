import { NextResponse } from "next/server";
import { z } from "zod";

import { getAiProvider } from "@/lib/providers";
import { extractTemplateFromPrompt } from "@/lib/services/template-extraction";

const bodySchema = z.object({
  prompt: z.string().min(1)
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());
  const provider = getAiProvider();
  const draft = await extractTemplateFromPrompt(provider, body.prompt);

  return NextResponse.json(draft);
}
