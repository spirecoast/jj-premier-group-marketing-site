/**
 * Straight quotes to curly ones, the way the page headings already write them, for text the
 * site builds rather than types: titles and descriptions in pageMetadata, the structured data
 * that repeats them. No imports, so the unit tests and plain Node can load it.
 *
 *   don't → don’t · 'til → ’til · '90s → ’90s · "Sold" → “Sold” · the Smiths' → the Smiths’
 */
export function curly(text: string): string {
  return (
    text
      // An apostrophe inside or at the end of a word, and a year or word cut short at its start.
      .replace(/(\p{L}|\p{N})'(?=\p{L}|\p{N})/gu, "$1’")
      .replace(/(^|[\s([{“‘—–-])'(?=\d\ds\b|\d\d\b|til\b|cause\b|em\b|n\b)/gu, "$1’")
      // Opening single quote: at the start, or after a space or an opening bracket or dash.
      .replace(/(^|[\s([{“—–-])'(?=\S)/gu, "$1‘")
      .replace(/'/g, "’")
      // Double quotes: opening after the start, a space, a bracket or a dash; closing everywhere else.
      .replace(/(^|[\s([{‘—–-])"(?=\S)/gu, "$1“")
      .replace(/"/g, "”")
  );
}
