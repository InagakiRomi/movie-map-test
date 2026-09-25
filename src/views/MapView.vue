<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import CinemaMap from '@/components/CinemaMap.vue'
import { useCatalogStore } from '@/stores/catalog'
import { benefitStatusText, formatDistance } from '@/utils/format'
import { TAIPEI_STATION } from '@/utils/geo'

const catalog = useCatalogStore()
const mode = ref('current')
const ready = ref(false)
const searchCenter = ref(null)
const draftCenter = ref(null)
const userLocation = ref(null)
const radiusKm = ref(3)
const movieId = ref('')
const onlyWithBenefit = ref(false)
const stockStatus = ref('')
const selectedId = ref(null)
const locateMessage = ref('正在取得目前位置…')

const results = computed(() => {
  if (!searchCenter.value) return []
  return catalog.nearbyCinemas({
    lat: searchCenter.value.lat,
    lng: searchCenter.value.lng,
    radius: radiusKm.value,
    movieId: movieId.value || null,
    hasBenefit: onlyWithBenefit.value,
    stockStatus: stockStatus.value,
  })
})

watch(results, (list) => {
  if (selectedId.value && !list.some((item) => item.cinema_id === selectedId.value)) {
    selectedId.value = null
  }
})

const selected = computed(() => results.value.find((item) => item.cinema_id === selectedId.value) || null)

const showingMovies = computed(() =>
  selected.value ? catalog.moviesForCinema(selected.value.cinema_id, { status: 'SHOWING' }) : [],
)

const mapView = computed(() => searchCenter.value)

function applyCenter(lat, lng, nextMode) {
  const center = { lat: Number(lat), lng: Number(lng) }
  searchCenter.value = center
  draftCenter.value = { ...center }
  mode.value = nextMode
  if (selectedId.value && !results.value.some((item) => item.cinema_id === selectedId.value)) {
    selectedId.value = null
  }
}

function useTaipeiStation() {
  userLocation.value = null
  applyCenter(TAIPEI_STATION.lat, TAIPEI_STATION.lng, 'station')
  locateMessage.value = '找不到目前位置，已定位在台北車站'
  ready.value = true
}

function useCurrent() {
  locateMessage.value = '正在取得目前位置…'
  if (!navigator.geolocation) {
    useTaipeiStation()
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      applyCenter(position.coords.latitude, position.coords.longitude, 'current')
      locateMessage.value = '正在查看目前座標'
      ready.value = true
    },
    () => {
      useTaipeiStation()
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

function searchHere() {
  if (!draftCenter.value) return
  applyCenter(draftCenter.value.lat, draftCenter.value.lng, 'specified')
  locateMessage.value = '正在查看指定座標'
}

function onMove(center) {
  draftCenter.value = center
}

function selectCinema(id) {
  selectedId.value = id
}

onMounted(useCurrent)
</script>

<template>
  <main class="map-page">
    <section class="map-toolbar p-3">
      <div class="row g-2 align-items-end">
        <div class="col-lg-3">
          <label class="form-label" for="radius">搜尋半徑 {{ radiusKm }} 公里</label>
          <input id="radius" v-model.number="radiusKm" class="form-range" type="range" min="1" max="15" step="0.5" />
        </div>
        <div class="col-md-4 col-lg-3">
          <label class="form-label" for="movie-filter">電影</label>
          <select id="movie-filter" v-model="movieId" class="form-select">
            <option value="">全部電影</option>
            <option v-for="movie in catalog.movies.filter((item) => item.is_active)" :key="movie.movie_id" :value="movie.movie_id">
              {{ movie.movie_name }}
            </option>
          </select>
        </div>
        <div class="col-md-4 col-lg-2">
          <label class="form-label" for="stock-filter">庫存</label>
          <select id="stock-filter" v-model="stockStatus" class="form-select">
            <option value="">全部</option>
            <option value="IN_STOCK">有</option>
            <option value="OUT">無</option>
          </select>
        </div>
        <div class="col-lg-4 d-flex flex-wrap align-items-center gap-2">
          <div class="form-check mb-0">
            <input id="only-benefit" v-model="onlyWithBenefit" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="only-benefit">只顯示有特典</label>
          </div>
          <button class="btn btn-outline-secondary" type="button" @click="useCurrent">回到目前座標</button>
          <button class="btn btn-mm" type="button" :disabled="!draftCenter" @click="searchHere">定位到此地</button>
        </div>
        <p class="col-12 small text-secondary mb-0">
          移動地圖後按「定位到此地」。{{ locateMessage }}<template v-if="searchCenter">
            （{{ mode === 'current' ? '目前座標' : mode === 'station' ? '台北車站' : '指定座標' }}
            {{ searchCenter.lat.toFixed(4) }}, {{ searchCenter.lng.toFixed(4) }}）。找到 {{ results.length }} 間影城。
          </template>
          <template v-else-if="draftCenter">
            地圖中心 {{ draftCenter.lat.toFixed(4) }}, {{ draftCenter.lng.toFixed(4) }}。
          </template>
        </p>
      </div>
    </section>
    <div v-if="ready && mapView" class="map-body">
      <CinemaMap
        :lat="mapView.lat"
        :lng="mapView.lng"
        :zoom="searchCenter ? 14 : 7"
        :show-circle="Boolean(searchCenter)"
        :radius-km="radiusKm"
        :cinemas="results"
        :selected-id="selectedId"
        :user-lat="userLocation?.lat"
        :user-lng="userLocation?.lng"
        @select="selectCinema"
        @moveend="onMove"
      />
      <aside class="map-panel p-3">
        <h1 class="h5">附近影城</h1>
        <p v-if="!results.length" class="text-secondary">
          此範圍沒有符合條件的影城。可加大半徑、清除篩選，或移動地圖後按「定位到此地」。
        </p>
        <div v-else class="list-group mb-3">
          <button
            v-for="cinema in results"
            :key="cinema.cinema_id"
            type="button"
            class="list-group-item list-group-item-action nearby-item"
            :class="{ 'is-active': cinema.cinema_id === selectedId }"
            @click="selectCinema(cinema.cinema_id)"
          >
            <span class="fw-semibold">{{ cinema.cinema_name }}</span>
            <span class="d-block small text-secondary">{{ formatDistance(cinema.distanceKm) }}</span>
          </button>
        </div>

        <div v-if="selected" class="border-top pt-3">
          <h2 class="h4">{{ selected.cinema_name }}</h2>
          <p class="mb-1">{{ selected.address }}</p>
          <p class="mb-2">
            <RouterLink class="btn btn-outline-secondary btn-sm" to="/cinema-site">影城官方網站</RouterLink>
          </p>
          <p class="small text-secondary">距離 {{ formatDistance(selected.distanceKm) }}</p>
          <h3 class="h6">電影與特典</h3>
          <ul v-if="showingMovies.length" class="list-unstyled">
            <li v-for="movie in showingMovies" :key="movie.movie_id" class="mb-2">
              <RouterLink :to="`/movies/${movie.movie_id}`">{{ movie.movie_name }}</RouterLink>
              <span v-if="movie.link.benefit_id" class="badge text-bg-light ms-1">
                {{ catalog.benefitById(movie.link.benefit_id)?.benefit_name }}
                · {{ benefitStatusText(movie.link.benefit_status) }}
              </span>
            </li>
          </ul>
          <p v-else class="text-secondary">這間影城目前沒有上映中的電影。</p>
          <RouterLink class="btn btn-outline-secondary btn-sm" :to="`/cinemas/${selected.cinema_id}`">
            查看影城詳情
          </RouterLink>
        </div>
        <p v-else class="text-secondary border-top pt-3 mb-0">點選地圖釘可查看這間影城的特典、地址與官方網站。</p>
      </aside>
    </div>
    <div v-else class="map-body align-items-center justify-content-center bg-white">
      <p class="text-secondary mb-0 px-3">{{ locateMessage }}</p>
    </div>
  </main>
</template>
