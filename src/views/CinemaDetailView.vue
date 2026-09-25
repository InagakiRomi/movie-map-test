<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useCatalogStore } from "@/stores/catalog";
import { benefitStatusText, formatDateTime, todayKey } from "@/utils/format";

const route = useRoute();
const catalog = useCatalogStore();
const date = ref(todayKey());

const cinema = computed(() => catalog.cinemaById(route.params.cinemaId));
const movies = computed(() =>
  cinema.value
    ? catalog.moviesForCinema(cinema.value.cinema_id, { status: "SHOWING" })
    : [],
);
const showtimes = computed(() =>
  cinema.value
    ? catalog
        .listShowtimes({ cinemaId: cinema.value.cinema_id, date: date.value })
        .filter((row) => row.is_active)
    : [],
);

function timesFor(movieId) {
  return showtimes.value.filter((row) => row.movie_id === movieId);
}

function formatShowtime(value) {
  return new Date(value).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const benefits = computed(() =>
  movies.value
    .filter((movie) => movie.link.benefit_id)
    .map((movie) => ({
      movie_id: movie.movie_id,
      movie_name: movie.movie_name,
      benefit_name: catalog.benefitById(movie.link.benefit_id)?.benefit_name || "未知特典",
      status: benefitStatusText(movie.link.benefit_status),
      updated_at: movie.link.updated_at,
    })),
);

const benefitUpdatedAt = computed(() => {
  const times = benefits.value.map((row) => row.updated_at).filter(Boolean);
  if (!times.length) return "";
  return times.reduce((latest, value) =>
    new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
  );
});
</script>

<template>
  <main class="container py-4">
    <RouterLink class="small" to="/cinemas">回影城列表</RouterLink>
    <p v-if="!cinema" class="mt-3">找不到這間影城。</p>
    <div v-else class="mt-3">
      <h1 class="h3">{{ cinema.cinema_name }}</h1>
      <p>{{ cinema.address }}</p>
      <p>
        <RouterLink class="btn btn-outline-secondary btn-sm" to="/cinema-site"
          >影城官方網站</RouterLink
        >
      </p>

      <div class="d-flex flex-wrap align-items-end gap-2 mt-4 mb-3">
        <h2 class="h5 mb-0">場次</h2>
        <input
          v-model="date"
          class="form-control w-auto"
          type="date"
          aria-label="場次日期"
        />
      </div>
      <p v-if="!movies.length" class="text-secondary">沒有電影。</p>
      <div v-else class="row g-3">
        <div v-for="movie in movies" :key="movie.movie_id" class="col-12 col-lg-6">
          <RouterLink
            class="card showtime-card h-100 text-decoration-none text-reset"
            :to="`/movies/${movie.movie_id}`"
          >
            <h3 class="showtime-card-title">
              <span class="showtime-card-star" aria-hidden="true">★</span>
              {{ movie.movie_name }}
            </h3>
            <div class="showtime-card-body">
              <img
                class="showtime-poster"
                :src="movie.image_url"
                :alt="movie.movie_name"
              />
              <div class="showtime-card-meta">
                <p
                  v-if="!timesFor(movie.movie_id).length"
                  class="text-secondary small mb-0"
                >
                  這天沒有場次。
                </p>
                <ul v-else class="showtime-times">
                  <li
                    v-for="row in timesFor(movie.movie_id)"
                    :key="row.showing_id"
                  >
                    {{ formatShowtime(row.showtime) }}
                  </li>
                </ul>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>

      <h2 class="h5 mt-4 mb-3">特典</h2>
      <p v-if="!benefits.length" class="text-secondary">這間影城沒有特典。</p>
      <div v-else class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>電影</th>
              <th>特典</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in benefits" :key="row.movie_id">
              <td>
                <RouterLink :to="`/movies/${row.movie_id}`">{{ row.movie_name }}</RouterLink>
              </td>
              <td>{{ row.benefit_name }}</td>
              <td>{{ row.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="benefitUpdatedAt" class="text-secondary small mt-3 mb-0">
        特典狀況最後更新時間 {{ formatDateTime(benefitUpdatedAt) }}
      </p>
    </div>
  </main>
</template>
