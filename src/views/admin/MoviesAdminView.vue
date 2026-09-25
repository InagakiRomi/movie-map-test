<script setup>
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { downloadCsv } from '@/utils/csv'
import { formatDateTime } from '@/utils/format'

const catalog = useCatalogStore()
const status = ref('')

const movies = computed(() => catalog.listMovies({ status: status.value }))

function toggle(movie) {
  catalog.setMovieStatus(movie.movie_id, !movie.is_active)
}

function exportCsv() {
  downloadCsv(
    'movies.csv',
    catalog.movies.map((movie) => ({
      電影ID: movie.movie_id,
      電影名稱: movie.movie_name,
      圖片: movie.image_url,
      顯示: movie.is_active ? '顯示' : '隱藏',
      建立時間: formatDateTime(movie.created_at),
      修改時間: formatDateTime(movie.updated_at),
    })),
  )
}
</script>

<template>
  <main class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h1 class="h3 mb-0">電影管理</h1>
      <div class="d-flex flex-wrap gap-2">
        <select v-model="status" class="form-select w-auto" aria-label="顯示狀態">
          <option value="">全部狀態</option>
          <option value="ACTIVE">顯示</option>
          <option value="INACTIVE">隱藏</option>
        </select>
        <button class="btn btn-outline-secondary" type="button" @click="exportCsv">匯出 CSV</button>
        <RouterLink class="btn btn-mm" to="/admin/movies/new">新增電影</RouterLink>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>名稱</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>修改時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movie in movies" :key="movie.movie_id">
            <td>{{ movie.movie_id }}</td>
            <td>{{ movie.movie_name }}</td>
            <td>{{ movie.is_active ? '顯示' : '隱藏' }}</td>
            <td class="text-nowrap">{{ formatDateTime(movie.created_at) }}</td>
            <td class="text-nowrap">{{ formatDateTime(movie.updated_at) }}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-2" type="button" @click="toggle(movie)">
                {{ movie.is_active ? '隱藏' : '顯示' }}
              </button>
              <RouterLink class="btn btn-sm btn-outline-dark" :to="`/admin/movies/${movie.movie_id}/edit`">
                修改
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
