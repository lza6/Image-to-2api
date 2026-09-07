/**
 * imagefree-2ai landing Service Worker
 * 离线缓存静态资源，LCP 不退化（首屏 HTML / 关键 CSS 不在此 SW 拦截范围，
 * 由浏览器 preload 直取；SW 仅接管 /assets/*、/src/styles/*、字体、粒子纹理）
 *
 * 三策略：
 *  1. 静态资源 (/assets/*、/src/styles/*) —— Cache-First
 *  2. API (/v1/*、/api/*) —— Network-First（仅 GET，失败回退 cache，错误响应不缓存）
 *  3. 字体 (font, woff/woff2) —— Stale-While-Revalidate
 *
 * 版本号变更：CACHE_NAME 升版后 activate 会清旧版本缓存。
 * 注册时机：index.html 在 window.load 后注册，不阻塞首屏。
 */

// 版本号 —— 升版时改这里，activate 自动清旧缓存
const CACHE_NAME = 'imagefree-landing-v8.6.0'

// 预缓存清单（仅放确定性高、体积小的关键资源；three 大 chunk 不预缓存，靠运行时 Cache-First 懒填充）
const PRECACHE_URLS = [
  '/',
  '/og-image.png'
]

// ──────────────────────────────────────────────────────────────
// 路由分类
// ──────────────────────────────────────────────────────────────

/** 是否为静态资源（/assets/* 或 /src/styles/*）→ Cache-First */
function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/') || url.pathname.startsWith('/src/styles/')
}

/** 是否为 API 路径（/v1/* 或 /api/*）→ Network-First */
function isApiRequest(url) {
  return url.pathname.startsWith('/v1/') || url.pathname.startsWith('/api/')
}

/** 是否为字体资源（CSS Font、woff/woff2/ttf/otf）→ Stale-While-Revalidate */
function isFontAsset(url, request) {
  if (request.destination === 'font') return true
  return /\.(woff2?|ttf|otf)(\?.*)?$/i.test(url.pathname)
}

// ──────────────────────────────────────────────────────────────
// Cache 辅助
// ──────────────────────────────────────────────────────────────

async function putInCache(cacheName, request, response) {
  // 只缓存成功响应（status 200）且协议为 http/https；opaque (status 0) 也允许（CORS 无 cors 模式）
  if (!response) return
  if (response.status !== 200 && response.status !== 0 && response.type !== 'opaque') return
  try {
    const cache = await caches.open(cacheName)
    await cache.put(request, response)
  } catch (_e) {
    // 缓存失败不影响主流程
  }
}

// ──────────────────────────────────────────────────────────────
// 策略实现
// ──────────────────────────────────────────────────────────────

/** Cache-First：命中即返回，否则 fetch + cache.put */
async function cacheFirst(request, url) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (isStaticAsset(url)) {
      await putInCache(CACHE_NAME, request, response.clone())
    }
    return response
  } catch (err) {
    // 离线且无缓存：返回一个简洁的离线兜底（仅对静态资源）
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

/** Network-First：先 fetch，失败回退 cache；仅 GET；错误响应不缓存 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    // 只缓存成功的 GET API 响应；4xx/5xx 不缓存
    if (request.method === 'GET' && response.status === 200) {
      await putInCache(CACHE_NAME, request, response.clone())
    }
    return response
  } catch (err) {
    // 网络失败：尝试 cache 兜底
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached
    // 无缓存：返回 504 离线（不缓存错误响应）
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

/** Stale-While-Revalidate：返回 cache 同时后台更新 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200 || response.type === 'opaque') {
        putInCache(CACHE_NAME, request, response.clone())
      }
      return response
    })
    .catch(() => cached || new Response('', { status: 504, statusText: 'Offline' }))

  // 有缓存立即返回，后台同步更新；无缓存等待 fetch
  return cached || fetchPromise
}

// ──────────────────────────────────────────────────────────────
// 事件处理
// ──────────────────────────────────────────────────────────────

// install：预缓存关键资源；不阻塞激活（skipWaiting 由 activate 控制）
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // 预缓存失败不阻塞 install（资源可能离线时不可达）
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await cache.add(new Request(url, { cache: 'reload' }))
            return res
          } catch (_e) {
            return null
          }
        })
      )
    })()
  )
})

// activate：清旧版本缓存 + 接管控制权
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

// fetch：主路由分发
self.addEventListener('fetch', (event) => {
  const request = event.request

  // 仅拦截 GET；POST/PUT/DELETE 等不缓存
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch (_e) {
    return
  }

  // 仅拦截同源请求（跨域不接管，避免 CORS/字体源混乱）
  if (url.origin !== self.location.origin) return

  // 排除首屏 HTML 导航请求：让浏览器直取 LCP 关键路径，SW 不缓存 HTML
  // （navigation 请求如果被 SW 缓存会导致首屏 HTML 卡在旧版本，LCP 退化）
  if (request.mode === 'navigate') return

  // 策略分发
  let promise
  if (isApiRequest(url)) {
    promise = networkFirst(request)
  } else if (isFontAsset(url, request)) {
    promise = staleWhileRevalidate(request)
  } else if (isStaticAsset(url)) {
    promise = cacheFirst(request, url)
  } else {
    // 其他同源 GET：Stale-While-Revalidate（og-image 等）
    promise = staleWhileRevalidate(request)
  }

  event.respondWith(promise)
})
