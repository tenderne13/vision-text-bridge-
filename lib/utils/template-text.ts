export function renderTemplateText(
  templateText: string,
  slotValues: Record<string, string>
) {
  return templateText.replace(/\{([^}]+)\}/g, (match, rawKey: string) => {
    const normalizedKey = rawKey.trim();

    if (normalizedKey in slotValues) {
      return slotValues[normalizedKey];
    }

    return match;
  });
}
