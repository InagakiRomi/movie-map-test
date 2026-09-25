<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FieldLock from '@/components/FieldLock.vue'
import LinkManager from '@/components/LinkManager.vue'
import { useCatalogStore } from '@/stores/catalog'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const isEdit = computed(() => route.name === 'admin-movie-edit')
const movie = computed(() => (isEdit.value ? catalog.movieById(route.params.movieId) : null))
const form = reactive({
  movie_name: '',
  image_url: '',
  is_active: true,
})
const locks = reactive({
  movie_name: false,
  image_url: false,
  is_active: false,
})

watch(
  movie,
  (value) => {
    if (!value) {
      locks.movie_name = false
      locks.image_url = false
      locks.is_active = false
      return
    }
    form.movie_name = value.movie_name
    form.image_url = value.image_url
    form.is_active = value.is_active
    locks.movie_name = catalog.isFieldLocked('MOVIE', value.movie_id, 'movie_name')
    locks.image_url = catalog.isFieldLocked('MOVIE', value.movie_id, 'image_url')
    locks.is_active = catalog.isFieldLocked('MOVIE', value.movie_id, 'is_active')
  },
  { immediate: true },
)

function save() {
  if (isEdit.value) {
    catalog.updateMovie(route.params.movieId, form, locks)
    router.push('/admin/movies')
    return
  }
  const created = catalog.createMovie(form, locks)
  router.push(`/admin/movies/${created.movie_id}/edit`)
}
</script>

<template>
  <main class="container py-4">
    <RouterLink class="small" to="/admin/movies">回電影管理</RouterLink>
    <h1 class="h3 mt-2">{{ isEdit ? '修改電影' : '新增電影' }}</h1>
    <p v-if="movie" class="text-secondary small">
      建立時間：{{ formatDateTime(movie.created_at) }}　修改時間：{{ formatDateTime(movie.updated_at) }}
    </p>
    <p v-if="isEdit && !movie">找不到這部電影。</p>
    <template v-else>
    <p class="text-secondary">
      勾選鎖定才會建立覆蓋紀錄。沒有鎖定的欄位，下次爬蟲仍會直接更新。
    </p>
    <form class="col-lg-8" @submit.prevent="save">
      <div class="mb-3">
        <label class="form-label" for="movie-name">電影名稱</label>
        <input id="movie-name" v-model="form.movie_name" class="form-control" required maxlength="64" />
        <FieldLock id="lock-movie-name" v-model="locks.movie_name" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="movie-image">圖片網址</label>
        <input id="movie-image" v-model="form.image_url" class="form-control" type="url" />
        <FieldLock id="lock-movie-image" v-model="locks.image_url" />
      </div>
      <div class="mb-3">
        <div class="form-check">
          <input id="movie-active" v-model="form.is_active" class="form-check-input" type="checkbox" />
          <label class="form-check-label" for="movie-active">顯示</label>
        </div>
        <FieldLock id="lock-movie-active" v-model="locks.is_active" />
      </div>
      <button class="btn btn-mm" type="submit">儲存</button>
    </form>
    </template>
    <LinkManager v-if="movie" :movie-id="movie.movie_id" />
  </main>
</template>
