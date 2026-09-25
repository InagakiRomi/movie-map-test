const CREATED = '2026-09-01T08:00:00'

function poster(seed) {
  return `https://picsum.photos/seed/${seed}/400/560`
}

export function crawlerTemplates(kind) {
  const movieCinema = [
    {
      dedupe_key: 'movie:潮汐來信',
      entity: 'movie',
      action: 'CREATE',
      summary: '新電影：潮汐來信',
      before: null,
      after: {
        movie_name: '潮汐來信',
        image_url: poster('tide-letter'),
        is_active: true,
      },
    },
    {
      dedupe_key: 'cinema:104:address',
      entity: 'cinema',
      action: 'UPDATE',
      summary: '信義星空影城地址異動',
      before: {
        cinema_id: 104,
        cinema_name: '信義星空影城',
        address: '台北市信義區松壽路12號',
      },
      after: {
        cinema_id: 104,
        address: '台北市信義區松壽路22號',
        latitude: 25.0356,
        longitude: 121.5678,
      },
    },
    {
      dedupe_key: 'link:100:4',
      entity: 'link',
      action: 'CREATE',
      summary: '京站光年影城新增上映：夏日軌道',
      before: null,
      after: {
        cinema_id: 100,
        movie_id: 4,
        benefit_id: 3,
        benefit_status: 'IN_STOCK',
        is_showing: true,
      },
    },
    {
      dedupe_key: 'link:100:1:benefit_status',
      entity: 'link',
      action: 'UPDATE',
      summary: '京站光年影城《星塵旅人》特典庫存變更',
      before: {
        cinema_id: 100,
        movie_id: 1,
        benefit_status: 'IN_STOCK',
      },
      after: {
        cinema_id: 100,
        movie_id: 1,
        benefit_status: 'EXHAUSTED',
      },
    },
  ]

  const showtimes = [
    {
      dedupe_key: 'showtime:1:104:2026-09-26T21:40',
      entity: 'showtime',
      action: 'CREATE',
      summary: '新場次：星塵旅人 @ 信義星空影城 09/26 21:40',
      before: null,
      after: {
        movie_id: 1,
        cinema_id: 104,
        showtime: '2026-09-26T21:40:00',
        is_active: true,
      },
    },
    {
      dedupe_key: 'showtime:3:101:2026-09-27T21:40',
      entity: 'showtime',
      action: 'CREATE',
      summary: '新場次：城市邊緣 @ 西門巷口電影院 09/27 21:40',
      before: null,
      after: {
        movie_id: 3,
        cinema_id: 101,
        showtime: '2026-09-27T21:40:00',
        is_active: true,
      },
    },
  ]

  const movieUpdates = [
    {
      dedupe_key: 'movie:1:image_url',
      entity: 'movie',
      action: 'UPDATE',
      summary: '星塵旅人海報更新',
      before: { movie_id: 1 },
      after: {
        movie_id: 1,
        image_url: poster('stardust-traveler-new'),
      },
    },
  ]

  const showtimeUpdates = [
    {
      dedupe_key: 'showtime:1:104:2026-09-26T14:10',
      entity: 'showtime',
      action: 'UPDATE',
      summary: '星塵旅人 @ 信義星空影城 09/26 14:10 改時間',
      before: {
        movie_id: 1,
        cinema_id: 104,
        showtime: '2026-09-26T14:10:00',
      },
      after: {
        movie_id: 1,
        cinema_id: 104,
        showtime: '2026-09-26T22:15:00',
      },
    },
  ]

  const movies = movieCinema.filter((item) => item.entity === 'movie')
  const cinemas = movieCinema.filter((item) => item.entity !== 'movie')
  if (kind === 'movie') return [...movies, ...movieUpdates]
  if (kind === 'cinema') return cinemas
  if (kind === 'showtimes') return [...showtimes, ...showtimeUpdates]
  return []
}

const links = [
  { cinema_id: 100, movie_id: 1, benefit_id: 1, benefit_status: 'IN_STOCK', is_showing: true },
  { cinema_id: 100, movie_id: 2, benefit_id: 2, benefit_status: 'EXHAUSTED', is_showing: true },
  { cinema_id: 101, movie_id: 1, benefit_id: null, benefit_status: 'UNKNOWN', is_showing: true },
  { cinema_id: 101, movie_id: 3, benefit_id: 3, benefit_status: 'UNKNOWN', is_showing: true },
  { cinema_id: 102, movie_id: 2, benefit_id: 1, benefit_status: 'IN_STOCK', is_showing: true },
  { cinema_id: 102, movie_id: 4, benefit_id: null, benefit_status: 'UNKNOWN', is_showing: true },
  { cinema_id: 103, movie_id: 1, benefit_id: 1, benefit_status: 'IN_STOCK', is_showing: true },
  { cinema_id: 103, movie_id: 4, benefit_id: 2, benefit_status: 'EXHAUSTED', is_showing: true },
  { cinema_id: 104, movie_id: 1, benefit_id: 3, benefit_status: 'IN_STOCK', is_showing: true },
  { cinema_id: 104, movie_id: 3, benefit_id: null, benefit_status: 'UNKNOWN', is_showing: true },
  { cinema_id: 105, movie_id: 2, benefit_id: 1, benefit_status: 'IN_STOCK', is_showing: true },
  { cinema_id: 106, movie_id: 3, benefit_id: null, benefit_status: 'UNKNOWN', is_showing: true },
  { cinema_id: 106, movie_id: 4, benefit_id: 2, benefit_status: 'UNKNOWN', is_showing: false },
]

function buildShowtimes() {
  const dates = ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-30']
  const times = ['14:10', '19:10']
  const rows = []
  let showingId = 1
  for (const date of dates) {
    for (const link of links.filter((item) => item.is_showing)) {
      for (const time of times) {
        rows.push({
          showing_id: showingId,
          movie_id: link.movie_id,
          cinema_id: link.cinema_id,
          showtime: `${date}T${time}:00`,
          is_active: true,
          created_at: CREATED,
          updated_at: CREATED,
        })
        showingId += 1
      }
    }
  }
  return rows
}

const showtimes = buildShowtimes()

const crawlerLogs = [
  {
    crawler_log_id: 1,
    crawler_type: 'MOVIE',
    crawler_status: 'SUCCESS',
    message: '電影同步完成。新增電影「潮汐來信」，略過未變更 5 筆。',
    created_at: '2026-09-25T08:05:12',
  },
  {
    crawler_log_id: 2,
    crawler_type: 'CINEMA',
    crawler_status: 'SUCCESS',
    message: '影城同步完成。信義星空影城地址由松壽路 12 號更新為松壽路 22 號。',
    created_at: '2026-09-25T08:05:48',
  },
  {
    crawler_log_id: 3,
    crawler_type: 'SHOWTIME',
    crawler_status: 'SUCCESS',
    message: '場次同步完成。寫入 48 筆，其中 2 筆為新場次。',
    created_at: '2026-09-25T08:06:41',
  },
  {
    crawler_log_id: 4,
    crawler_type: 'MOVIE',
    crawler_status: 'SUCCESS',
    message: '電影同步完成。沒有新電影，既有片單皆未變更。',
    created_at: '2026-09-24T21:10:08',
  },
  {
    crawler_log_id: 5,
    crawler_type: 'CINEMA',
    crawler_status: 'FAILURE',
    message:
      'ConnectionResetError: [WinError 10054] 遠端主機已強制關閉連線。host=cinemas.example',
    created_at: '2026-09-24T21:10:40',
  },
  {
    crawler_log_id: 6,
    crawler_type: 'SHOWTIME',
    crawler_status: 'FAILURE',
    message:
      'HTTPError: 503 Service Unavailable。GET /api/showtimes?date=2026-09-26 body="upstream connect error"',
    created_at: '2026-09-24T21:11:22',
  },
  {
    crawler_log_id: 7,
    crawler_type: 'MOVIE',
    crawler_status: 'FAILURE',
    message:
      'JSONDecodeError: Expecting value: line 1 column 1 (char 0)。回應內容為 HTML 維護頁，無法解析電影清單。',
    created_at: '2026-09-24T09:15:33',
  },
  {
    crawler_log_id: 8,
    crawler_type: 'CINEMA',
    crawler_status: 'SUCCESS',
    message: '影城同步完成。京站光年影城新增上映：夏日軌道。',
    created_at: '2026-09-24T09:15:58',
  },
  {
    crawler_log_id: 9,
    crawler_type: 'SHOWTIME',
    crawler_status: 'SUCCESS',
    message: '場次同步完成。寫入 36 筆，略過 4 筆重複場次。',
    created_at: '2026-09-24T09:16:02',
  },
  {
    crawler_log_id: 10,
    crawler_type: 'MOVIE',
    crawler_status: 'SUCCESS',
    message: '電影同步完成。比對 5 部電影，沒有下架或更名。',
    created_at: '2026-09-23T20:40:18',
  },
  {
    crawler_log_id: 11,
    crawler_type: 'CINEMA',
    crawler_status: 'SUCCESS',
    message: '影城同步完成。沒有新的地址或上映變更。',
    created_at: '2026-09-23T20:41:47',
  },
  {
    crawler_log_id: 12,
    crawler_type: 'SHOWTIME',
    crawler_status: 'FAILURE',
    message:
      'ParseError: 場次時間格式錯誤 "09/26 21:40pm"。cinema_id=104 movie_id=1',
    created_at: '2026-09-23T12:02:11',
  },
  {
    crawler_log_id: 13,
    crawler_type: 'MOVIE',
    crawler_status: 'FAILURE',
    message:
      'TimeoutError: 電影清單頁請求超過 15000ms。url=https://cinemas.example/movies',
    created_at: '2026-09-22T18:24:40',
  },
  {
    crawler_log_id: 14,
    crawler_type: 'CINEMA',
    crawler_status: 'SUCCESS',
    message: '影城同步完成。西門巷口電影院上映清單沒有變更。',
    created_at: '2026-09-22T18:25:09',
  },
  {
    crawler_log_id: 15,
    crawler_type: 'SHOWTIME',
    crawler_status: 'SUCCESS',
    message: '場次同步完成。西門巷口電影院 09/27 寫入 6 筆。',
    created_at: '2026-09-22T18:26:31',
  },
]
const extraMovies = [
  ['霧中站台', 'platform-in-fog'],
  ['南風信', 'south-wind-letter'],
  ['玻璃海', 'glass-sea'],
  ['末班列車', 'last-train'],
  ['橘色雨季', 'orange-rain'],
  ['安靜的河', 'quiet-river'],
  ['月光裁縫', 'moonlight-tailor'],
  ['島嶼來信', 'island-letter'],
  ['夜間飛行', 'night-flight'],
  ['舊書店', 'old-bookshop'],
  ['平行街', 'parallel-street'],
  ['春雷之前', 'before-spring-thunder'],
].map(([movie_name, image], index) => ({
  movie_id: index + 6,
  movie_name,
  image_url: poster(image),
  is_active: true,
  created_at: CREATED,
  updated_at: CREATED,
}))

export const seed = {
  seedRevision: 4,
  nextMovieId: 18,
  nextCinemaId: 108,
  nextShowingId: showtimes.length + 1,
  nextLinkId: links.length + 1,
  nextReviewId: 1,
  nextOverrideId: 6,
  movies: [
    {
      movie_id: 1,
      movie_name: '星塵旅人',
      image_url: poster('stardust-traveler'),
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      movie_id: 2,
      movie_name: '深夜食堂物語',
      image_url: poster('midnight-diner'),
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      movie_id: 3,
      movie_name: '城市邊緣',
      image_url: poster('city-edge'),
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      movie_id: 4,
      movie_name: '夏日軌道',
      image_url: poster('summer-orbit'),
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      movie_id: 5,
      movie_name: '紙上王國',
      image_url: poster('paper-kingdom'),
      is_active: false,
      created_at: CREATED,
      updated_at: '2026-09-20T18:00:00',
    },
    ...extraMovies,
  ],
  cinemas: [
    {
      cinema_id: 100,
      cinema_name: '京站光年影城',
      address: '台北市大同區承德路一段1號',
      latitude: 25.0495,
      longitude: 121.5178,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 101,
      cinema_name: '西門巷口電影院',
      address: '台北市萬華區峨眉街52號',
      latitude: 25.0422,
      longitude: 121.507,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 102,
      cinema_name: '中山小宇宙影城',
      address: '台北市中山區南京西路16號',
      latitude: 25.0628,
      longitude: 121.5265,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 103,
      cinema_name: '華山紙本戲院',
      address: '台北市中正區八德路一段1號',
      latitude: 25.0443,
      longitude: 121.5294,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 104,
      cinema_name: '信義星空影城',
      address: '台北市信義區松壽路12號',
      latitude: 25.036,
      longitude: 121.5672,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 105,
      cinema_name: '公館夜讀電影院',
      address: '台北市中正區羅斯福路四段85號',
      latitude: 25.0148,
      longitude: 121.5342,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 106,
      cinema_name: '松山風鈴影城',
      address: '台北市松山區南京東路五段88號',
      latitude: 25.0492,
      longitude: 121.5785,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    },
    {
      cinema_id: 107,
      cinema_name: '大安森林戲院',
      address: '台北市大安區新生南路二段',
      latitude: 25.0265,
      longitude: 121.5355,
      is_active: false,
      created_at: CREATED,
      updated_at: '2026-09-18T12:00:00',
    },
  ],
  benefits: [
    { benefit_id: 1, benefit_name: '原創海報' },
    { benefit_id: 2, benefit_name: '角色立牌' },
    { benefit_id: 3, benefit_name: '限定飲料杯' },
  ],
  links: links.map((link, index) => ({
    id: index + 1,
    ...link,
    created_at: CREATED,
    updated_at: CREATED,
  })),
  showtimes,
  reviews: [],
  crawlerLogs,
  crawlerOverrides: [
    {
      crawler_override_id: 1,
      entity_type: 'MOVIE',
      entity_id: 1,
      field_name: 'movie_name',
      crawler_value: '星塵旅人（導演剪輯版）',
      created_at: '2026-09-24T10:00:00',
      updated_at: '2026-09-25T09:10:00',
    },
    {
      crawler_override_id: 2,
      entity_type: 'MOVIE',
      entity_id: 2,
      field_name: 'image_url',
      crawler_value: poster('midnight-diner-new'),
      created_at: '2026-09-24T10:05:00',
      updated_at: '2026-09-25T09:20:00',
    },
    {
      crawler_override_id: 3,
      entity_type: 'CINEMA',
      entity_id: 104,
      field_name: 'address',
      crawler_value: '台北市信義區松壽路22號',
      created_at: '2026-09-24T10:10:00',
      updated_at: '2026-09-25T09:30:00',
    },
    {
      crawler_override_id: 4,
      entity_type: 'SHOWTIME',
      entity_id: 65,
      field_name: 'showtime',
      crawler_value: '2026-09-26T22:15:00',
      created_at: '2026-09-24T10:15:00',
      updated_at: '2026-09-25T09:40:00',
    },
    {
      crawler_override_id: 5,
      entity_type: 'LINK',
      entity_id: 1,
      field_name: 'benefit_status',
      crawler_value: 'EXHAUSTED',
      created_at: '2026-09-24T10:20:00',
      updated_at: '2026-09-25T09:50:00',
    },
  ],
}
