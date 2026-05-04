import { NextResponse } from "next/server";

import { templateSchema } from "@/lib/schema/template";
import { listTemplates, saveTemplate } from "@/lib/services/template-repository";
import { getVaultDir } from "@/lib/utils/env";

export async function GET() {
  const templates = await listTemplates(getVaultDir());

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const template = templateSchema.parse(await request.json());
  const savedTemplate = await saveTemplate(getVaultDir(), template);

  return NextResponse.json(savedTemplate, { status: 201 });
}
