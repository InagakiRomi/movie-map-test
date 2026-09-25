<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useCatalogStore } from "@/stores/catalog";

const route = useRoute();
const catalog = useCatalogStore();
const freshCount = computed(
  () =>
    catalog
      .listCrawlerOverrides({})
      .filter((row) => row.crawler_value != null).length,
);

const links = [
  { to: "/map", label: "地圖", match: "/map" },
  { to: "/cinemas", label: "影城", match: "/cinemas" },
  { to: "/movies", label: "電影", match: "/movies" },
];

const adminLinks = [
  { to: "/admin/cinemas", label: "影城管理" },
  { to: "/admin/movies", label: "電影管理" },
  { to: "/admin/showtimes", label: "場次管理" },
  { to: "/admin/crawler", label: "爬蟲同步" },
  { to: "/admin/crawler-overrides", label: "爬蟲覆蓋審核" },
  { to: "/admin/crawler-logs", label: "爬蟲紀錄" },
];

const adminActive = computed(() => route.path.startsWith("/admin"));

function isActive(path) {
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark navbar-mm sticky-top">
    <div class="container-fluid">
      <RouterLink class="navbar-brand fw-semibold" to="/map">特典收集</RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="開啟選單"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="mainNav" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li v-for="link in links" :key="link.to" class="nav-item">
            <RouterLink
              class="nav-link"
              :class="{ active: isActive(link.match) }"
              :to="link.to"
            >
              {{ link.label }}
            </RouterLink>
          </li>
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              :class="{ active: adminActive }"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              管理
              <span
                v-if="freshCount"
                class="crawler-alert"
                :title="`${freshCount} 筆欄位有最新爬蟲值，請進入爬蟲覆蓋審核`"
              >
                {{ freshCount }}
              </span>
            </a>
            <ul class="dropdown-menu">
              <li v-for="link in adminLinks" :key="link.to">
                <RouterLink class="dropdown-item" :to="link.to">
                  {{ link.label }}
                  <span
                    v-if="link.to === '/admin/crawler-overrides' && freshCount"
                    class="crawler-alert"
                    :title="`${freshCount} 筆欄位有最新爬蟲值`"
                  >
                    {{ freshCount }}
                  </span>
                </RouterLink>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
