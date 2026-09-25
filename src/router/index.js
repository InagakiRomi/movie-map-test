import { createRouter, createWebHistory } from 'vue-router'
import MapView from '@/views/MapView.vue'
import MoviesView from '@/views/MoviesView.vue'
import MovieDetailView from '@/views/MovieDetailView.vue'
import CinemasView from '@/views/CinemasView.vue'
import CinemaDetailView from '@/views/CinemaDetailView.vue'
import CinemaSiteView from '@/views/CinemaSiteView.vue'
import MoviesAdminView from '@/views/admin/MoviesAdminView.vue'
import MovieFormView from '@/views/admin/MovieFormView.vue'
import CinemasAdminView from '@/views/admin/CinemasAdminView.vue'
import CinemaFormView from '@/views/admin/CinemaFormView.vue'
import ShowtimesAdminView from '@/views/admin/ShowtimesAdminView.vue'
import ShowtimeFormView from '@/views/admin/ShowtimeFormView.vue'
import CrawlerView from '@/views/admin/CrawlerView.vue'
import CrawlerLogsView from '@/views/admin/CrawlerLogsView.vue'
import CrawlerOverridesView from '@/views/admin/CrawlerOverridesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/map' },
    { path: '/map', name: 'map', component: MapView },
    { path: '/movies', name: 'movies', component: MoviesView },
    { path: '/movies/:movieId', name: 'movie-detail', component: MovieDetailView },
    { path: '/cinemas', name: 'cinemas', component: CinemasView },
    { path: '/cinemas/:cinemaId', name: 'cinema-detail', component: CinemaDetailView },
    { path: '/cinema-site', name: 'cinema-site', component: CinemaSiteView },
    { path: '/admin/movies', name: 'admin-movies', component: MoviesAdminView },
    { path: '/admin/movies/new', name: 'admin-movie-new', component: MovieFormView },
    { path: '/admin/movies/:movieId/edit', name: 'admin-movie-edit', component: MovieFormView },
    { path: '/admin/cinemas', name: 'admin-cinemas', component: CinemasAdminView },
    { path: '/admin/cinemas/new', name: 'admin-cinema-new', component: CinemaFormView },
    { path: '/admin/cinemas/:cinemaId/edit', name: 'admin-cinema-edit', component: CinemaFormView },
    { path: '/admin/showtimes', name: 'admin-showtimes', component: ShowtimesAdminView },
    { path: '/admin/showtimes/new', name: 'admin-showtime-new', component: ShowtimeFormView },
    { path: '/admin/showtimes/:showingId/edit', name: 'admin-showtime-edit', component: ShowtimeFormView },
    { path: '/admin/crawler-logs', name: 'admin-crawler-logs', component: CrawlerLogsView },
    { path: '/admin/crawler', name: 'admin-crawler', component: CrawlerView },
    { path: '/admin/crawler-overrides', name: 'admin-crawler-overrides', component: CrawlerOverridesView },
  ],
})

export default router
