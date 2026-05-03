export function renderTemplateText(
  templateText: string,
  slotValues: Record<string, string>
) {
  return templateText.replace(/\{([^}]+)\}/g, (match, rawKey: string) => {
    const normalizedKey = rawKey.trim();

    if (Object.prototype.hasOwnProperty.call(slotValues, normalizedKey)) {
      return slotValues[normalizedKey];
    }

    return match;
  });
}
