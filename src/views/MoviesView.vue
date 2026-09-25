<script setup>
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'

const catalog = useCatalogStore()
const keyword = ref('')

const movies = computed(() => catalog.listMovies({ keyword: keyword.value, status: 'SHOWING' }))
</script>

<template>
  <main class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 class="h3 mb-1">電影</h1>
        <p class="text-secondary mb-0">從電影找出還有特典的影城，可依名稱搜尋。</p>
      </div>
      <form class="row g-2" @submit.prevent>
        <div class="col-auto">
          <input v-model="keyword" class="form-control" type="search" placeholder="電影名稱" aria-label="電影名稱" />
        </div>
      </form>
    </div>
    <p v-if="!movies.length" class="text-secondary">沒有符合條件的電影。</p>
    <div class="row g-3">
      <div v-for="movie in movies" :key="movie.movie_id" class="col-6 col-md-4 col-lg-3">
        <RouterLink class="card h-100 text-decoration-none text-reset" :to="`/movies/${movie.movie_id}`">
          <img class="poster card-img-top" :src="movie.image_url" :alt="movie.movie_name" />
          <div class="card-body">
            <h2 class="h6 card-title mb-0">{{ movie.movie_name }}</h2>
          </div>
        </RouterLink>
      </div>
    </div>
  </main>
</template>
