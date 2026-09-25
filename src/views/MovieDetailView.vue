<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useCatalogStore } from "@/stores/catalog";
import { benefitStatusText, formatDateTime, todayKey } from "@/utils/format";

const route = useRoute();
const catalog = useCatalogStore();
const date = ref(todayKey());

const movie = computed(() => catalog.movieById(route.params.movieId));
const cinemas = computed(() =>
  movie.value
    ? catalog.cinemasForMovie(movie.value.movie_id, { status: "SHOWING" })
    : [],
);
const showtimes = computed(() =>
  movie.value
    ? catalog
        .listShowtimes({ movieId: movie.value.movie_id, date: date.value })
        .filter((row) => row.is_active)
    : [],
);

function timesFor(cinemaId) {
  return showtimes.value.filter((row) => row.cinema_id === cinemaId);
}

const cinemasOnDate = computed(() =>
  cinemas.value.filter((cinema) => timesFor(cinema.cinema_id).length),
);

function formatShowtime(value) {
  return new Date(value).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const benefits = computed(() =>
  cinemas.value
    .filter((cinema) => cinema.link.benefit_id)
    .map((cinema) => ({
      cinema_id: cinema.cinema_id,
      cinema_name: cinema.cinema_name,
      benefit_name: catalog.benefitById(cinema.link.benefit_id)?.benefit_name || "未知特典",
      status: benefitStatusText(cinema.link.benefit_status),
      updated_at: cinema.link.updated_at,
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
    <RouterLink class="small" to="/movies">回電影列表</RouterLink>
    <p v-if="!movie" class="mt-3">找不到這部電影。</p>
    <div v-else class="mt-3">
      <div class="d-flex gap-3 align-items-start">
        <img
          class="showtime-poster rounded"
          :src="movie.image_url"
          :alt="movie.movie_name"
        />
        <h1 class="h3 mb-0">{{ movie.movie_name }}</h1>
      </div>

      <div class="d-flex flex-wrap align-items-end gap-2 mt-4 mb-3">
        <h2 class="h5 mb-0">場次</h2>
        <input
          v-model="date"
          class="form-control w-auto"
          type="date"
          aria-label="場次日期"
        />
      </div>
      <p v-if="!cinemas.length" class="text-secondary">這部電影目前還沒有上映。</p>
      <p v-else-if="!cinemasOnDate.length" class="text-secondary">這天還沒有影城排片。</p>
      <div v-else class="row g-3">
        <div v-for="cinema in cinemasOnDate" :key="cinema.cinema_id" class="col-12 col-lg-6">
          <RouterLink
            class="card showtime-card h-100 text-decoration-none text-reset"
            :to="`/cinemas/${cinema.cinema_id}`"
          >
            <h3 class="showtime-card-title">
              <span class="showtime-card-star" aria-hidden="true">★</span>
              {{ cinema.cinema_name }}
            </h3>
            <div class="showtime-card-body">
              <div class="showtime-card-meta">
                <p class="text-secondary small mb-2">{{ cinema.address }}</p>
                <ul class="showtime-times">
                  <li
                    v-for="row in timesFor(cinema.cinema_id)"
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
      <p v-if="!benefits.length" class="text-secondary">這部電影沒有特典。</p>
      <div v-else class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>影城</th>
              <th>特典</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in benefits" :key="row.cinema_id">
              <td>
                <RouterLink :to="`/cinemas/${row.cinema_id}`">{{ row.cinema_name }}</RouterLink>
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
