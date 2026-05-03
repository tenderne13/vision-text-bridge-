export function renderTemplateText(
  templateText: string,
  slotValues: Record<string, string>
) {
  const orderedValues = Object.values(slotValues);
  let fallbackIndex = 0;

  return templateText.replace(/\{([^}]+)\}/g, (match, rawKey: string) => {
    const normalizedKey = rawKey.trim();

    if (normalizedKey in slotValues) {
      return slotValues[normalizedKey];
    }

    const fallbackValue = orderedValues[fallbackIndex];

    if (fallbackValue !== undefined) {
      fallbackIndex += 1;
      return fallbackValue;
    }

    return match;
  });
}
