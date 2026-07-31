/* ================= CONFIG FIREBASE (notificaciones push) ================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyApDnOVG5dzgTCih1CCVIF6PhJy2grcCr0",
  authDomain: "notre-petit-monde-3c4ed.firebaseapp.com",
  projectId: "notre-petit-monde-3c4ed",
  storageBucket: "notre-petit-monde-3c4ed.firebasestorage.app",
  messagingSenderId: "520280869620",
  appId: "1:520280869620:web:37722c3a0ba33877b1aca1"
};
const FIREBASE_VAPID_KEY = "BP7VVyvaxNFrGe6chWChfNGSWqMw16ZIUeetORBGYzY1QTcgT0UdeU-SaonzvVAEj5fSGHKmK17b1ulsetG4osM";
let FCM_MESSAGING = null;
function initFirebaseMessaging(){
  if(FCM_MESSAGING) return FCM_MESSAGING;
  if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  FCM_MESSAGING = firebase.messaging();
  FCM_MESSAGING.onMessage((payload)=>{
    const d = payload.data||{};
    const n = payload.notification||{}; // fallback por compatibilidad
    const titulo = d.title || n.title;
    const cuerpo = d.body || n.body;
    if(typeof toast==='function') toast(titulo ? (titulo+(cuerpo?': '+cuerpo:'')) : 'Nueva notificación 🔔');
  });
  return FCM_MESSAGING;
}
