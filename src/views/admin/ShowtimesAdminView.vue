<script setup>
import { computed, ref } from "vue";
import { useCatalogStore } from "@/stores/catalog";
import { downloadCsv } from "@/utils/csv";
import {
  formatDateTime,
  showtimeFinished,
  showtimeStatusText,
  todayKey,
} from "@/utils/format";

const catalog = useCatalogStore();
const today = todayKey();
const from = ref(`${today}T00:00`);
const to = ref(`${today}T23:59`);
const status = ref("");
const rangeInvalid = computed(() =>
  Boolean(from.value && to.value && from.value > to.value),
);

const rows = computed(() => {
  if (rangeInvalid.value) return [];
  return catalog
    .listShowtimes({ from: from.value, to: to.value })
    .filter((row) => {
      if (status.value === "UPCOMING") return !showtimeFinished(row.showtime);
      if (status.value === "FINISHED") return showtimeFinished(row.showtime);
      return true;
    });
});

function remove(row) {
  if (
    !window.confirm(`刪除「${row.movie_name}」在 ${row.cinema_name} 的場次？`)
  )
    return;
  catalog.deleteShowtime(row.showing_id);
}

function exportCsv() {
  downloadCsv(
    `showtimes-${from.value.replace(":", "")}_${to.value.replace(":", "")}.csv`,
    rows.value.map((row) => ({
      場次ID: row.showing_id,
      電影: row.movie_name,
      影城: row.cinema_name,
      時間: formatDateTime(row.showtime),
      狀態: showtimeStatusText(row.showtime),
      建立時間: formatDateTime(row.created_at),
      修改時間: formatDateTime(row.updated_at),
    })),
  );
}
</script>

<template>
  <main class="container py-4">
    <div
      class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3"
    >
      <div>
        <h1 class="h3 mb-1">場次管理</h1>
        <p class="text-secondary mb-0">
          狀態依場次自動判斷，場次過了會標成已放完。
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <input
          v-model="from"
          class="form-control w-auto"
          type="datetime-local"
          aria-label="開始時間"
        />
        <span class="text-secondary align-self-center">到</span>
        <input
          v-model="to"
          class="form-control w-auto"
          type="datetime-local"
          aria-label="結束時間"
        />
        <select
          v-model="status"
          class="form-select w-auto"
          aria-label="場次狀態"
        >
          <option value="">全部狀態</option>
          <option value="UPCOMING">未放映</option>
          <option value="FINISHED">已放完</option>
        </select>
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="exportCsv"
        >
          匯出 CSV
        </button>
        <RouterLink class="btn btn-mm" to="/admin/showtimes/new"
          >新增場次</RouterLink
        >
      </div>
    </div>
    <p v-if="rangeInvalid" class="text-secondary">開始時間不能晚於結束時間。</p>
    <p v-else-if="!rows.length" class="text-secondary">
      這個時間範圍沒有場次。
    </p>
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>時間</th>
            <th>電影</th>
            <th>影城</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>修改時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.showing_id">
            <td>{{ formatDateTime(row.showtime) }}</td>
            <td>{{ row.movie_name }}</td>
            <td>{{ row.cinema_name }}</td>
            <td>{{ showtimeStatusText(row.showtime) }}</td>
            <td class="text-nowrap">{{ formatDateTime(row.created_at) }}</td>
            <td class="text-nowrap">{{ formatDateTime(row.updated_at) }}</td>
            <td class="text-end text-nowrap">
              <RouterLink
                class="btn btn-sm btn-outline-dark me-2"
                :to="`/admin/showtimes/${row.showing_id}/edit`"
              >
                修改
              </RouterLink>
              <button
                class="btn btn-sm btn-outline-danger"
                type="button"
                @click="remove(row)"
              >
                刪除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
