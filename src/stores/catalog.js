import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { serverBootId } from "virtual:server-boot";
import { crawlerTemplates, seed } from "@/data/mock";
import { cityFromAddress, dateKey, formatDateTime } from "@/utils/format";
import { haversineKm } from "@/utils/geo";
import {
  ENTITY_LABELS,
  FIELD_LABELS,
  LOCKABLE_FIELDS,
  formatFieldValue,
  normalizeFieldValue,
  sameFieldValue,
} from "@/utils/overrides";

const STORAGE_KEY = "moviemap.catalog";
const BOOT_KEY = "moviemap.serverBoot";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function expireShowtimes(showtimes) {
  const now = Date.now();
  return showtimes.map((item) => {
    const active = new Date(item.showtime).getTime() >= now;
    if (item.is_active === active) return item;
    return { ...item, is_active: active, updated_at: nowIso() };
  });
}

function freshState() {
  const initial = clone(seed);
  initial.showtimes = expireShowtimes(initial.showtimes);
  return initial;
}

function loadState() {
  if (sessionStorage.getItem(BOOT_KEY) !== serverBootId) {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(BOOT_KEY, serverBootId);
    return freshState();
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      parsed.showtimes = expireShowtimes(parsed.showtimes || []);
      for (const cinema of parsed.cinemas || []) delete cinema.image_url;
      for (const showtime of parsed.showtimes) delete showtime.hall;
      for (const link of parsed.links || []) delete link.hall;
      for (const review of parsed.reviews || []) {
        if (review.before) delete review.before.hall;
        if (review.after) delete review.after.hall;
      }
      if (!parsed.crawlerLogs?.length)
        parsed.crawlerLogs = clone(seed.crawlerLogs);
      if ((parsed.seedRevision || 1) < (seed.seedRevision || 1)) {
        const ids = new Set(
          (parsed.movies || []).map((movie) => movie.movie_id),
        );
        parsed.movies = parsed.movies || [];
        for (const movie of seed.movies) {
          if (!ids.has(movie.movie_id)) parsed.movies.push(clone(movie));
        }
        const maxId = parsed.movies.reduce(
          (max, movie) => Math.max(max, movie.movie_id),
          0,
        );
        parsed.nextMovieId = Math.max(
          Number(parsed.nextMovieId) || 1,
          maxId + 1,
        );
        parsed.crawlerLogs = clone(seed.crawlerLogs);
        parsed.crawlerOverrides = clone(seed.crawlerOverrides || []);
        parsed.nextOverrideId = seed.nextOverrideId;
        parsed.seedRevision = seed.seedRevision;
      }
      parsed.crawlerLogs = (parsed.crawlerLogs || []).filter((item) =>
        ["MOVIE", "CINEMA", "SHOWTIME"].includes(item.crawler_type),
      );
      if (!parsed.crawlerLogs.length)
        parsed.crawlerLogs = clone(seed.crawlerLogs);
      if (!Array.isArray(parsed.crawlerOverrides)) {
        parsed.crawlerOverrides = clone(seed.crawlerOverrides || []);
      }
      const maxOverrideId = parsed.crawlerOverrides.reduce(
        (max, item) => Math.max(max, item.crawler_override_id || 0),
        0,
      );
      parsed.nextOverrideId = Math.max(
        Number(parsed.nextOverrideId) || 1,
        maxOverrideId + 1,
      );
      return parsed;
    } catch {
      // 使用預設示範資料
    }
  }
  return freshState();
}

export const useCatalogStore = defineStore("catalog", () => {
  const state = ref(loadState());

  function persist() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
  }

  persist();

  const movies = computed(() => state.value.movies);
  const cinemas = computed(() => state.value.cinemas);
  const benefits = computed(() => state.value.benefits);

  function movieById(id) {
    return (
      state.value.movies.find((item) => item.movie_id === Number(id)) || null
    );
  }

  function cinemaById(id) {
    return (
      state.value.cinemas.find((item) => item.cinema_id === Number(id)) || null
    );
  }

  function benefitById(id) {
    return (
      state.value.benefits.find((item) => item.benefit_id === Number(id)) ||
      null
    );
  }

  function showtimeById(id) {
    return (
      state.value.showtimes.find((item) => item.showing_id === Number(id)) ||
      null
    );
  }

  function listMovies({ keyword = "", status = "" } = {}) {
    const query = keyword.trim().toLowerCase();
    return state.value.movies.filter((movie) => {
      const matchName =
        !query || movie.movie_name.toLowerCase().includes(query);
      const visible = status === "SHOWING" || status === "ACTIVE";
      const matchStatus =
        !status || (visible ? movie.is_active : !movie.is_active);
      return matchName && matchStatus;
    });
  }

  function listCinemas({ keyword = "", status = "", city = "" } = {}) {
    const query = keyword.trim().toLowerCase();
    return state.value.cinemas.filter((cinema) => {
      const matchName =
        !query || cinema.cinema_name.toLowerCase().includes(query);
      const matchStatus =
        !status || (status === "ACTIVE" ? cinema.is_active : !cinema.is_active);
      const matchCity = !city || cityFromAddress(cinema.address) === city;
      return matchName && matchStatus && matchCity;
    });
  }

  function linksForMovie(movieId, { status = "" } = {}) {
    return state.value.links
      .filter((link) => link.movie_id === Number(movieId))
      .filter(
        (link) =>
          !status ||
          (status === "SHOWING" ? link.is_showing : !link.is_showing),
      );
  }

  function linksForCinema(cinemaId, { status = "" } = {}) {
    return state.value.links
      .filter((link) => link.cinema_id === Number(cinemaId))
      .filter(
        (link) =>
          !status ||
          (status === "SHOWING" ? link.is_showing : !link.is_showing),
      );
  }

  function cinemasForMovie(movieId, { status = "" } = {}) {
    return linksForMovie(movieId, { status })
      .map((link) => {
        const cinema = cinemaById(link.cinema_id);
        return cinema ? { ...cinema, link } : null;
      })
      .filter(Boolean);
  }

  function moviesForCinema(cinemaId, { status = "" } = {}) {
    return linksForCinema(cinemaId, { status })
      .map((link) => {
        const movie = movieById(link.movie_id);
        return movie ? { ...movie, link } : null;
      })
      .filter(Boolean);
  }

  function listShowtimes({ movieId, cinemaId, date, from, to } = {}) {
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to).getTime() : null;
    return state.value.showtimes
      .filter((item) => (movieId ? item.movie_id === Number(movieId) : true))
      .filter((item) => (cinemaId ? item.cinema_id === Number(cinemaId) : true))
      .filter((item) => (date ? dateKey(item.showtime) === date : true))
      .filter((item) => {
        const time = new Date(item.showtime).getTime();
        if (fromTime != null && time < fromTime) return false;
        if (toTime != null && time > toTime) return false;
        return true;
      })
      .slice()
      .sort((a, b) => a.showtime.localeCompare(b.showtime))
      .map(decorateShowtime);
  }

  function decorateShowtime(item) {
    return {
      ...item,
      movie_name: movieById(item.movie_id)?.movie_name || "未知電影",
      cinema_name: cinemaById(item.cinema_id)?.cinema_name || "未知影城",
    };
  }

  function showingLinks(cinemaId, movieId) {
    return state.value.links.filter(
      (link) =>
        link.cinema_id === cinemaId &&
        link.is_showing &&
        (!movieId || link.movie_id === Number(movieId)),
    );
  }

  function nearbyCinemas({
    lat,
    lng,
    radius = 3,
    movieId,
    hasBenefit = false,
    stockStatus = "",
  } = {}) {
    return state.value.cinemas
      .filter((cinema) => cinema.is_active)
      .map((cinema) => ({
        ...cinema,
        distanceKm: haversineKm(
          lat,
          lng,
          Number(cinema.latitude),
          Number(cinema.longitude),
        ),
      }))
      .filter((cinema) => cinema.distanceKm <= Number(radius))
      .filter((cinema) => {
        if (!movieId) return true;
        return showingLinks(cinema.cinema_id, movieId).length > 0;
      })
      .filter((cinema) => {
        const benefits = showingLinks(cinema.cinema_id, movieId).filter(
          (link) => link.benefit_id,
        );
        const inStock = benefits.some(
          (link) => link.benefit_status === "IN_STOCK",
        );
        if (hasBenefit && !benefits.length) return false;
        if (stockStatus === "IN_STOCK") return inStock;
        if (stockStatus === "OUT") return !inStock;
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  const stats = computed(() => {
    const withBenefit = new Set(
      state.value.links
        .filter((link) => link.benefit_id)
        .map((link) => link.movie_id),
    );
    return {
      movieCount: state.value.movies.length,
      benefitCount: state.value.benefits.length,
      withBenefitCount: withBenefit.size,
    };
  });

  function createMovie(payload, locks = null) {
    const movie = {
      movie_id: state.value.nextMovieId,
      movie_name: payload.movie_name.trim(),
      image_url: (payload.image_url || "").trim(),
      is_active: Boolean(payload.is_active),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.value.nextMovieId += 1;
    state.value.movies.push(movie);
    if (locks) syncLocks("MOVIE", movie.movie_id, movie, locks);
    persist();
    return movie;
  }

  function updateMovie(movieId, payload, locks = null) {
    const movie = movieById(movieId);
    if (!movie) return null;
    movie.movie_name = payload.movie_name.trim();
    movie.image_url = (payload.image_url || "").trim();
    movie.is_active = Boolean(payload.is_active);
    movie.updated_at = nowIso();
    noteOfficialFields("MOVIE", movie.movie_id, movie);
    if (locks) syncLocks("MOVIE", movie.movie_id, movie, locks);
    persist();
    return movie;
  }

  function setMovieStatus(movieId, isActive) {
    const movie = movieById(movieId);
    if (!movie) return null;
    movie.is_active = Boolean(isActive);
    movie.updated_at = nowIso();
    noteOfficialFields("MOVIE", movie.movie_id, movie, ["is_active"]);
    persist();
    return movie;
  }

  function createCinema(payload, locks = null) {
    const cinema = {
      cinema_id: state.value.nextCinemaId,
      cinema_name: payload.cinema_name.trim(),
      address: payload.address.trim(),
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      is_active: Boolean(payload.is_active),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.value.nextCinemaId += 1;
    state.value.cinemas.push(cinema);
    if (locks) syncLocks("CINEMA", cinema.cinema_id, cinema, locks);
    persist();
    return cinema;
  }

  function updateCinema(cinemaId, payload, locks = null) {
    const cinema = cinemaById(cinemaId);
    if (!cinema) return null;
    cinema.cinema_name = payload.cinema_name.trim();
    cinema.address = payload.address.trim();
    cinema.latitude = Number(payload.latitude);
    cinema.longitude = Number(payload.longitude);
    delete cinema.image_url;
    cinema.is_active = Boolean(payload.is_active);
    cinema.updated_at = nowIso();
    noteOfficialFields("CINEMA", cinema.cinema_id, cinema);
    if (locks) syncLocks("CINEMA", cinema.cinema_id, cinema, locks);
    persist();
    return cinema;
  }

  function setCinemaStatus(cinemaId, isActive) {
    const cinema = cinemaById(cinemaId);
    if (!cinema) return null;
    cinema.is_active = Boolean(isActive);
    cinema.updated_at = nowIso();
    noteOfficialFields("CINEMA", cinema.cinema_id, cinema, ["is_active"]);
    persist();
    return cinema;
  }

  function hasDuplicateShowtime(payload, ignoreId) {
    return state.value.showtimes.some(
      (item) =>
        item.showing_id !== ignoreId &&
        item.movie_id === Number(payload.movie_id) &&
        item.cinema_id === Number(payload.cinema_id) &&
        item.showtime === payload.showtime,
    );
  }

  function createShowtime(payload, locks = null) {
    const draft = {
      movie_id: Number(payload.movie_id),
      cinema_id: Number(payload.cinema_id),
      showtime: payload.showtime,
    };
    if (hasDuplicateShowtime(draft))
      return { error: "相同電影、影城與時間的場次已存在" };
    const showtime = {
      showing_id: state.value.nextShowingId,
      ...draft,
      is_active: new Date(draft.showtime).getTime() >= Date.now(),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.value.nextShowingId += 1;
    state.value.showtimes.push(showtime);
    if (locks) syncLocks("SHOWTIME", showtime.showing_id, showtime, locks);
    persist();
    return { showtime };
  }

  function updateShowtime(showingId, payload, locks = null) {
    const row = showtimeById(showingId);
    if (!row) return { error: "找不到場次" };
    const draft = {
      movie_id: Number(payload.movie_id),
      cinema_id: Number(payload.cinema_id),
      showtime: payload.showtime,
    };
    if (hasDuplicateShowtime(draft, row.showing_id)) {
      return { error: "相同電影、影城與時間的場次已存在" };
    }
    delete row.hall;
    Object.assign(row, draft, {
      is_active: new Date(draft.showtime).getTime() >= Date.now(),
      updated_at: nowIso(),
    });
    noteOfficialFields("SHOWTIME", row.showing_id, row);
    if (locks) syncLocks("SHOWTIME", row.showing_id, row, locks);
    persist();
    return { showtime: row };
  }

  function deleteShowtime(showingId) {
    const index = state.value.showtimes.findIndex(
      (item) => item.showing_id === Number(showingId),
    );
    if (index < 0) return false;
    state.value.showtimes.splice(index, 1);
    purgeOverrides("SHOWTIME", showingId);
    persist();
    return true;
  }

  function createLink(payload) {
    const cinemaId = Number(payload.cinema_id);
    const movieId = Number(payload.movie_id);
    const exists = state.value.links.some(
      (link) => link.cinema_id === cinemaId && link.movie_id === movieId,
    );
    if (exists) return { error: "此電影與影城的關聯已存在" };
    const benefitId = payload.benefit_id ? Number(payload.benefit_id) : null;
    const link = {
      id: state.value.nextLinkId,
      cinema_id: cinemaId,
      movie_id: movieId,
      benefit_id: benefitId,
      benefit_status: benefitId
        ? payload.benefit_status || "UNKNOWN"
        : "UNKNOWN",
      is_showing: payload.is_showing !== false,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.value.nextLinkId += 1;
    state.value.links.push(link);
    persist();
    return { link };
  }

  function updateLink(cinemaId, movieId, payload) {
    const link = state.value.links.find(
      (item) =>
        item.cinema_id === Number(cinemaId) &&
        item.movie_id === Number(movieId),
    );
    if (!link) return { error: "找不到關聯" };
    if (payload.benefit_id !== undefined) {
      link.benefit_id = payload.benefit_id ? Number(payload.benefit_id) : null;
    }
    if (payload.benefit_status) link.benefit_status = payload.benefit_status;
    if (!link.benefit_id) link.benefit_status = "UNKNOWN";
    if (payload.is_showing !== undefined)
      link.is_showing = Boolean(payload.is_showing);
    link.updated_at = nowIso();
    noteOfficialFields("LINK", link.id, link);
    persist();
    return { link };
  }

  function deleteLink(cinemaId, movieId) {
    const index = state.value.links.findIndex(
      (item) =>
        item.cinema_id === Number(cinemaId) &&
        item.movie_id === Number(movieId),
    );
    if (index < 0) return false;
    const link = state.value.links[index];
    state.value.links.splice(index, 1);
    purgeOverrides("LINK", link.id);
    persist();
    return true;
  }

  function overrideRows() {
    if (!Array.isArray(state.value.crawlerOverrides)) {
      state.value.crawlerOverrides = [];
    }
    return state.value.crawlerOverrides;
  }

  function findOverride(entityType, entityId, fieldName) {
    return (
      overrideRows().find(
        (item) =>
          item.entity_type === entityType &&
          item.entity_id === Number(entityId) &&
          item.field_name === fieldName,
      ) || null
    );
  }

  function readEntity(entityType, entityId) {
    if (entityType === "MOVIE") return movieById(entityId);
    if (entityType === "CINEMA") return cinemaById(entityId);
    if (entityType === "SHOWTIME") return showtimeById(entityId);
    if (entityType === "LINK") {
      return (
        state.value.links.find((item) => item.id === Number(entityId)) || null
      );
    }
    return null;
  }

  function noteOfficialFields(entityType, entityId, entity, fields) {
    const names = fields || LOCKABLE_FIELDS[entityType] || [];
    for (const field of names) {
      const override = findOverride(entityType, entityId, field);
      if (!override || override.crawler_value == null) continue;
      if (sameFieldValue(field, override.crawler_value, entity[field])) {
        override.crawler_value = null;
        override.updated_at = nowIso();
      }
    }
  }

  function ensureOverride(entityType, entityId, field, officialValue) {
    const existing = findOverride(entityType, entityId, field);
    if (!existing) {
      if (!state.value.nextOverrideId) state.value.nextOverrideId = 1;
      overrideRows().push({
        crawler_override_id: state.value.nextOverrideId,
        entity_type: entityType,
        entity_id: Number(entityId),
        field_name: field,
        crawler_value: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      state.value.nextOverrideId += 1;
      return;
    }
    if (
      existing.crawler_value != null &&
      sameFieldValue(field, existing.crawler_value, officialValue)
    ) {
      existing.crawler_value = null;
      existing.updated_at = nowIso();
    }
  }

  function removeOverride(entityType, entityId, fieldName) {
    const index = overrideRows().findIndex(
      (item) =>
        item.entity_type === entityType &&
        item.entity_id === Number(entityId) &&
        item.field_name === fieldName,
    );
    if (index >= 0) overrideRows().splice(index, 1);
  }

  function purgeOverrides(entityType, entityId) {
    state.value.crawlerOverrides = overrideRows().filter(
      (item) =>
        !(
          item.entity_type === entityType &&
          item.entity_id === Number(entityId)
        ),
    );
  }

  function syncLocks(entityType, entityId, entity, lockMap) {
    for (const field of LOCKABLE_FIELDS[entityType] || []) {
      if (lockMap?.[field]) ensureOverride(entityType, entityId, field, entity?.[field]);
      else removeOverride(entityType, entityId, field);
    }
  }

  function isFieldLocked(entityType, entityId, fieldName) {
    return Boolean(findOverride(entityType, entityId, fieldName));
  }

  function setFieldLocked(entityType, entityId, fieldName, locked) {
    const entity = readEntity(entityType, entityId);
    if (!entity) return false;
    if (locked) ensureOverride(entityType, entityId, fieldName, entity[fieldName]);
    else removeOverride(entityType, entityId, fieldName);
    persist();
    return true;
  }

  function displayValue(field, value) {
    return formatFieldValue(field, value, {
      movieName: (id) => movieById(id)?.movie_name,
      cinemaName: (id) => cinemaById(id)?.cinema_name,
      benefitName: (id) => benefitById(id)?.benefit_name,
    });
  }

  function proposeField(entityType, entityId, entity, field, rawNext) {
    const next = normalizeFieldValue(field, rawNext);
    const current = normalizeFieldValue(field, entity[field]);
    const override = findOverride(entityType, entityId, field);
    if (override) {
      if (sameFieldValue(field, current, next)) {
        if (override.crawler_value != null) {
          override.crawler_value = null;
          override.updated_at = nowIso();
        }
        return { status: "matches-official" };
      }
      if (
        override.crawler_value != null &&
        sameFieldValue(field, override.crawler_value, next)
      ) {
        return { status: "same-pending" };
      }
      override.crawler_value = next;
      override.updated_at = nowIso();
      return { status: "queued", previous: current, next };
    }
    if (sameFieldValue(field, current, next)) return { status: "unchanged" };
    entity[field] = next;
    if (field === "showtime") {
      entity.is_active = new Date(next).getTime() >= Date.now();
    }
    entity.updated_at = nowIso();
    return { status: "applied", previous: current, next };
  }

  function describeProposal(entityName, field, result) {
    const label = FIELD_LABELS[field] || field;
    if (result.status === "queued") {
      return `${entityName}的${label}已鎖定，正式值維持「${displayValue(field, result.previous)}」，最新爬蟲值「${displayValue(field, result.next)}」已寫入待審核。`;
    }
    if (result.status === "applied") {
      return `${entityName}的${label}從「${displayValue(field, result.previous)}」改成「${displayValue(field, result.next)}」。`;
    }
    if (result.status === "same-pending") {
      return `${entityName}的${label}已鎖定，最新爬蟲值與待審核值相同，正式資料未改。`;
    }
    if (result.status === "matches-official") {
      return `${entityName}的${label}已鎖定，爬蟲值與正式值相同，正式資料未改。`;
    }
    return "";
  }

  function applyIncomingFields(entityType, entityId, entity, entityName, after) {
    const texts = [];
    let applied = false;
    let queued = false;
    for (const field of LOCKABLE_FIELDS[entityType] || []) {
      if (!Object.prototype.hasOwnProperty.call(after, field)) continue;
      if (
        entityType === "SHOWTIME" &&
        field === "showtime" &&
        !findOverride(entityType, entityId, field)
      ) {
        const next = normalizeFieldValue(field, after[field]);
        if (!sameFieldValue(field, entity.showtime, next)) {
          const draft = {
            movie_id: entity.movie_id,
            cinema_id: entity.cinema_id,
            showtime: next,
          };
          if (hasDuplicateShowtime(draft, entity.showing_id)) {
            texts.push(
              `${entityName}的場次時間無法改成「${displayValue(field, next)}」，因為已有相同場次。`,
            );
            continue;
          }
        }
      }
      const result = proposeField(entityType, entityId, entity, field, after[field]);
      const line = describeProposal(entityName, field, result);
      if (line) texts.push(line);
      if (result.status === "applied") applied = true;
      if (result.status === "queued") queued = true;
    }
    return {
      changed: applied || queued,
      queued,
      text: texts.join("") || `${entityName}沒有新的變更。`,
    };
  }

  function findShowtimeTarget(item) {
    const movieId = Number(item.after.movie_id);
    const cinemaId = Number(item.after.cinema_id);
    const rows = state.value.showtimes.filter(
      (row) => row.movie_id === movieId && row.cinema_id === cinemaId,
    );
    return (
      rows.find((row) => row.showtime === item.before?.showtime) ||
      rows.find((row) => row.showtime === item.after.showtime) ||
      null
    );
  }

  function applyCrawlerItem(item) {
    if (item.entity === "movie" && item.action === "CREATE") {
      const name = item.after.movie_name;
      if (state.value.movies.some((movie) => movie.movie_name === name)) {
        return {
          changed: false,
          queued: false,
          text: `電影「${name}」已經有了，沒有再新增。`,
        };
      }
      createMovie(item.after);
      return { changed: true, queued: false, text: `新增電影「${name}」。` };
    }
    if (item.entity === "movie" && item.action === "UPDATE") {
      const movie = movieById(item.after.movie_id);
      if (!movie) {
        return { changed: false, queued: false, text: "找不到這部電影，沒有更新。" };
      }
      return applyIncomingFields(
        "MOVIE",
        movie.movie_id,
        movie,
        `「${movie.movie_name}」`,
        item.after,
      );
    }
    if (item.entity === "cinema" && item.action === "UPDATE") {
      const cinema = cinemaById(item.after.cinema_id);
      const name = item.before?.cinema_name || cinema?.cinema_name || "影城";
      if (!cinema) {
        return { changed: false, queued: false, text: `找不到${name}，沒有更新。` };
      }
      return applyIncomingFields("CINEMA", cinema.cinema_id, cinema, name, item.after);
    }
    if (item.entity === "link" && item.action === "CREATE") {
      const cinemaName =
        cinemaById(item.after.cinema_id)?.cinema_name || "影城";
      const movieName = movieById(item.after.movie_id)?.movie_name || "電影";
      const result = createLink(item.after);
      if (result.error) {
        return {
          changed: false,
          queued: false,
          text: `${cinemaName}已經有上映「${movieName}」，沒有再新增。`,
        };
      }
      return {
        changed: true,
        queued: false,
        text: `${cinemaName}開始上映「${movieName}」。`,
      };
    }
    if (item.entity === "link" && item.action === "UPDATE") {
      const link = state.value.links.find(
        (row) =>
          row.cinema_id === Number(item.after.cinema_id) &&
          row.movie_id === Number(item.after.movie_id),
      );
      const cinemaName =
        cinemaById(item.after.cinema_id)?.cinema_name || "影城";
      const movieName = movieById(item.after.movie_id)?.movie_name || "電影";
      if (!link) {
        return {
          changed: false,
          queued: false,
          text: `找不到${cinemaName}與「${movieName}」的上映關聯，沒有更新。`,
        };
      }
      return applyIncomingFields(
        "LINK",
        link.id,
        link,
        `${cinemaName}「${movieName}」`,
        item.after,
      );
    }
    if (item.entity === "showtime" && item.action === "CREATE") {
      const movieName = movieById(item.after.movie_id)?.movie_name || "電影";
      const cinemaName =
        cinemaById(item.after.cinema_id)?.cinema_name || "影城";
      const when = formatDateTime(item.after.showtime);
      const result = createShowtime(item.after);
      if (result.error) {
        return {
          changed: false,
          queued: false,
          text: `「${movieName}」在${cinemaName}的 ${when} 已經有這一場，沒有再新增。`,
        };
      }
      return {
        changed: true,
        queued: false,
        text: `新增放映：「${movieName}」，${cinemaName}，${when}。`,
      };
    }
    if (item.entity === "showtime" && item.action === "UPDATE") {
      const movieName = movieById(item.after.movie_id)?.movie_name || "電影";
      const cinemaName =
        cinemaById(item.after.cinema_id)?.cinema_name || "影城";
      const row = findShowtimeTarget(item);
      if (!row) {
        return {
          changed: false,
          queued: false,
          text: `找不到「${movieName}」在${cinemaName}的原場次，沒有更新。`,
        };
      }
      const when = formatDateTime(row.showtime);
      return applyIncomingFields(
        "SHOWTIME",
        row.showing_id,
        row,
        `「${movieName}」在${cinemaName}的 ${when}`,
        item.after,
      );
    }
    return { changed: false, queued: false, text: "這筆資料沒有寫入。" };
  }

  function appendCrawlerLog(type, message) {
    if (!state.value.crawlerLogs) state.value.crawlerLogs = [];
    const nextId =
      state.value.crawlerLogs.reduce(
        (max, item) => Math.max(max, item.crawler_log_id || 0),
        0,
      ) + 1;
    state.value.crawlerLogs.unshift({
      crawler_log_id: nextId,
      crawler_type: type,
      crawler_status: "SUCCESS",
      message,
      created_at: nowIso(),
    });
    persist();
  }

  function runCrawler(kind) {
    const meta = {
      movie: { type: "MOVIE", title: "電影" },
      cinema: { type: "CINEMA", title: "影城" },
      showtimes: { type: "SHOWTIME", title: "場次" },
    }[kind];
    const results = crawlerTemplates(kind).map((item) =>
      applyCrawlerItem(item),
    );
    const changed = results.filter((item) => item.changed);
    appendCrawlerLog(
      meta.type,
      changed.length
        ? changed.map((item) => item.text).join("")
        : `${meta.title}沒有新的變更。`,
    );
    return {
      title: changed.length ? `${meta.title}已處理` : `${meta.title}沒有新資料`,
      lines: results.map((item) => item.text),
    };
  }

  function describeOverride(item) {
    const entity = readEntity(item.entity_type, item.entity_id);
    let entityLabel = "已刪除的資料";
    let editPath = "";
    if (item.entity_type === "MOVIE" && entity) {
      entityLabel = entity.movie_name;
      editPath = `/admin/movies/${entity.movie_id}/edit`;
    } else if (item.entity_type === "CINEMA" && entity) {
      entityLabel = entity.cinema_name;
      editPath = `/admin/cinemas/${entity.cinema_id}/edit`;
    } else if (item.entity_type === "SHOWTIME" && entity) {
      const movieName = movieById(entity.movie_id)?.movie_name || "未知電影";
      const cinemaName = cinemaById(entity.cinema_id)?.cinema_name || "未知影城";
      entityLabel = `${movieName}＠${cinemaName} ${formatDateTime(entity.showtime)}`;
      editPath = `/admin/showtimes/${entity.showing_id}/edit`;
    } else if (item.entity_type === "LINK" && entity) {
      const movieName = movieById(entity.movie_id)?.movie_name || "未知電影";
      const cinemaName = cinemaById(entity.cinema_id)?.cinema_name || "未知影城";
      entityLabel = `${cinemaName}／${movieName}`;
      editPath = `/admin/cinemas/${entity.cinema_id}/edit`;
    }
    const official = entity ? entity[item.field_name] : null;
    const pending =
      item.crawler_value != null &&
      Boolean(entity) &&
      !sameFieldValue(item.field_name, official, item.crawler_value);
    return {
      ...item,
      entity_type_label: ENTITY_LABELS[item.entity_type] || item.entity_type,
      entity_label: entityLabel,
      field_label: FIELD_LABELS[item.field_name] || item.field_name,
      official_text: entity
        ? displayValue(item.field_name, official)
        : "資料已不存在",
      crawler_text:
        item.crawler_value == null
          ? "尚無新的爬蟲值"
          : displayValue(item.field_name, item.crawler_value),
      pending,
      edit_path: editPath,
    };
  }

  function listCrawlerOverrides({ type = "" } = {}) {
    return overrideRows()
      .filter((item) => !type || item.entity_type === type)
      .map(describeOverride)
      .sort(
        (a, b) =>
          Number(b.pending) - Number(a.pending) ||
          b.updated_at.localeCompare(a.updated_at) ||
          b.crawler_override_id - a.crawler_override_id,
      );
  }

  function applyLatestCrawlerValue(overrideId) {
    const row = overrideRows().find(
      (item) => item.crawler_override_id === Number(overrideId),
    );
    if (!row || row.crawler_value == null) return { error: "沒有可保留的最新爬蟲值" };
    const entity = readEntity(row.entity_type, row.entity_id);
    if (!entity) return { error: "這筆資料已不存在，無法寫入最新爬蟲值" };
    const next = normalizeFieldValue(row.field_name, row.crawler_value);
    if (row.entity_type === "SHOWTIME" && row.field_name === "showtime") {
      const draft = {
        movie_id: entity.movie_id,
        cinema_id: entity.cinema_id,
        showtime: next,
      };
      if (hasDuplicateShowtime(draft, entity.showing_id)) {
        return { error: "相同電影、影城與時間的場次已存在，無法改成最新爬蟲值" };
      }
      entity.showtime = next;
      entity.is_active = new Date(next).getTime() >= Date.now();
    } else {
      entity[row.field_name] = next;
    }
    entity.updated_at = nowIso();
    row.crawler_value = null;
    row.updated_at = nowIso();
    persist();
    return { ok: true };
  }

  function keepManualOverride(overrideId) {
    const row = overrideRows().find(
      (item) => item.crawler_override_id === Number(overrideId),
    );
    if (!row) return false;
    row.crawler_value = null;
    row.updated_at = nowIso();
    persist();
    return true;
  }

  function restoreAutoSync(overrideId) {
    const index = overrideRows().findIndex(
      (item) => item.crawler_override_id === Number(overrideId),
    );
    if (index < 0) return false;
    overrideRows().splice(index, 1);
    persist();
    return true;
  }

  function listCrawlerLogs({ type = "", status = "" } = {}) {
    return (state.value.crawlerLogs || [])
      .filter((item) =>
        ["MOVIE", "CINEMA", "SHOWTIME"].includes(item.crawler_type),
      )
      .filter((item) => !type || item.crawler_type === type)
      .filter((item) => !status || item.crawler_status === status)
      .slice()
      .sort(
        (a, b) =>
          b.created_at.localeCompare(a.created_at) ||
          b.crawler_log_id - a.crawler_log_id,
      );
  }

  return {
    movies,
    cinemas,
    benefits,
    stats,
    movieById,
    cinemaById,
    benefitById,
    showtimeById,
    listMovies,
    listCinemas,
    cinemasForMovie,
    moviesForCinema,
    linksForMovie,
    linksForCinema,
    listShowtimes,
    nearbyCinemas,
    createMovie,
    updateMovie,
    setMovieStatus,
    createCinema,
    updateCinema,
    setCinemaStatus,
    createShowtime,
    updateShowtime,
    deleteShowtime,
    createLink,
    updateLink,
    deleteLink,
    isFieldLocked,
    setFieldLocked,
    runCrawler,
    listCrawlerLogs,
    listCrawlerOverrides,
    applyLatestCrawlerValue,
    keepManualOverride,
    restoreAutoSync,
  };
});
