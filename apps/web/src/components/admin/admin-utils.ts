export { currencyFormatter } from "@/lib/currency";

export const TIER_STYLES: Record<string, string> = {
  GOLD: "bg-highlighter-yellow text-forest-ink border-highlighter-yellow/60",
  SILVER: "bg-whisper-gray text-forest-ink/70 border-pencil-gray/40",
  BRONZE: "bg-terracotta/10 text-terracotta border-terracotta/30",
  STANDARD: "bg-whisper-gray text-forest-ink/60 border-pencil-gray/40",
};

export const CATEGORY_STYLES: Record<string, string> = {
  HARDWARE: "bg-whisper-gray text-forest-ink border-pencil-gray/40",
  SERVICE: "bg-sticky-note-mint text-forest-ink border-sticky-note-mint/60",
  SUBSCRIPTION: "bg-sticky-note-teal text-forest-ink border-sticky-note-teal/60",
  SOFTWARE_SUBSCRIPTION: "bg-sticky-note-blush text-forest-ink border-sticky-note-blush/60",
};

