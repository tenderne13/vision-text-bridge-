import { describe, expect, it } from "vitest";
import { renderTemplateText } from "@/lib/utils/template-text";

describe("renderTemplateText", () => {
  it("replaces placeholders with slot values", () => {
    const result = renderTemplateText("一张{subject}的海报，风格为{style}", {
      subject: "咖啡杯",
      style: "北欧极简"
    });

    expect(result).toBe("一张咖啡杯的海报，风格为北欧极简");
  });

  it("leaves placeholders unchanged when no matching key exists", () => {
    const result = renderTemplateText("一张{subject}的海报，风格为{style}", {
      subject: "咖啡杯"
    });

    expect(result).toBe("一张咖啡杯的海报，风格为{style}");
  });
});
