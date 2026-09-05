export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const TIER_STYLES: Record<string, string> = {
  GOLD: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  SILVER: "bg-slate-400/15 text-slate-500 dark:text-slate-300 border-slate-400/30",
  BRONZE: "bg-orange-700/15 text-orange-700 dark:text-orange-400 border-orange-700/30",
  STANDARD: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

export const CATEGORY_STYLES: Record<string, string> = {
  HARDWARE: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  SERVICE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  SUBSCRIPTION: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  SOFTWARE_SUBSCRIPTION: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
};

