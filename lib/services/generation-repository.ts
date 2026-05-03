import { generationSchema, type Generation } from "@/lib/schema/generation";
import { writeGenerationFile } from "@/lib/obsidian/generation-files";

export async function saveGeneration(vaultDir: string, generation: Generation) {
  const parsedGeneration = generationSchema.parse(generation);

  await writeGenerationFile(vaultDir, parsedGeneration);

  return parsedGeneration;
}
