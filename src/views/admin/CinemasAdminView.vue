<script setup>
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { downloadCsv } from '@/utils/csv'
import { formatDateTime } from '@/utils/format'

const catalog = useCatalogStore()
const status = ref('')

const cinemas = computed(() => catalog.listCinemas({ status: status.value }))

function toggle(cinema) {
  catalog.setCinemaStatus(cinema.cinema_id, !cinema.is_active)
}

function exportCsv() {
  downloadCsv(
    'cinemas.csv',
    catalog.cinemas.map((cinema) => ({
      影城ID: cinema.cinema_id,
      影城名稱: cinema.cinema_name,
      地址: cinema.address,
      緯度: cinema.latitude,
      經度: cinema.longitude,
      顯示: cinema.is_active ? '顯示' : '隱藏',
      建立時間: formatDateTime(cinema.created_at),
      修改時間: formatDateTime(cinema.updated_at),
    })),
  )
}
</script>

<template>
  <main class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h1 class="h3 mb-0">影城管理</h1>
      <div class="d-flex flex-wrap gap-2">
        <select v-model="status" class="form-select w-auto" aria-label="顯示狀態">
          <option value="">全部狀態</option>
          <option value="ACTIVE">顯示</option>
          <option value="INACTIVE">隱藏</option>
        </select>
        <button class="btn btn-outline-secondary" type="button" @click="exportCsv">匯出 CSV</button>
        <RouterLink class="btn btn-mm" to="/admin/cinemas/new">新增影城</RouterLink>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>名稱</th>
            <th>地址</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>修改時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cinema in cinemas" :key="cinema.cinema_id">
            <td>{{ cinema.cinema_id }}</td>
            <td>{{ cinema.cinema_name }}</td>
            <td>{{ cinema.address }}</td>
            <td>{{ cinema.is_active ? '顯示' : '隱藏' }}</td>
            <td class="text-nowrap">{{ formatDateTime(cinema.created_at) }}</td>
            <td class="text-nowrap">{{ formatDateTime(cinema.updated_at) }}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-2" type="button" @click="toggle(cinema)">
                {{ cinema.is_active ? '隱藏' : '顯示' }}
              </button>
              <RouterLink class="btn btn-sm btn-outline-dark" :to="`/admin/cinemas/${cinema.cinema_id}/edit`">
                修改
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
