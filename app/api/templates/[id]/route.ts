import { NextResponse } from "next/server";

import { getTemplateById } from "@/lib/services/template-repository";
import { getVaultDir } from "@/lib/utils/env";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const params = await context.params;
  const template = await getTemplateById(getVaultDir(), params.id);

  if (!template) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}
