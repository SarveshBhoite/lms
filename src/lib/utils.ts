/**
 * Utility functions for JVM LMS
 */

/**
 * Format a date string or Date object into human-friendly "Date Month Year" format.
 * Example: "14 Oct 2026" or "14 October 2026" (default short month)
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: { month?: "short" | "long" | "numeric"; includeTime?: boolean }
): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";

    const day = d.getDate().toString().padStart(2, "0");
    const monthStyle = options?.month || "short";
    const month = d.toLocaleDateString("en-US", { month: monthStyle });
    const year = d.getFullYear();

    let result = `${day} ${month} ${year}`;
    if (options?.includeTime) {
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      result += ` at ${hours}:${minutes}`;
    }
    return result;
  } catch {
    return "-";
  }
}
