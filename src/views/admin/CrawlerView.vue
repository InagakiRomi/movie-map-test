<script setup>
import { nextTick, ref } from "vue";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const { Modal } = bootstrap;
import { useCatalogStore } from "@/stores/catalog";

const catalog = useCatalogStore();
const modalEl = ref(null);
const modalTitle = ref("");
const modalLines = ref([]);

const actions = [
  {
    kind: "movie",
    label: "爬蟲電影",
    hint: "去抓新上映的電影，也會嘗試更新既有欄位。已鎖定的欄位只把新值送去審核。",
  },
  {
    kind: "cinema",
    label: "爬蟲影城",
    hint: "去抓影城地址、上映與特典變更。已鎖定的欄位不會直接覆蓋正式資料。",
  },
  {
    kind: "showtimes",
    label: "爬蟲場次",
    hint: "去抓新的放映時刻，也會嘗試更新既有場次。已鎖定的時間只寫入待審核。",
  },
];

async function run(kind) {
  const result = catalog.runCrawler(kind);
  modalTitle.value = result.title;
  modalLines.value = result.lines;
  await nextTick();
  Modal.getOrCreateInstance(modalEl.value).show();
}
</script>

<template>
  <main class="container py-4">
    <h1 class="h3">爬蟲同步</h1>
    <p class="text-secondary">
      選一種資料去同步。沒有鎖定的欄位會直接寫入；已鎖定的欄位改把最新爬蟲值送到
      <RouterLink to="/admin/crawler-overrides">爬蟲覆蓋審核</RouterLink>。
    </p>
    <div class="row g-3">
      <div v-for="action in actions" :key="action.kind" class="col-md-4">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h2 class="h5">{{ action.label }}</h2>
            <p class="text-secondary flex-grow-1">{{ action.hint }}</p>
            <button class="btn btn-mm" type="button" @click="run(action.kind)">
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      ref="modalEl"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="crawlerResultTitle"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="crawlerResultTitle" class="modal-title h5">
              {{ modalTitle }}
            </h2>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="關閉"
            ></button>
          </div>
          <div class="modal-body">
            <ul class="mb-0">
              <li v-for="(line, index) in modalLines" :key="index">
                {{ line }}
              </li>
            </ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-mm" data-bs-dismiss="modal">
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
