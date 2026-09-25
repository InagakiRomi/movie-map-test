<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radiusKm: { type: Number, required: true },
  cinemas: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  userLat: { type: Number, default: null },
  userLng: { type: Number, default: null },
  zoom: { type: Number, default: 14 },
  showCircle: { type: Boolean, default: true },
  fitBounds: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'moveend'])

const mapEl = ref(null)
let map
let markerLayer
let circle
let userMarker
let resizeObserver

function pinIcon(cinema) {
  const active = cinema.cinema_id === props.selectedId
  const statusClass =
    cinema.pinStatus === 'EXHAUSTED' ? ' is-exhausted' : cinema.pinStatus === 'UNKNOWN' ? ' is-unknown' : ''
  const activeClass = active ? (cinema.pinStatus ? ' is-selected' : ' is-active') : ''
  return L.divIcon({
    className: 'mm-pin',
    html: `<span class="mm-pin-dot${statusClass}${activeClass}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function frameMarkers() {
  if (!map || !props.fitBounds) return
  const points = props.cinemas
    .filter((cinema) => cinema.latitude != null && cinema.longitude != null)
    .map((cinema) => [Number(cinema.latitude), Number(cinema.longitude)])
  if (!points.length) return
  if (points.length === 1) {
    map.setView(points[0], 14)
    return
  }
  map.fitBounds(points, { padding: [32, 32], maxZoom: 13 })
}

function renderMarkers() {
  if (!markerLayer) return
  markerLayer.clearLayers()
  for (const cinema of props.cinemas) {
    const marker = L.marker([cinema.latitude, cinema.longitude], {
      icon: pinIcon(cinema),
      title: cinema.cinema_name,
    })
    if (cinema.popupHtml) {
      marker.bindPopup(cinema.popupHtml, { className: 'mm-popup', maxWidth: 280, minWidth: 180 })
    }
    marker.on('click', () => emit('select', cinema.cinema_id))
    marker.addTo(markerLayer)
  }
  frameMarkers()
}

function renderCircle() {
  if (!map) return
  if (!props.showCircle) {
    if (circle) {
      map.removeLayer(circle)
      circle = null
    }
    return
  }
  const options = {
    radius: props.radiusKm * 1000,
    color: '#b45309',
    weight: 1,
    fillColor: '#b45309',
    fillOpacity: 0.08,
  }
  if (!circle) {
    circle = L.circle([props.lat, props.lng], options).addTo(map)
    return
  }
  circle.setLatLng([props.lat, props.lng])
  circle.setRadius(options.radius)
}

function renderUser() {
  if (!map) return
  if (userMarker) {
    map.removeLayer(userMarker)
    userMarker = null
  }
  if (props.userLat == null || props.userLng == null) return
  userMarker = L.circleMarker([props.userLat, props.userLng], {
    radius: 7,
    color: '#1d4ed8',
    weight: 2,
    fillColor: '#93c5fd',
    fillOpacity: 0.95,
  })
    .bindTooltip('目前位置', { direction: 'top' })
    .addTo(map)
}

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: true }).setView([props.lat, props.lng], props.zoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  map.on('moveend', () => {
    const center = map.getCenter()
    emit('moveend', { lat: center.lat, lng: center.lng })
  })
  renderCircle()
  renderMarkers()
  renderUser()
  resizeObserver = new ResizeObserver(() => map.invalidateSize())
  resizeObserver.observe(mapEl.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})

watch(
  () => [props.lat, props.lng],
  ([lat, lng]) => {
    if (!map || props.fitBounds) return
    map.setView([lat, lng], map.getZoom())
    renderCircle()
  },
)

watch(
  () => [props.radiusKm, props.showCircle],
  () => renderCircle(),
)

watch(
  () => [props.cinemas, props.selectedId],
  () => renderMarkers(),
  { deep: true },
)

watch(
  () => [props.userLat, props.userLng],
  () => renderUser(),
)

watch(
  () => props.selectedId,
  (id) => {
    const cinema = props.cinemas.find((item) => item.cinema_id === id)
    if (cinema && map) map.panTo([cinema.latitude, cinema.longitude])
  },
)
</script>

<template>
  <div ref="mapEl" class="map-canvas"></div>
</template>
