/**
 * Shared utilities
 */

export function clamp(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function unique(arr) {
  return [...new Set(arr)];
}

export function safeJoin(parts, sep = ' ') {
  return parts.filter(Boolean).join(sep).replace(/\s+/g, ' ').trim();
}
