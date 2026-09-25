export function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function cityFromAddress(address) {
  const match = String(address || "").match(/^.+?[縣市]/);
  return match ? match[0] : "";
}

export function showtimeFinished(value) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

export function showtimeStatusText(value) {
  return showtimeFinished(value) ? "已放完" : "未放映";
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-TW", { hour12: false });
}

export function toDateTimeLocal(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}T${hour}:${minute}`;
}

export function fromDateTimeLocal(value) {
  return value.length === 16 ? `${value}:00` : value;
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} 公尺`;
  return `${km.toFixed(1)} 公里`;
}

const BENEFIT_STATUS = {
  UNKNOWN: "未知",
  IN_STOCK: "有庫存",
  EXHAUSTED: "已換完",
};

export function benefitStatusText(status) {
  return BENEFIT_STATUS[status] || status || "未知";
}

export function crawlerTypeText(type) {
  return (
    {
      MOVIE: "電影",
      CINEMA: "影城",
      SHOWTIME: "場次",
    }[type] || type
  );
}

export function crawlerStatusText(status) {
  return { SUCCESS: "成功", FAILURE: "失敗" }[status] || status;
}
