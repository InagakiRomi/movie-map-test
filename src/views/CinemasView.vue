<script setup>
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { cityFromAddress } from '@/utils/format'

const catalog = useCatalogStore()
const keyword = ref('')
const city = ref('')
const benefitOnly = ref(false)

function cinemaHasBenefit(cinemaId) {
  return catalog
    .moviesForCinema(cinemaId, { status: 'SHOWING' })
    .some((movie) => movie.link.benefit_id)
}

const cities = computed(() => {
  const names = catalog
    .listCinemas({ status: 'ACTIVE' })
    .map((cinema) => cityFromAddress(cinema.address))
    .filter(Boolean)
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
})

const cinemas = computed(() => {
  const rows = catalog.listCinemas({ keyword: keyword.value, status: 'ACTIVE', city: city.value })
  if (!benefitOnly.value) return rows
  return rows.filter((cinema) => cinemaHasBenefit(cinema.cinema_id))
})
</script>

<template>
  <main class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 class="h3 mb-1">影城</h1>
        <p class="text-secondary mb-0">查看各影城目前有哪些特典，可依名稱或縣市篩選。</p>
      </div>
      <form class="row g-2" @submit.prevent>
        <div class="col-auto">
          <input v-model="keyword" class="form-control" type="search" placeholder="影城名稱" aria-label="影城名稱" />
        </div>
        <div class="col-auto">
          <select v-model="city" class="form-select" aria-label="縣市">
            <option value="">全部縣市</option>
            <option v-for="name in cities" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
        <div class="col-auto">
          <button
            class="btn"
            :class="benefitOnly ? 'btn-mm' : 'btn-outline-secondary'"
            type="button"
            :aria-pressed="benefitOnly"
            @click="benefitOnly = !benefitOnly"
          >
            只顯示有特典的影城
          </button>
        </div>
      </form>
    </div>
    <p v-if="!cinemas.length" class="text-secondary">沒有符合條件的影城。</p>
    <div class="row g-3">
      <div v-for="cinema in cinemas" :key="cinema.cinema_id" class="col-md-6 col-lg-4">
        <RouterLink class="card h-100 text-decoration-none text-reset" :to="`/cinemas/${cinema.cinema_id}`">
          <div class="card-body">
            <h2 class="h5 card-title">{{ cinema.cinema_name }}</h2>
            <p class="card-text mb-0">{{ cinema.address }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </main>
</template>
