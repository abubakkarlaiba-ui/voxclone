export const APP_NAME = "VoxClone";
export const APP_DESCRIPTION = "Professional AI Voice Generator — Clone your voice with AI";

export const MAX_RECORDING_DURATION = 300;
export const MIN_RECORDING_DURATION = 3;
export const MAX_TEXT_LENGTH = 5000;
export const MIN_TEXT_LENGTH = 1;

export const SUPPORTED_AUDIO_FORMATS = ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg"] as const;
export const DEFAULT_AUDIO_FORMAT = "audio/webm";

export const API_ROUTES = {
  VOICES: "/api/voices",
  GENERATE: "/api/generate",
} as const;

export const ROUTES = {
  HOME: "/",
  STUDIO: "/studio",
  TEXT_TO_SPEECH: "/text-to-speech",
  LIBRARY: "/library",
  HISTORY: "/history",
  SETTINGS: "/settings",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;

export const NAV_ITEMS = [
  {
    href: ROUTES.STUDIO,
    label: "Voice Studio",
    icon: "microphone",
    description: "Record and clone your voice",
  },
  {
    href: ROUTES.TEXT_TO_SPEECH,
    label: "Text to Speech",
    icon: "speaker",
    description: "Convert text to natural speech",
  },
  {
    href: ROUTES.LIBRARY,
    label: "Voice Library",
    icon: "library",
    description: "Manage your voice profiles",
  },
  {
    href: ROUTES.HISTORY,
    label: "History",
    icon: "clock",
    description: "View past generations",
  },
  {
    href: ROUTES.SETTINGS,
    label: "Settings",
    icon: "settings",
    description: "Configure your account",
  },
] as const;

export const NOTIFICATION_DURATION = 5000;

export const USER_PLACEHOLDER = {
  name: "Alex Morgan",
  email: "alex@example.com",
  avatar: null,
  plan: "Pro" as const,
  voicesCount: 3,
  generationsCount: 47,
} as const;
