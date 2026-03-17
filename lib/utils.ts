import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  // Minimal className utility without clsx dependency
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
