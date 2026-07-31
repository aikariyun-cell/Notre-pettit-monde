// firebase-messaging-sw.js
// IMPORTANTE: este archivo debe subirse a la RAÍZ de tu sitio (misma carpeta que index.html,
// o donde sea que sirvas notre-petit-monde.html), con exactamente este nombre.
// Es lo que permite recibir notificaciones incluso con la app / pestaña cerrada.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyApDnOVG5dzgTCih1CCVIF6PhJy2grcCr0",
  authDomain: "notre-petit-monde-3c4ed.firebaseapp.com",
  projectId: "notre-petit-monde-3c4ed",
  storageBucket: "notre-petit-monde-3c4ed.firebasestorage.app",
  messagingSenderId: "520280869620",
  appId: "1:520280869620:web:37722c3a0ba33877b1aca1"
});

const messaging = firebase.messaging();

/* ================= Caché para carga rápida / modo offline básico ================= */
/* Solo cachea el "cascarón" de la app (HTML/CSS/JS propios), nunca las llamadas a Supabase/Firebase. */
const CACHE_NAME = "npm-shell-v3";
const SHELL_FILES = [
  "./", "./index.html",
  "./css/styles.css",
  "./js/core.js", "./js/tabs-recuerdos.js", "./js/tabs-comunicacion.js", "./js/tabs-social.js",
  "./js/tabs-personalizacion.js", "./js/organizacion.js", "./js/coleccion.js", "./js/multimedia.js",
  "./js/personalizacion-visual.js", "./js/sonidos.js", "./js/estado.js", "./js/notas-rapidas.js",
  "./js/libro.js", "./js/calidad-vida.js", "./js/inicio-plus.js", "./js/emociones.js",
  "./js/privacidad.js", "./js/personalizacion-plus.js", "./js/tabs-register.js",
  "./js/navegacion-categorias.js", "./js/menu-movil.js",
];
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES).catch(() => {}))
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Solo intervenir en archivos propios (mismo origen, dentro del cascarón). Todo lo demás (Supabase, APIs, imágenes) va directo a la red.
  if (url.origin !== self.location.origin) return;
  const esArchivoPropio = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace("./", "/")) || url.pathname === "/" );
  if (!esArchivoPropio) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const red = fetch(req).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || red;
    })
  );
});

messaging.onBackgroundMessage((payload) => {
  // El backend ahora manda mensajes "solo datos" (sin "notification" en el nivel superior),
  // así este código es SIEMPRE el que decide cómo se ve la notificación, en vez de dejar
  // que el navegador la muestre por su cuenta con su propio comportamiento (que era
  // inconsistente entre Android e iOS y a veces solo sonaba sin mostrar nada en pantalla).
  const data = payload.data || {};
  const n = payload.notification || {}; // fallback por si algún envío viejo aún trae "notification"
  const tag = data.tag || undefined;
  self.registration.showNotification(data.title || n.title || "Notre petit monde", {
    body: data.body || n.body || "",
    icon: "https://em-content.zobj.net/source/apple/391/two-hearts_1f495.png",
    badge: "https://em-content.zobj.net/source/apple/391/two-hearts_1f495.png",
    data,
    tag,
    // BUG REAL: todos los mensajes de una misma categoría (ej. chat) comparten el mismo
    // "tag" para agruparlos. Sin "renotify", el navegador REEMPLAZA en silencio la
    // notificación anterior por la nueva —sin sonido, sin vibrar, sin pantalla de
    // bloqueo— cada vez que llega un tag repetido. Eso hacía que varios mensajes
    // seguidos "no llegaran" (en realidad sí llegaban, pero de forma silenciosa) y daba
    // la sensación de tardanza porque la notificación real quedaba ahí sin avisar.
    // renotify:true fuerza a que SIEMPRE vuelva a alertar (sonido + vibración), incluso
    // si comparte tag con la anterior. renotify solo tiene efecto cuando hay tag, así
    // que es seguro dejarlo siempre en true.
    renotify: !!tag,
    vibrate: [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
