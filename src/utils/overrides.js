import { benefitStatusText, formatDateTime } from "@/utils/format";

export const ENTITY_LABELS = {
  MOVIE: "電影",
  CINEMA: "影城",
  SHOWTIME: "場次",
  LINK: "特典",
};

export const LOCKABLE_FIELDS = {
  MOVIE: ["movie_name", "image_url", "is_active"],
  CINEMA: ["cinema_name", "address", "latitude", "longitude", "is_active"],
  SHOWTIME: ["movie_id", "cinema_id", "showtime"],
  LINK: ["is_showing", "benefit_id", "benefit_status"],
};

export const FIELD_LABELS = {
  movie_name: "電影名稱",
  image_url: "圖片網址",
  is_active: "顯示狀態",
  cinema_name: "影城名稱",
  address: "地址",
  latitude: "緯度",
  longitude: "經度",
  movie_id: "電影",
  cinema_id: "影城",
  showtime: "場次時間",
  is_showing: "上映狀態",
  benefit_id: "特典",
  benefit_status: "特典庫存",
};

export function normalizeFieldValue(field, value) {
  if (value === undefined) return null;
  if (field === "benefit_id") {
    if (value === "" || value == null) return null;
    return Number(value);
  }
  if (field === "movie_id" || field === "cinema_id") {
    if (value === "" || value == null) return null;
    return Number(value);
  }
  if (field === "is_active" || field === "is_showing") return Boolean(value);
  if (field === "latitude" || field === "longitude") return Number(value);
  if (field === "benefit_status") return value || "UNKNOWN";
  if (typeof value === "string") return value.trim();
  return value;
}

export function sameFieldValue(field, left, right) {
  return Object.is(
    normalizeFieldValue(field, left),
    normalizeFieldValue(field, right),
  );
}

export function formatFieldValue(field, value, lookup = {}) {
  const normalized = normalizeFieldValue(field, value);
  if (normalized == null || normalized === "") return "空白";
  if (field === "is_active") return normalized ? "顯示" : "隱藏";
  if (field === "is_showing") return normalized ? "上映中" : "未上映";
  if (field === "benefit_status") return benefitStatusText(normalized);
  if (field === "benefit_id") {
    return lookup.benefitName?.(normalized) || `特典 #${normalized}`;
  }
  if (field === "movie_id") {
    return lookup.movieName?.(normalized) || `電影 #${normalized}`;
  }
  if (field === "cinema_id") {
    return lookup.cinemaName?.(normalized) || `影城 #${normalized}`;
  }
  if (field === "showtime") return formatDateTime(normalized);
  if (field === "latitude" || field === "longitude") return String(normalized);
  return String(normalized);
}
