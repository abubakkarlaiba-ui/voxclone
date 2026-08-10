const LANGUAGE_FLAGS: Record<string, string> = {
  en: "\ud83c\uddec\ud83c\udde7",
  es: "\ud83c\uddea\ud83c\uddf8",
  fr: "\ud83c\uddeb\ud83c\uddf7",
  de: "\ud83c\udde9\ud83c\uddea",
  it: "\ud83c\uddee\ud83c\uddf9",
  pt: "\ud83c\udde7\ud83c\uddf7",
  ja: "\ud83c\uddef\ud83c\uddf5",
  ko: "\ud83c\uddf0\ud83c\uddf7",
  zh: "\ud83c\udde8\ud83c\uddf3",
  hi: "\ud83c\uddee\ud83c\uddf3",
  ar: "\ud83c\uddf8\ud83c\udde6",
  ru: "\ud83c\uddf7\ud83c\uddfa",
  nl: "\ud83c\uddf3\ud83c\uddf1",
  pl: "\ud83c\uddf5\ud83c\uddf1",
  tr: "\ud83c\uddf9\ud83c\uddf7",
  vi: "\ud83c\uddfb\ud83c\uddf3",
  th: "\ud83c\uddf9\ud83c\udded",
  sv: "\ud83c\uddf8\ud83c\uddea",
  no: "\ud83c\uddf3\ud83c\uddf4",
  da: "\ud83c\udde9\ud83c\uddf0",
  fi: "\ud83c\uddeb\ud83c\uddee",
  uk: "\ud83c\uddfa\ud83c\udde6",
  cs: "\ud83c\udde8\ud83c\uddff",
  el: "\ud83c\uddec\ud83c\uddf7",
  he: "\ud83c\uddee\ud83c\uddf1",
  ro: "\ud83c\uddf7\ud83c\uddf4",
  hu: "\ud83c\udded\ud83c\uddfa",
  id: "\ud83c\uddee\ud83c\udde9",
  ms: "\ud83c\uddf2\ud83c\uddfe",
  fil: "\ud83c\uddf5\ud83c\udded",
};

export function getLanguageFlag(langCode?: string): string {
  if (!langCode) return LANGUAGE_FLAGS.en;
  return LANGUAGE_FLAGS[langCode.toLowerCase()] || LANGUAGE_FLAGS.en;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
