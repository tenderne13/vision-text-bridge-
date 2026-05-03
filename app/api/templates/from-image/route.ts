import { NextResponse } from "next/server";
import { z } from "zod";

import { getAiProvider } from "@/lib/providers";
import { extractTemplateFromImage } from "@/lib/services/template-extraction";

const bodySchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1)
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());
  const provider = getAiProvider();
  const draft = await extractTemplateFromImage(provider, body);

  return NextResponse.json(draft);
}
