/* ============================================================
   KTS 업무 관리 시스템 — 서비스 워커
   · 알림 수신 (push) · 알림 누르면 해당 글 열기 (notificationclick)
   · 홈 화면 앱 설치 조건 충족 (fetch)
   화면 파일을 저장(캐시)하지 않는다 — 올린 index.html 이 항상 바로 반영되게
   ============================================================ */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

/* 페이지 이동 요청만 그대로 통과 (앱 설치 조건용. 캐시하지 않음) */
self.addEventListener("fetch", e => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request));
});

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  const title = d.title || "KTS 업무관리";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    icon: "icon-192.png",
    tag: d.tag || undefined,          // 같은 글 알림은 새 것으로 덮어쓴다
    renotify: !!d.tag,
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope)) {
        await c.focus();
        return c.navigate(url);        // 열려 있는 앱을 해당 글로 이동
      }
    }
    return self.clients.openWindow(url);
  })());
});
