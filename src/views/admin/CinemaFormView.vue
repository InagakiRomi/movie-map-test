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
const isEdit = computed(() => route.name === 'admin-cinema-edit')
const cinema = computed(() => (isEdit.value ? catalog.cinemaById(route.params.cinemaId) : null))
const form = reactive({
  cinema_name: '',
  address: '',
  latitude: '',
  longitude: '',
  is_active: true,
})
const locks = reactive({
  cinema_name: false,
  address: false,
  latitude: false,
  longitude: false,
  is_active: false,
})

watch(
  cinema,
  (value) => {
    if (!value) {
      locks.cinema_name = false
      locks.address = false
      locks.latitude = false
      locks.longitude = false
      locks.is_active = false
      return
    }
    form.cinema_name = value.cinema_name
    form.address = value.address
    form.latitude = value.latitude
    form.longitude = value.longitude
    form.is_active = value.is_active
    locks.cinema_name = catalog.isFieldLocked('CINEMA', value.cinema_id, 'cinema_name')
    locks.address = catalog.isFieldLocked('CINEMA', value.cinema_id, 'address')
    locks.latitude = catalog.isFieldLocked('CINEMA', value.cinema_id, 'latitude')
    locks.longitude = catalog.isFieldLocked('CINEMA', value.cinema_id, 'longitude')
    locks.is_active = catalog.isFieldLocked('CINEMA', value.cinema_id, 'is_active')
  },
  { immediate: true },
)

function save() {
  if (isEdit.value) {
    catalog.updateCinema(route.params.cinemaId, form, locks)
    router.push('/admin/cinemas')
    return
  }
  const created = catalog.createCinema(form, locks)
  router.push(`/admin/cinemas/${created.cinema_id}/edit`)
}
</script>

<template>
  <main class="container py-4">
    <RouterLink class="small" to="/admin/cinemas">回影城管理</RouterLink>
    <h1 class="h3 mt-2">{{ isEdit ? '修改影城' : '新增影城' }}</h1>
    <p v-if="cinema" class="text-secondary small">
      建立時間：{{ formatDateTime(cinema.created_at) }}　修改時間：{{ formatDateTime(cinema.updated_at) }}
    </p>
    <p v-if="isEdit && !cinema">找不到這間影城。</p>
    <template v-else>
    <p class="text-secondary">
      勾選鎖定才會建立覆蓋紀錄。沒有鎖定的欄位，下次爬蟲仍會直接更新。
    </p>
    <form class="col-lg-8" @submit.prevent="save">
      <div class="mb-3">
        <label class="form-label" for="cinema-name">影城名稱</label>
        <input id="cinema-name" v-model="form.cinema_name" class="form-control" required maxlength="64" />
        <FieldLock id="lock-cinema-name" v-model="locks.cinema_name" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="cinema-address">地址</label>
        <input id="cinema-address" v-model="form.address" class="form-control" required maxlength="256" />
        <FieldLock id="lock-cinema-address" v-model="locks.address" />
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label" for="cinema-lat">緯度</label>
          <input id="cinema-lat" v-model="form.latitude" class="form-control" type="number" step="0.0000001" required />
          <FieldLock id="lock-cinema-lat" v-model="locks.latitude" />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label" for="cinema-lng">經度</label>
          <input id="cinema-lng" v-model="form.longitude" class="form-control" type="number" step="0.0000001" required />
          <FieldLock id="lock-cinema-lng" v-model="locks.longitude" />
        </div>
      </div>
      <div class="mb-3">
        <div class="form-check">
          <input id="cinema-active" v-model="form.is_active" class="form-check-input" type="checkbox" />
          <label class="form-check-label" for="cinema-active">顯示</label>
        </div>
        <FieldLock id="lock-cinema-active" v-model="locks.is_active" />
      </div>
      <button class="btn btn-mm" type="submit">儲存</button>
    </form>
    </template>
    <LinkManager v-if="cinema" :cinema-id="cinema.cinema_id" />
  </main>
</template>
