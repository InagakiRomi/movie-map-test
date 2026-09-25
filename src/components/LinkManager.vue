<script setup>
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { benefitStatusText, formatDateTime } from '@/utils/format'

const props = defineProps({
  cinemaId: { type: Number, default: null },
  movieId: { type: Number, default: null },
})

const catalog = useCatalogStore()
const targetId = ref('')
const benefitId = ref('')
const benefitStatus = ref('UNKNOWN')
const isShowing = ref(true)
const message = ref('')

const rows = computed(() => {
  if (props.cinemaId) {
    return catalog.linksForCinema(props.cinemaId).map((link) => ({
      ...link,
      title: catalog.movieById(link.movie_id)?.movie_name || '未知電影',
    }))
  }
  return catalog.linksForMovie(props.movieId).map((link) => ({
    ...link,
    title: catalog.cinemaById(link.cinema_id)?.cinema_name || '未知影城',
  }))
})

const choices = computed(() => {
  if (props.cinemaId) {
    const used = new Set(rows.value.map((row) => row.movie_id))
    return catalog.movies.filter((movie) => !used.has(movie.movie_id))
  }
  const used = new Set(rows.value.map((row) => row.cinema_id))
  return catalog.cinemas.filter((cinema) => !used.has(cinema.cinema_id))
})

function addLink() {
  message.value = ''
  const payload = props.cinemaId
    ? { cinema_id: props.cinemaId, movie_id: targetId.value }
    : { cinema_id: targetId.value, movie_id: props.movieId }
  const result = catalog.createLink({
    ...payload,
    benefit_id: benefitId.value || null,
    benefit_status: benefitStatus.value,
    is_showing: isShowing.value,
  })
  message.value = result.error || '已建立關聯'
  if (!result.error) targetId.value = ''
}

function toggleShowing(row) {
  catalog.updateLink(row.cinema_id, row.movie_id, { is_showing: !row.is_showing })
}

function changeBenefit(row, event) {
  const value = event.target.value
  catalog.updateLink(row.cinema_id, row.movie_id, {
    benefit_id: value ? Number(value) : null,
    benefit_status: value ? row.benefit_status || 'UNKNOWN' : 'UNKNOWN',
  })
}

function changeStatus(row, event) {
  catalog.updateLink(row.cinema_id, row.movie_id, { benefit_status: event.target.value })
}

function removeLink(row) {
  if (!window.confirm(`移除「${row.title}」的關聯？`)) return
  catalog.deleteLink(row.cinema_id, row.movie_id)
}
</script>

<template>
  <div class="mt-4">
    <h2 class="h5">上映關聯</h2>
    <p class="text-secondary small">
      特典、庫存與上映狀態可各自鎖定。鎖定後爬蟲只會把新值送到爬蟲覆蓋審核，不會直接改這裡的資料。
    </p>
    <div class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>{{ cinemaId ? '電影' : '影城' }}</th>
            <th>上映</th>
            <th>特典</th>
            <th>庫存</th>
            <th>建立時間</th>
            <th>修改時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7" class="text-secondary">尚未建立關聯</td>
          </tr>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.title }}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary" type="button" @click="toggleShowing(row)">
                {{ row.is_showing ? '上映中' : '未上映' }}
              </button>
              <div class="form-check mt-1">
                <input
                  :id="`lock-showing-${row.id}`"
                  class="form-check-input"
                  type="checkbox"
                  :checked="catalog.isFieldLocked('LINK', row.id, 'is_showing')"
                  @change="catalog.setFieldLocked('LINK', row.id, 'is_showing', $event.target.checked)"
                />
                <label class="form-check-label small" :for="`lock-showing-${row.id}`">鎖定</label>
              </div>
            </td>
            <td>
              <select class="form-select form-select-sm" :value="row.benefit_id || ''" @change="changeBenefit(row, $event)">
                <option value="">無</option>
                <option v-for="benefit in catalog.benefits" :key="benefit.benefit_id" :value="benefit.benefit_id">
                  {{ benefit.benefit_name }}
                </option>
              </select>
              <div class="form-check mt-1">
                <input
                  :id="`lock-benefit-${row.id}`"
                  class="form-check-input"
                  type="checkbox"
                  :checked="catalog.isFieldLocked('LINK', row.id, 'benefit_id')"
                  @change="catalog.setFieldLocked('LINK', row.id, 'benefit_id', $event.target.checked)"
                />
                <label class="form-check-label small" :for="`lock-benefit-${row.id}`">鎖定</label>
              </div>
            </td>
            <td>
              <select
                class="form-select form-select-sm"
                :value="row.benefit_status"
                :disabled="!row.benefit_id"
                @change="changeStatus(row, $event)"
              >
                <option value="UNKNOWN">{{ benefitStatusText('UNKNOWN') }}</option>
                <option value="IN_STOCK">{{ benefitStatusText('IN_STOCK') }}</option>
                <option value="EXHAUSTED">{{ benefitStatusText('EXHAUSTED') }}</option>
              </select>
              <div class="form-check mt-1">
                <input
                  :id="`lock-stock-${row.id}`"
                  class="form-check-input"
                  type="checkbox"
                  :checked="catalog.isFieldLocked('LINK', row.id, 'benefit_status')"
                  @change="catalog.setFieldLocked('LINK', row.id, 'benefit_status', $event.target.checked)"
                />
                <label class="form-check-label small" :for="`lock-stock-${row.id}`">鎖定</label>
              </div>
            </td>
            <td class="text-nowrap">{{ formatDateTime(row.created_at) }}</td>
            <td class="text-nowrap">{{ formatDateTime(row.updated_at) }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger" type="button" @click="removeLink(row)">移除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <form class="row g-2 align-items-end" @submit.prevent="addLink">
      <div class="col-md-4">
        <label class="form-label">{{ cinemaId ? '電影' : '影城' }}</label>
        <select v-model="targetId" class="form-select" required>
          <option disabled value="">請選擇</option>
          <option
            v-for="item in choices"
            :key="item.movie_id || item.cinema_id"
            :value="item.movie_id || item.cinema_id"
          >
            {{ item.movie_name || item.cinema_name }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label">特典</label>
        <select v-model="benefitId" class="form-select">
          <option value="">無</option>
          <option v-for="benefit in catalog.benefits" :key="benefit.benefit_id" :value="String(benefit.benefit_id)">
            {{ benefit.benefit_name }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <label class="form-label">庫存</label>
        <select v-model="benefitStatus" class="form-select" :disabled="!benefitId">
          <option value="UNKNOWN">未知</option>
          <option value="IN_STOCK">有庫存</option>
          <option value="EXHAUSTED">已換完</option>
        </select>
      </div>
      <div class="col-md-2">
        <div class="form-check mb-2">
          <input id="link-showing" v-model="isShowing" class="form-check-input" type="checkbox" />
          <label class="form-check-label" for="link-showing">上映中</label>
        </div>
      </div>
      <div class="col-md-1">
        <button class="btn btn-mm w-100" type="submit" :disabled="!choices.length">新增</button>
      </div>
      <p v-if="message" class="col-12 small mb-0">{{ message }}</p>
    </form>
  </div>
</template>
