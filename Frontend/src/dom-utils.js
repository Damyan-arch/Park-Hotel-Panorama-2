export const API_BASE = "/api";
const MEDIA_BASE = "";

export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${MEDIA_BASE}${pathOrUrl}`;
}

export async function fetchJSON(path, fallback) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`${path} failed`);
    return await res.json();
  } catch (err) {
    console.warn(`API unavailable for ${path}, using fallback data.`, err);
    return fallback;
  }
}

export function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
