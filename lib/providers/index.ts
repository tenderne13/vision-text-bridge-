import { OpenAiProvider } from "@/lib/providers/openai";

export function getAiProvider() {
  return new OpenAiProvider();
}
