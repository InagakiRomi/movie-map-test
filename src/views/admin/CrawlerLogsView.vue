<script setup>
import { computed, ref } from "vue";
import { useCatalogStore } from "@/stores/catalog";
import {
  crawlerStatusText,
  crawlerTypeText,
  formatDateTime,
} from "@/utils/format";

const catalog = useCatalogStore();
const type = ref("");
const status = ref("");

const logs = computed(() =>
  catalog.listCrawlerLogs({ type: type.value, status: status.value }),
);
</script>

<template>
  <main class="container py-4">
    <div
      class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"
    >
      <div>
        <h1 class="h3 mb-1">爬蟲紀錄</h1>
        <p class="text-secondary mb-0">每次爬蟲執行後留下的結果或錯誤訊息。</p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <select v-model="type" class="form-select w-auto" aria-label="爬蟲類型">
          <option value="">全部類型</option>
          <option value="MOVIE">電影</option>
          <option value="CINEMA">影城</option>
          <option value="SHOWTIME">場次</option>
        </select>
        <select
          v-model="status"
          class="form-select w-auto"
          aria-label="執行狀態"
        >
          <option value="">全部狀態</option>
          <option value="SUCCESS">成功</option>
          <option value="FAILURE">失敗</option>
        </select>
      </div>
    </div>
    <p v-if="!logs.length" class="text-secondary">沒有符合條件的爬蟲紀錄。</p>
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>類型</th>
            <th>狀態</th>
            <th>訊息</th>
            <th>執行時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.crawler_log_id">
            <td>{{ log.crawler_log_id }}</td>
            <td class="text-nowrap">{{ crawlerTypeText(log.crawler_type) }}</td>
            <td>{{ crawlerStatusText(log.crawler_status) }}</td>
            <td class="text-break">{{ log.message }}</td>
            <td class="text-nowrap">{{ formatDateTime(log.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
