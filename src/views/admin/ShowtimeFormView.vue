<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import FieldLock from "@/components/FieldLock.vue";
import { useCatalogStore } from "@/stores/catalog";
import {
  formatDateTime,
  fromDateTimeLocal,
  showtimeStatusText,
  toDateTimeLocal,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const isEdit = computed(() => route.name === "admin-showtime-edit");
const showtime = computed(() =>
  isEdit.value ? catalog.showtimeById(route.params.showingId) : null,
);
const error = ref("");
const form = reactive({
  movie_id: "",
  cinema_id: "",
  showtime: "",
});
const locks = reactive({
  movie_id: false,
  cinema_id: false,
  showtime: false,
});
const statusText = computed(() =>
  form.showtime ? showtimeStatusText(fromDateTimeLocal(form.showtime)) : "",
);

watch(
  showtime,
  (value) => {
    if (!value) {
      locks.movie_id = false;
      locks.cinema_id = false;
      locks.showtime = false;
      return;
    }
    form.movie_id = value.movie_id;
    form.cinema_id = value.cinema_id;
    form.showtime = toDateTimeLocal(value.showtime);
    locks.movie_id = catalog.isFieldLocked(
      "SHOWTIME",
      value.showing_id,
      "movie_id",
    );
    locks.cinema_id = catalog.isFieldLocked(
      "SHOWTIME",
      value.showing_id,
      "cinema_id",
    );
    locks.showtime = catalog.isFieldLocked(
      "SHOWTIME",
      value.showing_id,
      "showtime",
    );
  },
  { immediate: true },
);

function save() {
  error.value = "";
  const payload = {
    ...form,
    showtime: fromDateTimeLocal(form.showtime),
  };
  const result = isEdit.value
    ? catalog.updateShowtime(route.params.showingId, payload, locks)
    : catalog.createShowtime(payload, locks);
  if (result.error) {
    error.value = result.error;
    return;
  }
  router.push("/admin/showtimes");
}
</script>

<template>
  <main class="container py-4">
    <RouterLink class="small" to="/admin/showtimes">回場次管理</RouterLink>
    <h1 class="h3 mt-2">{{ isEdit ? "修改場次" : "新增場次" }}</h1>
    <p v-if="showtime" class="text-secondary small">
      建立時間：{{ formatDateTime(showtime.created_at) }}　修改時間：{{
        formatDateTime(showtime.updated_at)
      }}
    </p>
    <p v-if="isEdit && !showtime">找不到這筆場次。</p>
    <template v-else>
    <p class="text-secondary">
      勾選鎖定才會建立覆蓋紀錄。沒有鎖定的欄位，下次爬蟲仍會直接更新。
    </p>
    <form class="col-lg-8" @submit.prevent="save">
      <div class="mb-3">
        <label class="form-label" for="st-movie">電影</label>
        <select
          id="st-movie"
          v-model="form.movie_id"
          class="form-select"
          required
        >
          <option disabled value="">請選擇</option>
          <option
            v-for="movie in catalog.movies"
            :key="movie.movie_id"
            :value="movie.movie_id"
          >
            {{ movie.movie_name }}
          </option>
        </select>
        <FieldLock id="lock-st-movie" v-model="locks.movie_id" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="st-cinema">影城</label>
        <select
          id="st-cinema"
          v-model="form.cinema_id"
          class="form-select"
          required
        >
          <option disabled value="">請選擇</option>
          <option
            v-for="cinema in catalog.cinemas"
            :key="cinema.cinema_id"
            :value="cinema.cinema_id"
          >
            {{ cinema.cinema_name }}
          </option>
        </select>
        <FieldLock id="lock-st-cinema" v-model="locks.cinema_id" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="st-time">場次</label>
        <input
          id="st-time"
          v-model="form.showtime"
          class="form-control"
          type="datetime-local"
          required
        />
        <FieldLock id="lock-st-time" v-model="locks.showtime" />
      </div>
      <p v-if="statusText" class="text-secondary">
        狀態：{{ statusText }}。依場次自動判斷，無法手動調整。
      </p>
      <div v-if="error" class="alert alert-warning">{{ error }}</div>
      <button class="btn btn-mm" type="submit">儲存</button>
    </form>
    </template>
  </main>
</template>
