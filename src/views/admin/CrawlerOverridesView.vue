<script setup>
import { computed, nextTick, ref } from "vue";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useCatalogStore } from "@/stores/catalog";
import { ENTITY_LABELS } from "@/utils/overrides";
import { formatDateTime } from "@/utils/format";

const { Modal } = bootstrap;
const catalog = useCatalogStore();
const entityType = ref("");
const crawlerValue = ref("");
const modalEl = ref(null);
const step = ref("keep");
const activeRow = ref(null);
const errorText = ref("");

const freshCount = computed(
  () =>
    catalog
      .listCrawlerOverrides({ type: entityType.value })
      .filter((row) => row.crawler_value != null).length,
);

const rows = computed(() =>
  catalog.listCrawlerOverrides({ type: entityType.value }).filter((row) => {
    if (crawlerValue.value === "yes") return row.crawler_value != null;
    if (crawlerValue.value === "no") return row.crawler_value == null;
    return true;
  }),
);

function hideModal() {
  Modal.getOrCreateInstance(modalEl.value).hide();
}

async function showModal(row, nextStep) {
  activeRow.value = row;
  step.value = nextStep;
  errorText.value = "";
  await nextTick();
  Modal.getOrCreateInstance(modalEl.value).show();
}

function openReview(row) {
  showModal(row, "keep");
}

function openRestore(row) {
  showModal(row, "unlock");
}

function chooseKeep(keep) {
  const row = activeRow.value;
  if (!row) return;
  if (!keep) {
    catalog.keepManualOverride(row.crawler_override_id);
    hideModal();
    return;
  }
  const result = catalog.applyLatestCrawlerValue(row.crawler_override_id);
  if (result.error) {
    errorText.value = result.error;
    step.value = "error";
    return;
  }
  step.value = "restore";
}

function chooseRestore(restore) {
  const row = activeRow.value;
  if (restore && row) catalog.restoreAutoSync(row.crawler_override_id);
  hideModal();
}
</script>

<template>
  <main class="container py-4">
    <div
      class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"
    >
      <div>
        <h1 class="h3 mb-1">爬蟲覆蓋審核</h1>
        <p class="text-secondary mb-0">
          鎖定中的欄位不會被爬蟲直接改掉。有最新爬蟲值時，先決定要不要保留；選了保留，才會再問要不要恢復自動同步。
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <select
          v-model="entityType"
          class="form-select w-auto"
          aria-label="資料類型"
        >
          <option value="">全部類型</option>
          <option
            v-for="(label, type) in ENTITY_LABELS"
            :key="type"
            :value="type"
          >
            {{ label }}
          </option>
        </select>
        <select
          v-model="crawlerValue"
          class="form-select w-auto"
          aria-label="最新爬蟲值"
        >
          <option value="">全部</option>
          <option value="yes">
            有最新爬蟲值{{ freshCount ? `（${freshCount}）` : "" }}
          </option>
          <option value="no">沒有最新爬蟲值</option>
        </select>
      </div>
    </div>

    <p v-if="!rows.length" class="text-secondary">
      沒有符合條件的鎖定欄位。到電影、影城、場次或上映關聯的編輯畫面勾選「鎖定，不讓爬蟲覆蓋」後，爬蟲抓到的新值會出現在這裡。
    </p>
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>類型</th>
            <th>對象</th>
            <th>欄位</th>
            <th>目前正式值</th>
            <th>最新爬蟲值</th>
            <th>更新時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.crawler_override_id"
            :class="{ 'table-warning': row.pending }"
          >
            <td class="text-nowrap">{{ row.entity_type_label }}</td>
            <td>{{ row.entity_label }}</td>
            <td class="text-nowrap">{{ row.field_label }}</td>
            <td class="text-break">{{ row.official_text }}</td>
            <td class="text-break">
              <span
                v-if="row.crawler_value != null"
                class="crawler-alert me-1"
                title="有最新爬蟲值"
              >
                新
              </span>
              {{ row.crawler_text }}
            </td>
            <td class="text-nowrap">{{ formatDateTime(row.updated_at) }}</td>
            <td class="text-end text-nowrap">
              <RouterLink
                v-if="row.edit_path"
                class="btn btn-sm btn-outline-dark me-2"
                :to="row.edit_path"
              >
                查看
              </RouterLink>
              <button
                class="btn btn-sm btn-outline-danger me-2"
                type="button"
                @click="openRestore(row)"
              >
                恢復自動同步
              </button>
              <button
                v-if="row.crawler_value != null"
                class="btn btn-sm btn-mm"
                type="button"
                @click="openReview(row)"
              >
                審核
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      ref="modalEl"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="overrideReviewTitle"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="overrideReviewTitle" class="modal-title h5">
              {{
                step === "restore" || step === "unlock"
                  ? "要恢復自動同步嗎？"
                  : step === "error"
                    ? "無法保留最新值"
                    : "要保留最新值嗎？"
              }}
            </h2>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="關閉"
            ></button>
          </div>
          <div v-if="activeRow && step === 'keep'" class="modal-body">
            <p class="mb-2">
              「{{ activeRow.entity_label }}」的{{ activeRow.field_label }}
            </p>
            <p class="mb-1">目前正式值：{{ activeRow.official_text }}</p>
            <p class="mb-0">最新爬蟲值：{{ activeRow.crawler_text }}</p>
          </div>
          <div v-else-if="activeRow && step === 'restore'" class="modal-body">
            <p class="mb-0">
              已把「{{ activeRow.entity_label }}」的{{ activeRow.field_label }}改成最新爬蟲值。恢復後，下次爬蟲會直接覆蓋這個欄位。
            </p>
          </div>
          <div v-else-if="activeRow && step === 'unlock'" class="modal-body">
            <p class="mb-0">
              恢復後，「{{ activeRow.entity_label }}」的{{ activeRow.field_label }}會解除鎖定，下次爬蟲會直接覆蓋這個欄位。
            </p>
          </div>
          <div v-else class="modal-body">
            <p class="mb-0">{{ errorText }}</p>
          </div>
          <div class="modal-footer">
            <template v-if="step === 'keep'">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="chooseKeep(false)"
              >
                不保留
              </button>
              <button type="button" class="btn btn-mm" @click="chooseKeep(true)">
                保留最新值
              </button>
            </template>
            <template v-else-if="step === 'restore' || step === 'unlock'">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="chooseRestore(false)"
              >
                {{ step === "unlock" ? "取消" : "繼續鎖定" }}
              </button>
              <button type="button" class="btn btn-mm" @click="chooseRestore(true)">
                恢復自動同步
              </button>
            </template>
            <button
              v-else
              type="button"
              class="btn btn-mm"
              data-bs-dismiss="modal"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
