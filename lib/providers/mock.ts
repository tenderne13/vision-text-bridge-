import type {
  AiProvider,
  GenerateImageInput,
  ImageTemplateInput,
  TemplateDraft
} from "@/lib/providers/types";

const MOCK_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn4iKsAAAAASUVORK5CYII=";

function deriveTitle(prompt: string) {
  if (prompt.includes("海报")) {
    return "商业海报模板";
  }

  if (prompt.includes("封面")) {
    return "封面视觉模板";
  }

  return "提示词模板";
}

export class MockAiProvider implements AiProvider {
  async analyzeImageToTemplate(_input: ImageTemplateInput): Promise<TemplateDraft> {
    return {
      title: "图片抽取模板",
      templateText: "一张{subject}的产品图，风格为{style}，背景为{background}",
      slots: [
        { key: "subject", label: "主体", description: "画面主体", required: true },
        { key: "style", label: "风格", description: "视觉风格", required: true },
        { key: "background", label: "背景", description: "背景元素", required: false }
      ],
      styleTags: ["产品摄影", "样机提取"],
      negativePrompt: "模糊, 低质量"
    };
  }

  async extractPromptToTemplate(input: { prompt: string }): Promise<TemplateDraft> {
    return {
      title: deriveTitle(input.prompt),
      templateText: "一张{subject}商业海报，风格为{style}，背景为{background}，柔和棚拍光线",
      slots: [
        { key: "subject", label: "主体", description: "要替换的主体", required: true },
        { key: "style", label: "风格", description: "画面风格", required: true, defaultValue: "北欧极简" },
        { key: "background", label: "背景", description: "画面背景", required: false, defaultValue: "米色背景" }
      ],
      styleTags: ["商业海报", "极简"],
      negativePrompt: "模糊, 畸形, 低质量"
    };
  }

  async generateImageFromTemplate(_input: GenerateImageInput) {
    return {
      images: [
        {
          fileName: "mock-generated.png",
          base64: MOCK_IMAGE_BASE64,
          mimeType: "image/png"
        }
      ]
    };
  }
}
