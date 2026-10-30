// Network-first service worker: always tries the network, falls back to the cache offline.
// Bump CACHE_VERSION on every deploy so old files are discarded.
const CACHE_VERSION = 'gymnie-v4';
const APP_SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "assets/apple-touch-icon.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "css/base.css",
  "css/styles.css",
  "css/theme.css",
  "src/App.js",
  "src/components/ExerciseCards.js",
  "src/components/SessionCard.js",
  "src/data/exercises.js",
  "src/lib/exportData.js",
  "src/lib/helpers.js",
  "src/lib/milestones.js",
  "src/lib/sampleData.js",
  "src/lib/supabase.js",
  "src/lib/state.js",
  "src/lib/training.js",
  "src/main.js",
  "src/react.js",
  "src/screens/ActiveWorkout.js",
  "src/screens/Auth.js",
  "src/screens/Build.js",
  "src/screens/History.js",
  "src/screens/Home.js",
  "src/screens/Profile.js",
  "src/screens/Saved.js",
  "src/ui/common.js",
  "src/ui/icons.js",
  "vendor/LICENSE-react.txt",
  "vendor/htm.umd.js",
  "vendor/react-dom.production.min.js",
  "vendor/react.production.min.js",
  "vendor/supabase.js",
  "vendor/LICENSE-supabase.txt",
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
