import OpenAI from "openai";

import {
  generatedImageSchema,
  providerTemplateDraftSchema,
  type AiProvider,
  type GenerateImageInput,
  type ImageTemplateInput,
  type ProviderTemplateDraft
} from "@/lib/providers/types";

type OpenAiClient = Pick<OpenAI, "responses" | "images">;

const DEFAULT_TEMPLATE_MODEL = "gpt-4.1-mini";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";

const templateDraftInstructions = [
  "你是一个提示词模板提取器。",
  "从输入内容中提取可复用的图像生成模板。",
  "只返回 JSON，不要输出 Markdown 代码块或额外解释。",
  'JSON 结构必须为: {"title":string,"templateText":string,"slots":[{"key":string,"label":string,"description":string,"required":boolean}],"styleTags":string[],"negativePrompt":string}.'
].join("\n");

function createOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to initialize the OpenAI provider");
  }

  return new OpenAI({ apiKey });
}

function parseTemplateDraft(outputText: string): ProviderTemplateDraft {
  return providerTemplateDraftSchema.parse(JSON.parse(outputText));
}

export class OpenAiProvider implements AiProvider {
  constructor(
    private readonly client: OpenAiClient = createOpenAiClient(),
    private readonly templateModel = process.env.OPENAI_TEMPLATE_MODEL ?? DEFAULT_TEMPLATE_MODEL,
    private readonly imageModel = process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL
  ) {}

  async analyzeImageToTemplate(input: ImageTemplateInput) {
    const response = await this.client.responses.create({
      model: this.templateModel,
      input: [
        {
          role: "system",
          content: templateDraftInstructions
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "请分析这张图片，并提取一个可复用的中文提示词模板。"
            },
            {
              type: "input_image",
              image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
              detail: "auto"
            }
          ]
        }
      ]
    });

    return parseTemplateDraft(response.output_text);
  }

  async extractPromptToTemplate(input: { prompt: string }) {
    const response = await this.client.responses.create({
      model: this.templateModel,
      input: [
        {
          role: "system",
          content: templateDraftInstructions
        },
        {
          role: "user",
          content: `请将下面的描述词提取成可复用模板，并识别可替换槽位：\n${input.prompt}`
        }
      ]
    });

    return parseTemplateDraft(response.output_text);
  }

  async generateImageFromTemplate(input: GenerateImageInput) {
    const prompt = input.negativePrompt?.trim()
      ? `${input.finalPrompt}\n\nNegative prompt: ${input.negativePrompt}`
      : input.finalPrompt;

    const response = await this.client.images.generate({
      model: this.imageModel,
      prompt,
      size: "1024x1024"
    });

    const images = (response.data ?? [])
      .map((image, index) => {
        if (!image.b64_json) {
          return null;
        }

        return generatedImageSchema.parse({
          fileName: `generated-${index + 1}.png`,
          base64: image.b64_json,
          mimeType: "image/png"
        });
      })
      .filter((image): image is NonNullable<typeof image> => image !== null);

    return { images };
  }
}
