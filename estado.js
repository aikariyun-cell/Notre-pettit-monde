/* ================= CONFIG SUPABASE ================= */
const SUPABASE_URL = 'https://smxrmngegcqmgzufdshv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNteHJtbmdlZ2NxbWd6dWZkc2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MjI4NjcsImV4cCI6MjEwMDA5ODg2N30.nElbAr7AQBB8QEF_ZWUOkA5XDiyqJ8X1VeYqgb_nr14';
// Se configura explícitamente la persistencia de la sesión (en vez de dejar los valores
// por defecto) porque en celular, sobre todo en navegadores en modo privado/"in-app" o
// cuando el sistema operativo descarga la pestaña en segundo plano, el refresco automático
// del token puede quedar pausado. Guardar la sesión en localStorage con una clave propia y
// revisarla al volver a primer plano (ver "recuperarSesionAlVolver" en boot()) evita que la
// persona tenga que iniciar sesión de nuevo cada vez, algo que en PC casi no ocurre porque
// el navegador nunca "pausa" la pestaña de la misma forma.
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'npm-auth-session',
  }
});

/* ================= estado global ================= */
let SESSION = null;      // { user, coupleId, slot, inviteCode }
let MEMBERS = {};        // { P1: userId, P2: userId }
let CACHE = { perfiles:{}, pareja:null, extras:null };
let PERSONALIZACION = { tema:'sakura', fuente:'predeterminada', widgets:['animo','calendario','accesos'], oscuro:false };

/* ================= personalización (temas, fuentes, widgets) ================= */
const TEMAS = {
  sakura:    {label:'Sakura 🌸',        rosa:'#f5b8cf', lila:'#e8c9dc', dorado:'#e0a5b8', crema:'#fff6f9', tinta:'#5a3345'},
  noche:     {label:'Noche estrellada 🌌',rosa:'#8f8fd0', lila:'#6a6ab5', dorado:'#e0c85f', crema:'#f4f2fb', tinta:'#2a2850'},
  cafe:      {label:'Café ☕',          rosa:'#c9a074', lila:'#b58a63', dorado:'#a9744f', crema:'#fbf3ea', tinta:'#4a3423'},
  invierno:  {label:'Invierno ❄️',      rosa:'#a8d4e8', lila:'#bcd9ea', dorado:'#7fb8d8', crema:'#f4fbff', tinta:'#274652'},
  ghibli:    {label:'Ghibli 🌿',        rosa:'#a8cf9e', lila:'#9dc6c9', dorado:'#c2a24a', crema:'#f6fbf2', tinta:'#2f4a3a'},
  cottagecore:{label:'Cottagecore 🌾',  rosa:'#d9b98a', lila:'#c7cd9e', dorado:'#c99a4a', crema:'#fbf7ec', tinta:'#4a3f2a'},
  kawaii:    {label:'Kawaii 🎀',        rosa:'#ff9ec4', lila:'#c9a6f5', dorado:'#ffd15c', crema:'#fff2f9', tinta:'#5a2d4a'},
  minimalista:{label:'Minimalista ◻️',  rosa:'#c9c9c9', lila:'#b5b5b5', dorado:'#8a8a8a', crema:'#fafafa', tinta:'#2c2c2c'},
  vintage:   {label:'Vintage 🕰️',       rosa:'#c9917a', lila:'#b09370', dorado:'#a9744f', crema:'#f6ede1', tinta:'#4a3320'},
  sanvalentin:{label:'San Valentín 💘', rosa:'#f06a8a', lila:'#e88a9a', dorado:'#d94a5f', crema:'#fff0f3', tinta:'#5a1f2a'},
  halloween: {label:'Halloween 🎃',     rosa:'#e0824a', lila:'#8a6ab5', dorado:'#e0a13f', crema:'#fdf5ec', tinta:'#2a1f1a'},
  navidad:   {label:'Navidad 🎄',       rosa:'#d9556a', lila:'#7fae8a', dorado:'#d9a655', crema:'#fff5f2', tinta:'#2f3d2a'},
};
const FUENTES = {
  predeterminada: {label:'Redondeada', body:"'Quicksand',sans-serif"},
  clasica: {label:'Clásica', body:"'Fraunces',serif"},
  manuscrita: {label:'Manuscrita', body:"'Cormorant Garamond',serif"},
};
function aplicarTema(temaId){
  const t = TEMAS[temaId] || TEMAS.sakura;
  const r = document.documentElement.style;
  r.setProperty('--rosa-int', t.rosa);
  r.setProperty('--lila-int', t.lila);
  r.setProperty('--dorado', t.dorado);
  r.setProperty('--crema', t.crema);
  r.setProperty('--tinta', t.tinta);
}
function aplicarFuente(fuenteId){
  const f = FUENTES[fuenteId] || FUENTES.predeterminada;
  document.body.style.fontFamily = f.body;
}
function aplicarModoOscuro(activo){
  document.documentElement.setAttribute('data-oscuro', activo ? '1' : '0');
  if(activo){
    const r = document.documentElement.style;
    r.setProperty('--crema', '#1a1420');
    r.setProperty('--tinta', '#f3e9f6');
  }
  configToggles.modoOscuro = activo;
}
function aplicarFondoDinamico(activo){
  if(!activo){ document.body.style.background = ''; return; }
  // El fondo interactivo se calcula a partir de los colores del tema activo y del modo oscuro,
  // para que siempre combine con la personalización elegida.
  const cs = getComputedStyle(document.documentElement);
  const rosa = (cs.getPropertyValue('--rosa-int')||'#eeb1cd').trim();
  const lila = (cs.getPropertyValue('--lila-int')||'#c3aef0').trim();
  const dorado = (cs.getPropertyValue('--dorado')||'#d9a655').trim();
  const cielo = (cs.getPropertyValue('--cielo')||'#c9e6f2').trim();
  const crema = (cs.getPropertyValue('--crema')||'#fffaf6').trim();
  const oscuro = !!PERSONALIZACION.oscuro;
  const base = oscuro ? crema : crema;
  const mezcla = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  const potencia = oscuro ? 55 : 75;
  const h = new Date().getHours();
  const mes = new Date().getMonth();
  let grad;
  if(h>=5 && h<11) grad = `linear-gradient(180deg, ${mezcla(dorado,potencia)} 0%, ${mezcla(rosa,potencia)} 45%, ${base} 100%)`;
  else if(h>=11 && h<17) grad = `linear-gradient(180deg, ${mezcla(cielo,potencia)} 0%, ${mezcla(dorado, potencia-15)} 55%, ${base} 100%)`;
  else if(h>=17 && h<21) grad = `linear-gradient(180deg, ${mezcla(dorado,potencia)} 0%, ${mezcla(rosa,potencia)} 45%, ${mezcla(lila,potencia)} 100%)`;
  else grad = oscuro
    ? `linear-gradient(180deg, ${mezcla(lila,35)} 0%, ${mezcla(rosa,20)} 55%, ${base} 100%)`
    : `linear-gradient(180deg, ${mezcla(lila,70)} 0%, ${mezcla(rosa,45)} 55%, ${mezcla(lila,25)} 100%)`;
  const colorEstacion = mes>=2&&mes<=4 ? rosa : mes>=5&&mes<=7 ? dorado : mes>=8&&mes<=10 ? dorado : cielo;
  const estacion = `radial-gradient(circle at 20% 90%, ${mezcla(colorEstacion, oscuro?18:25)}, transparent 55%)`;
  document.body.style.background = estacion + ',' + grad;
}
function widgetActivo(id){ return (PERSONALIZACION.widgets||[]).includes(id); }
async function cargarPersonalizacion(){
  if(isDemoMode() || !SESSION?.user?.id){ aplicarTema(PERSONALIZACION.tema); aplicarFuente(PERSONALIZACION.fuente); aplicarModoOscuro(PERSONALIZACION.oscuro); aplicarFondoDinamico(PERSONALIZACION.fondo_dinamico); return; }
  const { data } = await sb.from('profiles').select('personalizacion').eq('user_id', SESSION.user.id).maybeSingle();
  if(data?.personalizacion) PERSONALIZACION = Object.assign({}, PERSONALIZACION, data.personalizacion);
  aplicarTema(PERSONALIZACION.tema);
  aplicarFuente(PERSONALIZACION.fuente);
  aplicarModoOscuro(PERSONALIZACION.oscuro);
  aplicarFondoDinamico(PERSONALIZACION.fondo_dinamico);
}
async function guardarPersonalizacion(campos){
  PERSONALIZACION = Object.assign({}, PERSONALIZACION, campos);
  aplicarTema(PERSONALIZACION.tema);
  aplicarFuente(PERSONALIZACION.fuente);
  aplicarModoOscuro(PERSONALIZACION.oscuro);
  aplicarFondoDinamico(PERSONALIZACION.fondo_dinamico);
  if(isDemoMode() || !SESSION?.user?.id) return;
  await sb.from('profiles').update({personalizacion: PERSONALIZACION}).eq('user_id', SESSION.user.id);
}
async function toggleModoOscuro(btn){
  const nuevo = !PERSONALIZACION.oscuro;
  btn.classList.toggle('on', nuevo);
  await guardarPersonalizacion({oscuro: nuevo});
  toast(nuevo ? 'Modo oscuro activado 🌙' : 'Modo oscuro desactivado ☀️');
}

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>t.classList.remove('show'), 2400);
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function esc(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Escapa un string para insertarlo dentro de un atributo onclick="...('VALOR')" sin romper el HTML.
function jsAttr(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,'\\n'); }
function lanzarConfeti(emojis, mensaje){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:998;pointer-events:none;overflow:hidden;';
  for(let i=0;i<36;i++){
    const s = document.createElement('span');
    s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    const left = Math.random()*100, dur = 3+Math.random()*2.5, delay = Math.random()*1.5, size = 18+Math.random()*20;
    s.style.cssText = `position:absolute;top:-40px;left:${left}vw;font-size:${size}px;animation:confetiCae ${dur}s ${delay}s linear forwards;`;
    overlay.appendChild(s);
  }
  if(mensaje){
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);background:var(--superficie-2);backdrop-filter:blur(10px);padding:16px 22px;border-radius:18px;text-align:center;font-weight:700;font-size:16px;color:var(--tinta);box-shadow:var(--sombra);border:1px solid var(--superficie-borde);pointer-events:auto;';
    msg.textContent = mensaje;
    overlay.appendChild(msg);
  }
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(), 6500);
}
function revisarEventosEspeciales(){
  const hoy = new Date();
  const clave = hoy.toISOString().slice(0,10);
  const yaVisto = (id)=> localStorage.getItem('evento_'+id) === clave;
  const marcarVisto = (id)=> localStorage.setItem('evento_'+id, clave);
  const mi = CACHE.perfiles[SESSION.slot]||{};
  const su = CACHE.perfiles[otroSlot()]||{};
  const mm = hoy.getMonth(), dd = hoy.getDate();
  if(mi.cumple){ const c=new Date(mi.cumple+'T00:00:00'); if(c.getMonth()===mm && c.getDate()===dd && !yaVisto('cumple-mio')){ lanzarConfeti(['🎉','🎂','🎈','✨'], '¡Feliz cumpleaños! 🎂'); marcarVisto('cumple-mio'); return; } }
  if(su.cumple){ const c=new Date(su.cumple+'T00:00:00'); if(c.getMonth()===mm && c.getDate()===dd && !yaVisto('cumple-su')){ lanzarConfeti(['🎉','🎂','🎁','💗'], `¡Hoy es el cumpleaños de ${esc(su.apodo||su.nombre||'tu pareja')}! 🎂`); marcarVisto('cumple-su'); return; } }
  getPareja().then(p=>{
    if(p.aniversario){ const a=new Date(p.aniversario+'T00:00:00'); if(a.getMonth()===mm && a.getDate()===dd && !yaVisto('aniversario')){ const anios=hoy.getFullYear()-a.getFullYear(); lanzarConfeti(['💞','💗','🎉','💍'], `¡Feliz aniversario! ${anios} año${anios!==1?'s':''} juntos 💞`); marcarVisto('aniversario'); return; }
      }
      if(mm===1 && dd===14 && !yaVisto('valentin')){ lanzarConfeti(['💘','💝','🌹','💗'], '¡Feliz San Valentín! 💘'); marcarVisto('valentin'); }
      else if(mm===9 && dd===31 && !yaVisto('halloween')){ lanzarConfeti(['🎃','👻','🦇','🕸️'], '¡Feliz Halloween! 🎃'); marcarVisto('halloween'); }
      else if(mm===11 && dd===25 && !yaVisto('navidad')){ lanzarConfeti(['🎄','🎁','❄️','⭐'], '¡Feliz Navidad! 🎄'); marcarVisto('navidad'); }
      else if(mm===0 && dd===1 && !yaVisto('anonuevo')){ lanzarConfeti(['🎆','✨','🥂','🎉'], '¡Feliz año nuevo juntos! 🎆'); marcarVisto('anonuevo'); }
  }).catch(()=>{});
}
function otroSlot(){ return SESSION.slot==='P1' ? 'P2' : 'P1'; }
async function dataUrlToBlob(dataUrl){ const r = await fetch(dataUrl); return await r.blob(); }
async function subirImagen(dataUrl, carpeta, nombreArchivo){
  const blob = await dataUrlToBlob(dataUrl);
  const path = `${SESSION.coupleId}/${carpeta}/${nombreArchivo}-${uid()}.jpg`;
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType:'image/jpeg', upsert:true });
  if(error){ console.error(error); return null; }
  const { data } = sb.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}


/* ================= Emojis exclusivos Notre Petit Monde ================= */
const NPM_EMOJIS = {
  amor:[
    {e:'🤍🌙',l:'Te adoro'},{e:'🌸🤝',l:'Siempre contigo'},{e:'☁️💕',l:'Abrazito'},
    {e:'💐🪞',l:'Gracias por existir'},{e:'💜🧩',l:'Eres mi persona'},
    {e:'💌🌙',l:'Carta de amor'},{e:'😴🌙',l:'Buenas noches'},
    {e:'🏠💜',l:'Eres mi lugar seguro'},{e:'🧩💗',l:'Encajamos'},
    {e:'🕯️💜',l:'Mi persona favorita'},
  ],
  estados:[
    {e:'☀️😊',l:'Feliz'},{e:'☁️😢',l:'Triste'},{e:'☕🤗',l:'Necesito un abrazo'},
    {e:'🌊💭',l:'Pensando mucho'},{e:'🌱✨',l:'Tranquilo/a'},
    {e:'⚡🌟',l:'Motivado/a'},{e:'🌙💜',l:'Soñando despierto'},
    {e:'🌼✅',l:'Todo está bien'},
  ],
  mensajes:[
    {e:'🍓💭',l:'Te extraño'},{e:'🫖💬',l:'¿Hablamos?'},{e:'🧸💕',l:'Quiero mimos'},
    {e:'🌙😴',l:'Descansa'},{e:'🍪🔑',l:'Tengo una sorpresa'},
    {e:'🎀💌',l:'Tengo algo importante'},{e:'💜✨',l:'Pensé en ti'},
    {e:'📖💗',l:'Cuéntame tu día'},
  ],
  exclusivos:[
    {e:'🌍💕',l:'Nuestro universo'},{e:'🏠🌸',l:'Nuestro hogar'},
    {e:'😴💜',l:'Dormimos juntos'},{e:'🔒💗',l:'Mi corazón es tuyo'},
    {e:'☁️🤍',l:'Abrazo a distancia'},{e:'🛡️💕',l:'Te protejo'},
    {e:'📷✨',l:'Recuerdo especial'},{e:'✉️🔮',l:'Mensaje secreto'},
    {e:'🌍💜',l:'Nuestro pequeño mundo'},{e:'🌱💗',l:'Nuestra relación crece'},
    {e:'🕯️💕',l:'Momento íntimo'},{e:'🌙🌸',l:'Nuestra cita'},
    {e:'💜💛',l:'Pensando en ti'},{e:'💍🔒',l:'Promesa eterna'},
    {e:'🤍💛',l:'Mi otra mitad'},{e:'🤗💕',l:'Abrazando'},
    {e:'😎🐾',l:'Cool'},{e:'🌈✨',l:'Nuestra historia'},
  ],
  actividades:[
    {e:'🏠❤️',l:'Ya llegué'},{e:'🚶💕',l:'Voy contigo'},{e:'🚗💜',l:'En camino'},
    {e:'🍜🍽️',l:'Vamos a comer'},{e:'🎬🌙',l:'¿Película?'},{e:'☕💜',l:'Cafecito'},
    {e:'🛍️💕',l:'Vamos de compras'},{e:'💑✨',l:'Cita'},
  ],
  minijuegos:[
    {e:'⭐🎯',l:'Reto'},{e:'✅🌟',l:'Misión completada'},{e:'🏆💛',l:'Ganaste'},
    {e:'🎁💕',l:'Recompensa'},{e:'🔑✨',l:'Desbloqueado'},{e:'🎁🌙',l:'Regalo'},
    {e:'🎮💜',l:'Juguemos'},
  ],
  mascotas:[
    {e:'😊🐾',l:'Feliz'},{e:'😊🌸',l:'Sonrojado/a'},{e:'😴🌙',l:'Dormido/a'},
    {e:'😢🐾',l:'Triste'},{e:'🤗💕',l:'Cariñoso/a'},{e:'😮✨',l:'Sorprendido/a'},
    {e:'💭☁️',l:'Pensando'},{e:'😤🔥',l:'Enojado/a'},{e:'😎🐾',l:'Cool'},
  ],
};
const NPM_STICKERS = ['🌸💕','🌙✨','💜🤍','🐾💗','☁️🌈','🎀💌','🦋🌸','⭐💫','🍓🤗','🌺💕','🐰💜','🌻☀️','💎✨','🦄🌈','🍑💕','🎵💜','🌊🤍','🍬💕','🧸💗','🌷💜'];
const NPM_GIFS = ['✨💕✨','🌸🌸🌸','💗💗💗','🎉🎊🎉','😊💕😊','⭐🌙⭐','🤗💕🤗'];
function copiarEmoji(emoji){
  if(navigator.clipboard){ navigator.clipboard.writeText(emoji).then(()=>toast('Emoji copiado: '+emoji)); }
  else{ toast('Emoji: '+emoji); }
}
const FAVS_FIELDS = [
 ['color','Color favorito'],['colorNo','Color que no le gusta'],['comida','Comida favorita'],
 ['bebida','Bebida favorita'],['postre','Postre favorito'],['snack','Snack favorito'],
 ['fruta','Fruta favorita'],['dulce','Dulce favorito'],['restaurante','Restaurante favorito'],
 ['animal','Animal favorito'],['flor','Flor favorita'],['estacion','Estación favorita'],
 ['clima','Clima favorito'],['lugar','Lugar favorito'],['ciudad','Ciudad favorita'],
 ['paisVisitar','País que desea visitar'],['pelicula','Película favorita'],['serie','Serie favorita'],
 ['anime','Anime favorito'],['libro','Libro favorito'],['videojuego','Videojuego favorito'],
 ['personaje','Personaje favorito'],['cancion','Canción favorita'],['artista','Artista favorito'],
 ['hobby','Hobby favorito'],['deporte','Deporte favorito'],['materia','Materia favorita'],
 ['numero','Número favorito'],['aroma','Aroma favorito'],['marca','Marca favorita'],
 ['cafe','Café favorito'],['helado','Helado favorito'],
 ['tallaRopa','Talla de ropa'],['tallaCalzado','Talla de calzado'],['redSocial','Red social / usuario'],
 ['alergias','Alergias'],['regalosIdeales','Regalos ideales'],['suenos','Sueños'],
];
const FRASES = {
  motivacion:["Un paso a la vez, hoy también puedes.","Confía en tu propio ritmo.","Lo estás haciendo mejor de lo que crees."],
  apoyo:["Aquí estoy, pase lo que pase.","No estás solo/a en esto, cuenta conmigo.","Respira, ya casi lo logras."],
  romantico:["Contigo hasta el fin del mundo, y un poco más.","Eres mi lugar favorito.","Cada día elijo quererte de nuevo."],
  buenosDias:["Buenos días, mi amor. Que tengas un día hermoso ☀️","Despierta con una sonrisa, hoy será un buen día."],
  buenasNoches:["Buenas noches, sueña bonito 🌙","Que descanses, mañana te sigo queriendo igual."]
};
const PREGUNTAS = ["¿Cuál fue tu primera impresión de mí?","¿Qué canción te recuerda a nosotros?","¿Cuál ha sido tu momento favorito juntos?","¿Qué es lo que más admiras de mí?","¿Dónde te gustaría que viajáramos algún día?","¿Cuál es tu recuerdo más tierno de nuestra relación?","¿Qué palabra usarías para describir nuestra relación?","¿Qué te hace sentir amado/a?","¿Cómo te imaginas nuestro futuro?","¿Cuál ha sido el mejor regalo que te he dado?"];
const MENSAJES_MANO = ["Te amo ❤️","Buenos días ☀️","Buenas noches 🌙","Te extraño 🥺","Cuídate","Estoy orgulloso de ti","Todo saldrá bien","Gracias por existir","Perdóname","Estoy pensando en ti","Ven por un abrazo","Feliz aniversario"];

/* ================= arranque / auth ================= */
function crearPetalos(){
  const wrap = document.getElementById('petals');
  for(let i=0;i<14;i++){
    const p = document.createElement('div');
    p.className='petal';
    p.style.left = Math.random()*100+'%';
    p.style.animationDuration = (14+Math.random()*12)+'s';
    p.style.animationDelay = (Math.random()*12)+'s';
    p.style.opacity = 0.3+Math.random()*0.4;
    wrap.appendChild(p);
  }
}
// Si la persona llegó desde un enlace de invitación (ver "compartirEnlaceInvitacion"),
// guardamos el código para prellenarlo apenas lleguemos a la pantalla de "unirme".
(function leerCodigoInvitacionDeLaURL(){
  try {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if(invite) window._codigoInvitacionPendiente = invite.trim().toUpperCase();
  } catch(e){ /* no pasa nada si la URL no trae el parámetro */ }
})();

(async function boot(){
  crearPetalos();
  // Todo el arranque va protegido con try/catch: si falla la conexión con Supabase (red
  // inestable, navegador de celular bloqueando el storage, timeout, etc.) igual mostramos
  // la pantalla de inicio de sesión en vez de dejar la app "colgada" en blanco, que es lo
  // que causaba que en el celular la página pareciera no funcionar y nunca aparecieran los
  // botones de "Iniciar sesión" / "Crear cuenta".
  try {
    const { data:{ session } } = await sb.auth.getSession();
    if(session && session.user){ await procesarSesionEntrante(session.user); }
    else { pantallaLogin(); }
  } catch(e){
    console.error('No se pudo recuperar la sesión al iniciar la app', e);
    pantallaLogin();
  }
  sb.auth.onAuthStateChange((event, session)=>{
    if(event==='SIGNED_OUT'){ location.reload(); }
  });
  // En celular, el sistema operativo o el navegador suelen "congelar" la pestaña cuando
  // pasa a segundo plano, y el refresco automático del token de Supabase no corre mientras
  // tanto. Al volver a abrir la app revisamos la sesión de nuevo; si sigue viva simplemente
  // no pasa nada, y si ya expiró intentamos refrescarla antes de mandar a la persona de
  // vuelta al login. Esto es lo que en PC casi nunca hace falta, porque el navegador no
  // pausa la pestaña de la misma manera.
  document.addEventListener('visibilitychange', async ()=>{
    if(document.visibilityState!=='visible' || isDemoMode()) return;
    try{
      const { data:{ session: sesionActual } } = await sb.auth.getSession();
      if(!sesionActual){
        await sb.auth.refreshSession();
      }
    }catch(e){ console.error('No se pudo revalidar la sesión al volver a la app', e); }
    if(typeof marcarPresenciaActiva==='function') marcarPresenciaActiva();
    if(activeTab==='chat'){
      if(typeof renderChat==='function') renderChat();
      if(typeof pintarPresenciaChat==='function') pintarPresenciaChat();
    }
    // Si el socket de tiempo real quedó "colgado" mientras la pestaña estaba en segundo
    // plano, nos aseguramos de que siga conectado (si no, se reconecta solo).
    if(window._hogarChannel && window._hogarChannel.state!=='joined' && typeof suscribirRealtime==='function'){
      suscribirRealtime();
    }
  });
})();

// Guía de "Primeros pasos": cómo crear una cuenta, crear un mundo y vincularse con la pareja.
// Se muestra ANTES de crear cuenta (en el manual público, desde la pantalla de login) tanto
// al inicio como al final, para que quede a mano por si quedaron dudas después de leer el
// resto del manual. No se incluye en "Ajustes → Manual" (esa sección solo trae el manual de
// funciones, renderConfigManual, definida en tabs-personalizacion.js).
function primerosPasosHTML(opciones){
  opciones = opciones || {};
  const conBotonCrearCuenta = opciones.conBotonCrearCuenta !== false;
  return `
    <div class="card">
      <h2>🌷 Primeros pasos en Notre Petit Monde</h2>
      <p class="muted small">Todo lo que necesitas para comenzar a usar su pequeño mundo.</p>
      <div class="manual-section">
        <div class="manual-item">
          <div class="manual-item-head"><div class="manual-icon">🌸</div><div><div class="manual-title">Crear una cuenta</div><div class="manual-desc">¡Comenzar es muy fácil!</div></div></div>
          <div class="pasos-bloque">
            <div class="pasos-subtitulo">Opción 1: Crear una cuenta con correo electrónico</div>
            <ol class="pasos-lista">
              <li>Abre la aplicación Notre Petit Monde.</li>
              <li>Presiona "Crear cuenta".</li>
              <li>Ingresa la siguiente información: 👤 nombre de usuario, 📧 correo electrónico y 🔒 una contraseña segura.</li>
              <li>Acepta los términos y condiciones.</li>
              <li>Verifica tu correo electrónico (si es necesario).</li>
              <li>Inicia sesión y comienza a crear recuerdos.</li>
            </ol>
            <div class="pasos-subtitulo">Opción 2: Continuar con Google</div>
            <ol class="pasos-lista">
              <li>Abre Notre Petit Monde.</li>
              <li>Presiona "Continuar con Google".</li>
              <li>Selecciona la cuenta de Google que deseas utilizar.</li>
              <li>Autoriza los permisos necesarios.</li>
              <li>¡Listo! Tu cuenta se creará automáticamente y podrás comenzar a usar la aplicación.</li>
            </ol>
          </div>
        </div>
        <div class="manual-item">
          <div class="manual-item-head"><div class="manual-icon">🌍</div><div><div class="manual-title">Crear un mundo</div><div class="manual-desc">Una vez que hayas iniciado sesión.</div></div></div>
          <div class="pasos-bloque">
            <ol class="pasos-lista">
              <li>En la pantalla principal selecciona "Crear un mundo".</li>
              <li>Escribe el nombre de su mundo.</li>
              <li>Personaliza el tema o los colores (opcional).</li>
              <li>Presiona "Crear".</li>
              <li>La aplicación generará un código de invitación para compartir con tu pareja.</li>
              <li>Cuando tu pareja ingrese el código o acepte la invitación, ambos quedarán conectados en el mismo mundo compartido. 💕</li>
            </ol>
          </div>
        </div>
        <div class="manual-item">
          <div class="manual-item-head"><div class="manual-icon">💞</div><div><div class="manual-title">Vincular un mundo existente</div><div class="manual-desc">Para unirte al mundo que ya creó tu pareja.</div></div></div>
          <div class="pasos-bloque">
            <div class="pasos-subtitulo">Opción 1: Con código</div>
            <ol class="pasos-lista">
              <li>Selecciona "Unirme a un mundo".</li>
              <li>Escribe el código que recibiste de tu pareja.</li>
              <li>Confirma la solicitud.</li>
              <li>Cuando sea aceptada, ambos compartirán el mismo mundo.</li>
            </ol>
            <div class="pasos-subtitulo">Opción 2: Con enlace de invitación</div>
            <ol class="pasos-lista">
              <li>Abre el enlace enviado por tu pareja.</li>
              <li>Inicia sesión si aún no lo has hecho.</li>
              <li>Presiona "Aceptar invitación".</li>
              <li>Automáticamente quedarás vinculado al mundo.</li>
            </ol>
          </div>
        </div>
      </div>
      ${conBotonCrearCuenta ? `<button class="btn btn-primary btn-block" style="margin-top:6px" onclick="document.getElementById('manualOverlay').remove(); pantallaLogin('signup');">Ir a crear cuenta 💫</button>` : ''}
    </div>`;
}

// Manual accesible ANTES de crear cuenta/iniciar sesión, desde la pantalla de login.
// Muestra primero "Primeros pasos" (con botón para ir directo a crear cuenta) y luego el
// manual de funciones completo (mismo contenido que "Ajustes → Manual", vía renderConfigManual,
// definida en tabs-personalizacion.js). Antes se repetía "Primeros pasos" también al final,
// lo que hacía que se viera duplicado; ahora se muestra una sola vez.
function abrirManualPublico(){
  const existente = document.getElementById('manualOverlay'); if(existente){ existente.remove(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'manualOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(30,20,30,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:20px;position:relative">
      <button onclick="document.getElementById('manualOverlay').remove()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <div id="manualPublicoInicio"></div>
      <div id="manualPublicoBody"></div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('manualPublicoInicio').innerHTML = primerosPasosHTML({conBotonCrearCuenta:true});
  renderConfigManual(document.getElementById('manualPublicoBody'));
}

function pantallaLogin(modo){
  modo = modo || 'login';
  const card = document.getElementById('obCard');
  card.innerHTML = `
    <div class="ob-seal">💌</div>
    <h1>Notre petit monde</h1>
    <p class="ob-sub">Su pequeño mundo privado, solo para ustedes dos.</p>
    <div class="ob-toggle">
      <button id="tabLogin" class="${modo==='login'?'active':''}">Iniciar sesión</button>
      <button id="tabSignup" class="${modo==='signup'?'active':''}">Crear cuenta</button>
    </div>
    ${modo==='signup' ? `
    <details class="manual-inline" open style="margin:14px 0;text-align:left">
      <summary style="cursor:pointer;font-weight:700;color:var(--tinta);font-size:13.5px;margin-bottom:8px;list-style:none">🌷 Antes de crear tu cuenta: primeros pasos <span style="font-weight:400;color:var(--tinta-suave);font-size:11.5px">(toca para ocultar/mostrar)</span></summary>
      ${primerosPasosHTML({conBotonCrearCuenta:false})}
    </details>` : ''}
    <div class="field"><label>Correo electrónico</label><input id="authEmail" type="email" placeholder="tucorreo@ejemplo.com"></div>
    <div class="field"><label>Contraseña</label><input id="authPass" type="password" placeholder="••••••••"></div>
    <button class="btn btn-primary btn-block" id="authBtn">${modo==='login'?'Entrar':'Crear cuenta'} 💫</button>
    <div class="error-text" id="authError"></div>
    <div class="divider"><span>o</span></div>
    <button class="btn btn-outline btn-block" id="googleBtn">
      <svg width="18" height="18" viewBox="0 0 48 48" style="flex:none"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14-5.1l-6.5-5.4C29.5 35.4 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.5 5.4C39.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
      Continuar con Google
    </button>
    ${window.location.protocol==='file:'?`<button class="btn btn-ghost btn-block" id="devBtn">Entrar como prueba</button>`:''}
    <p class="hint">${modo==='login' ? '¿Primera vez aquí? Crea tu cuenta con tu correo.' : 'Te enviaremos un correo de confirmación antes de poder entrar.'}</p>
    <button class="btn btn-ghost btn-block" onclick="abrirManualPublico()" style="margin-top:4px">📘 Ver manual de la app</button>
  `;
  document.getElementById('tabLogin').onclick=()=>pantallaLogin('login');
  document.getElementById('tabSignup').onclick=()=>pantallaLogin('signup');
  document.getElementById('authBtn').onclick=()=> modo==='login' ? iniciarSesion() : registrarse();
  document.getElementById('googleBtn').onclick=()=>iniciarSesionGoogle();
  if(document.getElementById('devBtn')){
    document.getElementById('devBtn').onclick=()=> loginDePrueba();
  }
  document.getElementById('authPass').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('authBtn').click(); });
}

function isDemoMode(){
  return SESSION?.demo || SESSION?.user?.user_metadata?.demo;
}
async function loginDePrueba(){
  toast('Usando modo de prueba local. No se guardará en Supabase.');
  const fakeUser = {
    id: 'demo-' + Math.random().toString(36).slice(2,10),
    email: 'demo@local.test',
    user_metadata: { demo:true }
  };
  const demoCoupleId = 'demo-' + fakeUser.id;
  SESSION = { user: fakeUser, coupleId: demoCoupleId, slot: 'P1', demo:true, demoInvite:'DEMO' };
  pantallaHogar();
}
async function iniciarSesionGoogle(){
  const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.href.split('#')[0].split('?')[0] } });
  if(error){ toast('No se pudo iniciar con Google'); console.error(error); }
}
async function iniciarSesion(){
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPass').value;
  const errEl = document.getElementById('authError');
  errEl.textContent='';
  if(!email || !password){ errEl.textContent='Completa correo y contraseña.'; return; }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error){ errEl.textContent = error.message==='Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message; return; }
  await procesarSesionEntrante(data.user);
}
// Los términos y condiciones deben aceptarse una sola vez, al crear la cuenta — nunca de
// nuevo en logins posteriores. Además de guardar la aceptación en user_metadata (Supabase),
// guardamos un respaldo en localStorage por id de usuario: así, si el guardado remoto llega
// a fallar o el objeto de sesión aún no refleja el cambio recién hecho, igual no se vuelve a
// mostrar en este dispositivo.
function terminosYaAceptados(user){
  if(user && user.user_metadata && user.user_metadata.terminos_aceptados) return true;
  try{ if(user && user.id && localStorage.getItem('npm_terminos_ok_'+user.id)==='1') return true; }
  catch(e){ /* localStorage no disponible: seguimos solo con el metadata remoto */ }
  return false;
}
function marcarTerminosAceptadosLocal(user){
  try{ if(user && user.id) localStorage.setItem('npm_terminos_ok_'+user.id,'1'); }
  catch(e){ /* no pasa nada si no se puede guardar localmente */ }
}
// Antes de dejar entrar a la app, nos aseguramos de que la cuenta ya haya aceptado los
// términos y condiciones (guardado en user_metadata.terminos_aceptados, con respaldo local).
// Esto cubre tanto el login con correo como el que llega recién redirigido desde Google: como
// ese último no pasa por registrarse(), sin este chequeo nunca se le mostraban los términos.
async function procesarSesionEntrante(user){
  if(!terminosYaAceptados(user)){
    pantallaTerminos(async ()=>{
      marcarTerminosAceptadosLocal(user);
      try{ await sb.auth.updateUser({ data:{ terminos_aceptados:true } }); }
      catch(e){ console.error('No se pudo guardar la aceptación de términos', e); }
      await afterLogin(user);
    });
    return;
  }
  await afterLogin(user);
}
// Contenido de los Términos y condiciones, reutilizado tanto en la pantalla que se muestra
// justo después de crear una cuenta como en Ajustes → Legal, para no tener el texto duplicado.
function terminosCondicionesHTML(){
  return `
    <p>Al usar Notre Petit Monde, aceptas los siguientes términos:</p>
    <ul>
      <li><b>Uso personal:</b> Esta aplicación está diseñada exclusivamente para el uso privado entre dos personas en una relación afectiva. No está permitido el acceso no autorizado.</li>
      <li><b>Edad mínima:</b> Debes tener al menos 16 años para usar esta aplicación. Si eres menor de 18 años, necesitas el consentimiento de un tutor legal.</li>
      <li><b>Consentimiento:</b> La vinculación entre dos usuarios requiere el consentimiento explícito de ambas partes mediante el código del hogar.</li>
      <li><b>Uso responsable:</b> Está prohibido el uso de la app para acoso, manipulación, chantaje o cualquier forma de abuso entre los usuarios vinculados.</li>
      <li><b>Normas contra abuso:</b> Cualquier comportamiento abusivo puede resultar en la suspensión inmediata de la cuenta.</li>
      <li><b>Contenido:</b> Eres responsable del contenido que subes. Está prohibido subir contenido ilegal, ofensivo o que viole la privacidad de terceros.</li>
    </ul>`;
}
// Pantalla de Términos y condiciones que se muestra justo después de crear una cuenta.
// "continuar" se ejecuta solo cuando la persona presiona "Acepto y continuar".
function pantallaTerminos(continuar){
  const card = document.getElementById('obCard');
  card.innerHTML = `
    <div class="ob-seal">📋</div>
    <h1>Términos y condiciones</h1>
    <p class="ob-sub">Antes de continuar, lee y acepta nuestros términos.</p>
    <div class="legal-block" style="text-align:left;max-height:260px;overflow-y:auto">
      <div class="legal-body">${terminosCondicionesHTML()}</div>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" id="btnAceptarTerminos">Acepto y continuar 💫</button>
    <p class="hint">También puedes leer la política de privacidad completa luego en Ajustes → Legal.</p>
  `;
  document.getElementById('btnAceptarTerminos').onclick = ()=> continuar();
}
async function registrarse(){
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPass').value;
  const errEl = document.getElementById('authError');
  errEl.textContent='';
  if(!email || !password){ errEl.textContent='Completa correo y contraseña.'; return; }
  if(password.length<6){ errEl.textContent='La contraseña debe tener al menos 6 caracteres.'; return; }
  const { data, error } = await sb.auth.signUp({ email, password });
  if(error){ errEl.textContent = error.message; return; }
  // Justo después de crear la cuenta (con o sin confirmación de correo pendiente),
  // mostramos los términos y condiciones antes de dejar continuar a la persona.
  pantallaTerminos(async ()=>{
    marcarTerminosAceptadosLocal(data.user);
    if(data.session){
      try{ await sb.auth.updateUser({ data:{ terminos_aceptados:true } }); }
      catch(e){ console.error('No se pudo guardar la aceptación de términos', e); }
      afterLogin(data.user);
    }
    else {
      const card = document.getElementById('obCard');
      card.innerHTML = `<div class="ob-seal">📩</div><h1>Revisa tu correo</h1><p class="ob-sub">Te enviamos un enlace de confirmación a <b>${esc(email)}</b>. Ábrelo y luego vuelve a iniciar sesión aquí.</p>
      <button class="btn btn-primary btn-block" onclick="pantallaLogin('login')">Ya confirmé, iniciar sesión</button>`;
    }
  });
}
async function cerrarSesion(){
  try{
    if(SESSION?.user?.id && 'serviceWorker' in navigator && typeof initFirebaseMessaging==='function'){
      const reg = await navigator.serviceWorker.getRegistration();
      if(reg){
        const messaging = initFirebaseMessaging();
        let token = null;
        try{ token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg }); }catch(e){}
        if(token){
          await sb.from('push_tokens').delete().eq('token', token);
          try{ await messaging.deleteToken(); }catch(e){ /* no crítico */ }
        }
      }
    }
  }catch(e){ console.error('No se pudo limpiar el token push al cerrar sesión', e); }
  await sb.auth.signOut();
}

async function afterLogin(user){
  SESSION = { user };
  try {
    const { data, error } = await sb.from('couple_members').select('couple_id, slot').eq('user_id', user.id).maybeSingle();
    if(error) throw error;
    if(data && data.couple_id){
      SESSION.coupleId = data.couple_id; SESSION.slot = data.slot;
      await entrarApp();
      return;
    }
  } catch (err) {
    console.error('Error al verificar tu hogar', err);
  }
  pantallaHogar();
}

function generarCodigoHogar(){
  const parte = Math.random().toString(36).slice(2,7).toUpperCase();
  const parte2 = Math.random().toString(36).slice(2,5).toUpperCase();
  return `${parte}-${parte2}`;
}

function pantallaHogar(){
  const card = document.getElementById('obCard');
  const codigoPendiente = window._codigoInvitacionPendiente || '';
  card.innerHTML = `
    <div class="ob-seal">🏡</div>
    <h1>Su hogar</h1>
    <p class="ob-sub">Creen su espacio o únanse con el código de su pareja.</p>
    <div class="ob-toggle">
      <button id="tabCreate" class="${codigoPendiente?'':'active'}">Crear hogar</button>
      <button id="tabJoin" class="${codigoPendiente?'active':''}">Unirme con código</button>
    </div>
    <div id="paneCreate" style="display:${codigoPendiente?'none':'block'}">
      <div class="field"><label>Nombre de su mundo</label><input id="worldName" placeholder="Ej: Nuestro mundo" value="Nuestro mundo"></div>
      <div class="field">
        <label>Tema o colores (opcional)</label>
        <div class="grid2" id="worldThemePicker" style="gap:8px;margin-top:6px">
          ${Object.entries(TEMAS).map(([id,t])=>`
            <button type="button" class="btn ${id==='sakura'?'btn-primary':'btn-outline'}" data-theme="${id}" style="justify-content:flex-start;gap:8px;font-size:12.5px" onclick="seleccionarTemaMundo('${id}')">
              <span style="width:14px;height:14px;border-radius:50%;display:inline-block;background:linear-gradient(135deg,${t.rosa},${t.lila});border:1px solid rgba(0,0,0,.1)"></span>${t.label}
            </button>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="crearHogar()">Crear nuestro hogar ✨</button>
      <p class="hint">Se generará un código único para compartir con tu pareja.</p>
    </div>
    <div id="paneJoin" style="display:${codigoPendiente?'block':'none'}">
      <div class="field"><label>Código del hogar</label><input id="jCode" placeholder="Ej: LUNA-4821" style="text-transform:uppercase" value="${esc(codigoPendiente)}"></div>
      <button class="btn btn-primary btn-block" onclick="unirseHogar()">Unirme 💞</button>
    </div>
    <button class="ob-link" onclick="cerrarSesion()">Cerrar sesión</button>
  `;
  window._codigoInvitacionPendiente = null;
  window._temaMundoSeleccionado = 'sakura';
  document.getElementById('tabCreate').onclick=()=>{document.getElementById('tabCreate').classList.add('active');document.getElementById('tabJoin').classList.remove('active');document.getElementById('paneCreate').style.display='block';document.getElementById('paneJoin').style.display='none';};
  document.getElementById('tabJoin').onclick=()=>{document.getElementById('tabJoin').classList.add('active');document.getElementById('tabCreate').classList.remove('active');document.getElementById('paneJoin').style.display='block';document.getElementById('paneCreate').style.display='none';};
}
function seleccionarTemaMundo(temaId){
  window._temaMundoSeleccionado = temaId;
  document.querySelectorAll('#worldThemePicker [data-theme]').forEach(b=>b.classList.toggle('btn-primary', b.dataset.theme===temaId));
  document.querySelectorAll('#worldThemePicker [data-theme]').forEach(b=>b.classList.toggle('btn-outline', b.dataset.theme!==temaId));
  aplicarTema(temaId); // vista previa inmediata del tema elegido
}
// Guarda el nombre del mundo y el tema elegido al crearlo. Se hace en un try/catch aparte
// para que, si por lo que sea la fila de perfil todavía no existe, no se rompa el flujo de
// creación del hogar (el tema igual ya se aplicó en pantalla con seleccionarTemaMundo).
async function guardarPersonalizacionMundoInicial(nombreMundo, temaId){
  try{
    await guardarPersonalizacion({ nombreMundo: (nombreMundo||'').trim() || 'Nuestro mundo', tema: temaId||'sakura' });
  }catch(e){ console.error('No se pudo guardar la personalización inicial del mundo', e); }
}
async function crearHogar(){
  const nombreMundoEl = document.getElementById('worldName');
  const nombreMundo = nombreMundoEl ? nombreMundoEl.value : 'Nuestro mundo';
  const temaMundo = window._temaMundoSeleccionado || 'sakura';
  if(SESSION.user?.user_metadata?.demo){
    const inviteCode = generarCodigoHogar();
    SESSION.coupleId = 'demo-' + Math.random().toString(36).slice(2,10);
    SESSION.slot = 'P1';
    SESSION.demoInvite = inviteCode;
    PERSONALIZACION.nombreMundo = (nombreMundo||'').trim() || 'Nuestro mundo';
    PERSONALIZACION.tema = temaMundo;
    const card = document.getElementById('obCard');
    card.innerHTML = `<div class="ob-seal">🔑</div><h1>¡${esc(PERSONALIZACION.nombreMundo)} está listo!</h1><p class="ob-sub">Este es el código de su hogar. Compártelo con tu pareja:</p>
      ${botonesCompartirMundoHTML(inviteCode)}
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="entrarApp()">Entrar a nuestro mundo 💫</button>
      <p class="hint">Guarda este código, lo necesitarán para unirse desde otro dispositivo.</p>`;
    return;
  }
  try {
    const { data, error } = await sb.rpc('create_couple');
    if(!error && data && data[0]){
      const row = data[0];
      SESSION.coupleId = row.couple_id; SESSION.slot = row.slot;
      await guardarPersonalizacionMundoInicial(nombreMundo, temaMundo);
      const card = document.getElementById('obCard');
      card.innerHTML = `<div class="ob-seal">🔑</div><h1>¡${esc(PERSONALIZACION.nombreMundo||'Su mundo')} está listo!</h1><p class="ob-sub">Este es el código de su hogar. Compártelo con tu pareja:</p>
      ${botonesCompartirMundoHTML(row.invite_code)}
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="entrarApp()">Entrar a nuestro mundo 💫</button>
      <p class="hint">Guarda este código, lo necesitarán para unirse desde otro dispositivo.</p>`;
      return;
    }
    throw error || new Error('RPC create_couple no disponible');
  } catch (err) {
    console.warn('Fallo la RPC create_couple, usando fallback', err);
    try {
      const inviteCode = generarCodigoHogar();
      const { data: coupleData, error: coupleError } = await sb.from('couples').insert({ invite_code: inviteCode, created_by: SESSION.user.id }).select('id').single();
      if(coupleError) throw coupleError;
      const coupleId = coupleData.id;
      const slot = 'P1';
      const { error: memberError } = await sb.from('couple_members').insert({ couple_id: coupleId, user_id: SESSION.user.id, slot });
      if(memberError) throw memberError;
      await sb.from('profiles').insert({ user_id: SESSION.user.id, couple_id: coupleId, slot, nombre: SESSION.user.email.split('@')[0], avatar: '🐰' });
      await sb.from('pareja').insert({ couple_id: coupleId });
      await sb.from('extras').insert({ couple_id: coupleId });
      SESSION.coupleId = coupleId; SESSION.slot = slot;
      await guardarPersonalizacionMundoInicial(nombreMundo, temaMundo);
      const card = document.getElementById('obCard');
      card.innerHTML = `<div class="ob-seal">🔑</div><h1>¡${esc(PERSONALIZACION.nombreMundo||'Su mundo')} está listo!</h1><p class="ob-sub">Este es el código de su hogar. Compártelo con tu pareja:</p>
      ${botonesCompartirMundoHTML(inviteCode)}
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="entrarApp()">Entrar a nuestro mundo 💫</button>
      <p class="hint">Guarda este código, lo necesitarán para unirse desde otro dispositivo.</p>`;
    } catch (fallbackError) {
      toast('No se pudo crear el hogar');
      console.error(fallbackError);
    }
  }
}
async function unirseHogar(){
  const code = document.getElementById('jCode').value.trim().toUpperCase();
  if(!code){ toast('Escribe el código'); return; }
  try {
    const { data, error } = await sb.rpc('join_couple', { p_code: code });
    if(!error && data && data[0]){
      const row = data[0];
      SESSION.coupleId = row.couple_id; SESSION.slot = row.slot;
      toast('¡Se unieron! Bienvenido/a 💞');
      await entrarApp();
      return;
    }
    throw error || new Error('RPC join_couple no disponible');
  } catch (err) {
    console.warn('Fallo la RPC join_couple, usando fallback', err);
    try {
      const { data: coupleData, error: coupleError } = await sb.from('couples').select('id').eq('invite_code', code).maybeSingle();
      if(coupleError) throw coupleError;
      if(!coupleData){ toast('Código no encontrado'); return; }
      const { data: miembrosData, error: miembrosError } = await sb.from('couple_members').select('slot').eq('couple_id', coupleData.id);
      if(miembrosError) throw miembrosError;
      const slotsUsados = new Set((miembrosData||[]).map(m=>m.slot));
      const slot = slotsUsados.has('P1') ? 'P2' : 'P1';
      const { error: insertError } = await sb.from('couple_members').insert({ couple_id: coupleData.id, user_id: SESSION.user.id, slot });
      if(insertError) throw insertError;
      const { data: perfilData } = await sb.from('profiles').select('*').eq('user_id', SESSION.user.id).maybeSingle();
      if(!perfilData){
        await sb.from('profiles').insert({ user_id: SESSION.user.id, couple_id: coupleData.id, slot, nombre: SESSION.user.email.split('@')[0], avatar: slot==='P1'?'🐰':'🐱' });
      } else {
        await sb.from('profiles').update({ couple_id: coupleData.id, slot }).eq('user_id', SESSION.user.id);
      }
      await sb.from('pareja').upsert({ couple_id: coupleData.id }, { onConflict: 'couple_id' });
      await sb.from('extras').upsert({ couple_id: coupleData.id }, { onConflict: 'couple_id' });
      SESSION.coupleId = coupleData.id; SESSION.slot = slot;
      toast('¡Se unieron! Bienvenido/a 💞');
      await entrarApp();
    } catch (fallbackError) {
      toast('No se pudo unir al hogar');
      console.error(fallbackError);
    }
  }
}

/* ================= entrar a la app ================= */
async function entrarApp(){
  if(SESSION.user?.user_metadata?.demo){
    MEMBERS = { P1: SESSION.user.id };
    CACHE.perfiles = { P1: { nombre: SESSION.user.email.split('@')[0], avatar: '🐰', slot: 'P1' } };
    document.getElementById('onboarding').style.display='none';
    document.getElementById('app').style.display='block';
    activeTab = 'inicio';
    buildTabbar();
    pintarAvatarHeader(CACHE.perfiles[SESSION.slot]||{}); pintarAvatarHeaderPareja();
    await cargarPersonalizacion();
    render();
    return;
  }
  const { data: miembros } = await sb.from('couple_members').select('user_id, slot').eq('couple_id', SESSION.coupleId);
  MEMBERS = {};
  (miembros||[]).forEach(m=> MEMBERS[m.slot] = m.user_id);

  // asegurar que exista mi fila de perfil
  const { data: miPerfil } = await sb.from('profiles').select('*').eq('user_id', SESSION.user.id).maybeSingle();
  if(!miPerfil){
    await sb.from('profiles').insert({ user_id:SESSION.user.id, couple_id:SESSION.coupleId, slot:SESSION.slot, nombre: SESSION.user.email.split('@')[0], avatar: SESSION.slot==='P1'?'🐰':'🐱' });
  }
  await cargarPerfiles();

  document.getElementById('onboarding').style.display='none';
  document.getElementById('app').style.display='block';
  buildTabbar();
  pintarAvatarHeader(CACHE.perfiles[SESSION.slot]||{}); pintarAvatarHeaderPareja();
  await cargarPersonalizacion();
  render();
  suscribirRealtime();
  iniciarPresencia();
  // Autoreparación silenciosa: si el navegador ya tenía permiso de notificaciones
  // concedido pero el token de este dispositivo nunca se guardó (o se perdió) en
  // push_tokens, lo renovamos aquí sin pedirle nada a la persona. Antes esto solo
  // pasaba si abrían Configuración > Notificaciones, así que muchos dispositivos
  // quedaban "activados" a medias sin que nadie lo notara.
  if(typeof verificarYRenovarTokenPush==='function') verificarYRenovarTokenPush();
  setInterval(()=>{ if(activeTab==='inicio') renderInicio(); }, 60000);
  revisarEventosEspeciales();
}
async function cargarPerfiles(){
  const { data } = await sb.from('profiles').select('*').eq('couple_id', SESSION.coupleId);
  CACHE.perfiles = {};
  (data||[]).forEach(p=> CACHE.perfiles[p.slot]=p);
}
function suscribirRealtime(){
  if(isDemoMode()){ return; }
  if(window._hogarChannel){ try{ sb.removeChannel(window._hogarChannel); }catch(e){} window._hogarChannel = null; }
  window._hogarChannel = sb.channel('hogar-'+SESSION.coupleId)
    .on('postgres_changes',{event:'*',schema:'public',table:'chat_mensajes',filter:`couple_id=eq.${SESSION.coupleId}`}, (payload)=>{
      // '*' cubre inserciones (mensaje nuevo), ediciones, borrados, reacciones y confirmaciones
      // de entrega/lectura: así el chat se actualiza solo, sin recargar la página.
      if(payload.eventType==='INSERT' && typeof reproducirSonido==='function') reproducirSonido('mensajes');
      if(activeTab==='chat') renderChat();
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'extras',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='inicio') renderInicio(); if(activeTab==='extras') renderExtras(); if(activeTab==='juegos') renderJuegos(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'pareja',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='nosotros') renderNosotros(); if(activeTab==='inicio') renderInicio(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'compatibilidad_respuestas',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='compatibilidad') renderCompatibilidad(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'mbti_tests',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='compatibilidad') renderCompatibilidad(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'gamificacion',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='nosotros') renderNosotros(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'calendario',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='calendario') renderCalendario(); if(activeTab==='inicio') renderInicio(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'cartas',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='cartas') renderCartas(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'album',filter:`couple_id=eq.${SESSION.coupleId}`}, ()=>{ if(activeTab==='album') renderAlbum(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'album_comentarios'}, (payload)=>{ const overlay=document.getElementById('albumModalOverlay'); const albumId=(payload.new&&payload.new.album_id)||(payload.old&&payload.old.album_id); if(overlay && albumId && window._albumItems && window._albumItems.some(a=>a.id===albumId)) abrirItemAlbum(albumId); })
    .on('postgres_changes',{event:'*',schema:'public',table:'album_reacciones'}, (payload)=>{ const overlay=document.getElementById('albumModalOverlay'); const albumId=(payload.new&&payload.new.album_id)||(payload.old&&payload.old.album_id); if(overlay && albumId && window._albumItems && window._albumItems.some(a=>a.id===albumId)) abrirItemAlbum(albumId); })
    .on('postgres_changes',{event:'*',schema:'public',table:'profiles',filter:`couple_id=eq.${SESSION.coupleId}`}, async ()=>{ await cargarPerfiles(); if(['inicio','conoceme'].includes(activeTab)) render(); if(typeof pintarEstadoHeader==='function') pintarEstadoHeader(); if(activeTab==='chat' && typeof pintarPresenciaChat==='function') pintarPresenciaChat(); })
    // Señalización de llamadas de audio/video (oferta/aceptada/rechazada/colgada): viaja
    // por este mismo canal en vez de tocar la base de datos, para que sea instantánea.
    .on('broadcast', {event:'llamada'}, (payload)=>{ if(typeof manejarSenalLlamada==='function') manejarSenalLlamada(payload.payload); })
    .subscribe((estado)=>{
      // El socket de tiempo real a veces se cae solo (el celular bloquea pantalla, se
      // pierde el wifi un instante, etc.). Si eso pasa, en vez de quedarse "sordo" para
      // siempre, esperamos un momento y nos reconectamos solos; y en cuanto la reconexión
      // se confirma, si la persona está viendo el chat, lo refrescamos para traer de una
      // vez cualquier mensaje que se haya quedado esperando.
      if(estado==='SUBSCRIBED'){
        window._realtimeReintentos = 0;
        if(activeTab==='chat') renderChat();
      } else if(estado==='CHANNEL_ERROR' || estado==='TIMED_OUT' || estado==='CLOSED'){
        window._realtimeReintentos = (window._realtimeReintentos||0) + 1;
        const espera = Math.min(1000 * window._realtimeReintentos, 8000);
        clearTimeout(window._realtimeReintentoTimer);
        window._realtimeReintentoTimer = setTimeout(()=>{ if(window.SESSION && SESSION.coupleId) suscribirRealtime(); }, espera);
      }
    });
}

/* ================= PRESENCIA (en línea / última vez) =================
   Cada usuario "marca" que sigue activo actualizando profiles.last_seen cada cierto
   tiempo mientras la pestaña está visible. Como la tabla profiles ya está suscrita
   arriba en tiempo real, en cuanto la pareja actualiza su last_seen, el otro lado
   recibe el cambio al instante (sin recargar) y puede mostrar "En línea" o calcular
   hace cuánto fue su "última vez". */
const PRESENCIA_INTERVALO_MS = 20000; // cada 20s mientras la app está abierta y visible
const PRESENCIA_UMBRAL_MS = 45000;    // si el último "latido" fue hace menos de esto, se considera "en línea"
async function marcarPresenciaActiva(){
  if(isDemoMode() || !SESSION?.user?.id || document.visibilityState!=='visible') return;
  try{
    const ahora = new Date().toISOString();
    await sb.from('profiles').update({ last_seen: ahora }).eq('user_id', SESSION.user.id);
    if(CACHE.perfiles && CACHE.perfiles[SESSION.slot]) CACHE.perfiles[SESSION.slot].last_seen = ahora;
  }catch(e){ console.error('No se pudo actualizar la presencia', e); }
}
function iniciarPresencia(){
  if(isDemoMode() || window._presenciaInterval) return;
  marcarPresenciaActiva();
  window._presenciaInterval = setInterval(marcarPresenciaActiva, PRESENCIA_INTERVALO_MS);
}
function estaEnLinea(perfil){
  if(!perfil || !perfil.last_seen) return false;
  return (Date.now() - new Date(perfil.last_seen).getTime()) < PRESENCIA_UMBRAL_MS;
}
function formatearUltimaVez(perfil){
  if(!perfil || !perfil.last_seen) return 'Sin conexión reciente';
  if(estaEnLinea(perfil)) return 'En línea';
  const fecha = new Date(perfil.last_seen);
  const hoy = new Date();
  const esHoy = fecha.toDateString()===hoy.toDateString();
  const ayerFecha = new Date(hoy); ayerFecha.setDate(hoy.getDate()-1);
  const esAyer = fecha.toDateString()===ayerFecha.toDateString();
  const hora = fecha.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  if(esHoy) return `Últ. vez hoy a las ${hora}`;
  if(esAyer) return `Últ. vez ayer a las ${hora}`;
  return `Últ. vez el ${fecha.toLocaleDateString('es-ES',{day:'numeric',month:'short'})} a las ${hora}`;
}
// Construye el enlace de invitación a partir del código del hogar. Cualquiera que lo abra
// llega directo a la pantalla de "unirme" con el código ya escrito.
function enlaceInvitacionMundo(code){
  const base = window.location.href.split('#')[0].split('?')[0];
  return `${base}?invite=${encodeURIComponent(code)}`;
}
async function copiarCodigoMundo(code){
  try{
    await navigator.clipboard.writeText(code);
    toast('Código copiado al portapapeles 📋');
  }catch(e){
    console.error('No se pudo copiar el código', e);
    toast('No se pudo copiar. Copia el código manualmente: '+code);
  }
}
async function compartirEnlaceInvitacion(code){
  const enlace = enlaceInvitacionMundo(code);
  if(navigator.share){
    try{
      await navigator.share({ title:'Notre petit monde', text:'Únete a nuestro mundo en Notre petit monde 💌', url: enlace });
      return;
    }catch(e){
      // La persona canceló el diálogo de compartir, o el navegador no pudo abrirlo;
      // en ambos casos ofrecemos copiar el enlace como alternativa.
      if(e && e.name==='AbortError') return;
    }
  }
  try{
    await navigator.clipboard.writeText(enlace);
    toast('Enlace de invitación copiado al portapapeles 🔗');
  }catch(e){
    console.error('No se pudo copiar el enlace', e);
    toast('No se pudo copiar. Copia el enlace manualmente: '+enlace);
  }
}
// HTML reutilizable con el código del hogar y los dos botones para compartirlo,
// usado tanto al crear el mundo como en Ajustes → General → "Ver código".
function botonesCompartirMundoHTML(code){
  return `
    <div class="code-badge">${esc(code)}</div>
    <div class="row" style="gap:8px;margin-top:10px">
      <button class="btn btn-sm btn-outline" style="flex:1" onclick="copiarCodigoMundo('${jsAttr(code)}')">📋 Copiar código</button>
      <button class="btn btn-sm btn-outline" style="flex:1" onclick="compartirEnlaceInvitacion('${jsAttr(code)}')">🔗 Compartir enlace</button>
    </div>`;
}
function verCodigo(){
  sb.from('couples').select('invite_code').eq('id', SESSION.coupleId).maybeSingle().then(({data})=>{
    if(!data) return;
    const anterior = document.getElementById('codigoMundoOverlay'); if(anterior) anterior.remove();
    const overlay = document.createElement('div');
    overlay.id = 'codigoMundoOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = `
      <div style="background:var(--crema);border-radius:18px;max-width:360px;width:100%;padding:22px;text-align:center;position:relative">
        <button onclick="document.getElementById('codigoMundoOverlay').remove()" style="position:absolute;top:10px;right:10px;border:none;background:rgba(0,0,0,.08);width:28px;height:28px;border-radius:50%">✕</button>
        <div style="font-size:26px">🔗</div>
        <h2 style="margin:6px 0">Código de su mundo</h2>
        <p class="muted small">Compártelo con tu pareja para que se una.</p>
        ${botonesCompartirMundoHTML(data.invite_code)}
      </div>`;
    document.body.appendChild(overlay);
  });
}

/* ================= perfil ================= */
function pintarAvatarHeader(perfil){
  const el = document.getElementById('miAvatarBtn');
  if(perfil.foto_url){ el.innerHTML = `<img src="${perfil.foto_url}" alt="">`; }
  else { el.innerHTML = `<span id="miAvatar" class="chibi-icon-mini">${chibiAvatarSVG(perfilChibiConfig(perfil), true)}</span>`; }
}
function pintarAvatarHeaderPareja(){
  const btn = document.getElementById('suAvatarBtn');
  if(!btn) return;
  const perfil = CACHE.perfiles[otroSlot()] || {};
  if(!perfil.user_id){ btn.innerHTML = `<span id="suAvatar" style="opacity:.35">💗</span>`; return; }
  if(perfil.foto_url){ btn.innerHTML = `<img src="${perfil.foto_url}" alt="">`; }
  else { btn.innerHTML = `<span id="suAvatar" class="chibi-icon-mini">${chibiAvatarSVG(perfilChibiConfig(perfil), true)}</span>`; }
}
function calcularEdadTexto(fechaISO){
  const hoy = new Date();
  const d = new Date(fechaISO+'T00:00:00');
  let edad = hoy.getFullYear() - d.getFullYear();
  const noHaCumplidoAun = (hoy.getMonth()<d.getMonth()) || (hoy.getMonth()===d.getMonth() && hoy.getDate()<d.getDate());
  if(noHaCumplidoAun) edad--;
  return edad+' años';
}
function avatarChicoHTML(perfil){
  if(perfil && perfil.foto_url) return `<img src="${perfil.foto_url}" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid var(--dorado)">`;
  return `<div class="av-chibi-frame" style="width:84px;height:84px;margin:0 auto">${chibiAvatarSVG(perfilChibiConfig(perfil||{}))}</div>`;
}
/* "Nuestro perfil": tarjeta COMPARTIDA de la pareja, no el perfil individual
   de uno solo. Muestra a ambos lado a lado, los datos que pertenecen a la
   relación (días juntos, aniversario, canción y frase de pareja, tomados de
   la tabla "pareja") y, debajo, un acceso rápido al perfil individual de
   cada quien para quien quiera ver más detalle personal. */
async function verPerfilPareja(){
  const mi = CACHE.perfiles[SESSION.slot] || {};
  const su = CACHE.perfiles[otroSlot()] || {};
  if(!su.user_id){ toast('Tu pareja aún no se ha unido al hogar 💌'); return; }
  cerrarModalPerfilPareja();

  let pareja = {};
  try{ pareja = (typeof getPareja==='function') ? await getPareja() : {}; }catch(e){}

  const hoy = new Date();
  let diasJuntos = null, cuentaAniv = null;
  if(pareja.inicio){ const d0=new Date(pareja.inicio+'T00:00:00'); diasJuntos = Math.max(0, Math.floor((hoy-d0)/86400000)); }
  if(pareja.aniversario){
    const [,mm,dd] = pareja.aniversario.split('-');
    let next = new Date(hoy.getFullYear(), parseInt(mm)-1, parseInt(dd));
    if(next<hoy) next = new Date(hoy.getFullYear()+1, parseInt(mm)-1, parseInt(dd));
    cuentaAniv = Math.ceil((next-hoy)/86400000);
  }

  const overlay = document.createElement('div');
  overlay.id = 'perfilParejaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(30,20,30,.75);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px 22px 0 0;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;padding:22px;position:relative;text-align:center">
      <button onclick="cerrarModalPerfilPareja()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <h2 style="margin-bottom:2px">Nuestro perfil 💞</h2>
      ${PERSONALIZACION && PERSONALIZACION.nombreMundo ? `<div class="muted small">${esc(PERSONALIZACION.nombreMundo)}</div>` : ''}

      <div style="display:flex;justify-content:center;align-items:center;gap:14px;margin:16px 0 4px">
        <div style="text-align:center;cursor:pointer" onclick="cerrarModalPerfilPareja();verPerfil()">
          ${avatarChicoHTML(mi)}
          <div class="small" style="margin-top:4px;font-weight:600">${esc(mi.apodo||mi.nombre||'Tú')}</div>
        </div>
        <div style="font-size:22px">💗</div>
        <div style="text-align:center;cursor:pointer" onclick="cerrarModalPerfilPareja();verPerfilIndividualPareja()">
          ${avatarChicoHTML(su)}
          <div class="small" style="margin-top:4px;font-weight:600">${esc(su.apodo||su.nombre||'Pareja')}</div>
        </div>
      </div>

      ${diasJuntos!==null || cuentaAniv!==null ? `<div class="card" style="margin-top:14px;text-align:left">
        ${diasJuntos!==null?`<div><b>${diasJuntos}</b> días juntos</div>`:''}
        ${cuentaAniv!==null?`<div class="muted small" style="margin-top:4px">🎉 Faltan ${cuentaAniv} días para su aniversario</div>`:''}
      </div>`:''}

      ${pareja.cancion || pareja.frase ? `<div class="card" style="margin-top:12px;text-align:left">
        ${pareja.cancion?`<div><b>🎵 Su canción:</b> ${esc(pareja.cancion)}</div>`:''}
        ${pareja.frase?`<div style="margin-top:6px;font-style:italic;color:var(--tinta)">"${esc(pareja.frase)}"</div>`:''}
      </div>`:''}

      <div class="row" style="margin-top:16px;gap:8px">
        <button class="btn btn-outline" style="flex:1" onclick="cerrarModalPerfilPareja();verPerfil()">✏️ Editar mi perfil</button>
        <button class="btn btn-outline" style="flex:1" onclick="cerrarModalPerfilPareja();switchTab('nosotros')">💞 Editar nuestra historia</button>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="cerrarModalPerfilPareja();conocemeView=otroSlot();switchTab('conoceme')">Conocer más sobre ${esc(su.apodo||su.nombre||'ella/él')} 💭</button>
    </div>`;
  document.body.appendChild(overlay);
}
/* Ficha individual de tu pareja (foto, bio, cumpleaños, firma). Antes esto
   era lo único que mostraba "Perfil de pareja"; ahora es una vista aparte,
   accesible desde "Nuestro perfil", para no confundir lo compartido con lo
   individual. */
async function verPerfilIndividualPareja(){
  const p = CACHE.perfiles[otroSlot()] || {};
  if(!p.user_id){ toast('Tu pareja aún no se ha unido al hogar 💌'); return; }
  cerrarModalPerfilPareja();
  const overlay = document.createElement('div');
  overlay.id = 'perfilParejaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(30,20,30,.75);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px 22px 0 0;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;padding:22px;position:relative;text-align:center">
      <button onclick="cerrarModalPerfilPareja()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <div style="margin:8px auto 14px">
        ${p.foto_url ? `<img src="${p.foto_url}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid var(--dorado)">` : `<div class="av-chibi-frame" style="width:110px;height:110px;margin:0 auto">${chibiAvatarSVG(perfilChibiConfig(p))}</div>`}
      </div>
      <h2 style="margin-bottom:2px">${esc(p.apodo || p.nombre || 'Tu pareja')}</h2>
      ${p.nombre && p.apodo ? `<div class="muted small">${esc(p.nombre)}</div>` : ''}
      ${p.pronombres? `<div class="chip" style="margin-top:8px;display:inline-block">${esc(p.pronombres)}</div>`:''}
      ${p.bio? `<p style="margin-top:14px;font-style:italic;color:var(--tinta)">"${esc(p.bio)}"</p>`:''}
      ${p.cumple? `<div class="card" style="margin-top:14px;text-align:left"><h3>🎂 Cumpleaños</h3><div>${new Date(p.cumple+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long'})} · ${calcularEdadTexto(p.cumple)}</div></div>`:''}
      ${p.firma_url? `<div style="margin-top:14px"><div class="muted small" style="margin-bottom:4px">Su firma</div><img src="${p.firma_url}" style="max-width:180px;max-height:80px"></div>`:''}
      <button class="btn btn-primary btn-block" style="margin-top:18px" onclick="cerrarModalPerfilPareja();conocemeView=otroSlot();switchTab('conoceme')">Ver más sobre ${esc(p.apodo||p.nombre||'ella/él')} 💭</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="cerrarModalPerfilPareja();verPerfilPareja()">← Volver a Nuestro perfil</button>
    </div>`;
  document.body.appendChild(overlay);
}
function cerrarModalPerfilPareja(){ const o=document.getElementById('perfilParejaOverlay'); if(o) o.remove(); }
async function verPerfil(){
  const perfil = CACHE.perfiles[SESSION.slot] || {};
  document.getElementById('main').innerHTML = `
  <div class="card">
    <h2>Mi perfil</h2>
    <div class="avatar-preview-wrap">
      <div id="pf-preview">${perfil.foto_url ? `<img class="avatar-preview" src="${perfil.foto_url}">` : `<div class="av-chibi-frame" style="width:96px;height:96px;margin:0 auto">${chibiAvatarSVG(perfilChibiConfig(perfil), true)}</div>`}</div>
      <div class="row">
        <label class="btn btn-sm btn-outline" style="cursor:pointer">Subir foto<input type="file" id="pf-foto-input" accept="image/*" style="display:none"></label>
        ${perfil.foto_url ? `<button class="btn btn-sm btn-ghost" onclick="quitarFotoPerfil()">Quitar foto</button>` : ''}
      </div>
      <button class="btn btn-sm btn-outline" style="margin-top:8px" onclick="switchTab('avatar')">✏️ Editar mi avatar chibi</button>
    </div>
    <div class="field"><label>Nombre</label><input id="pf-nombre" value="${esc(perfil.nombre||'')}"></div>
    <div class="grid2">
      <div class="field"><label>Apodo</label><input id="pf-apodo" value="${esc(perfil.apodo||'')}"></div>
      <div class="field"><label>Pronombres</label><input id="pf-pron" value="${esc(perfil.pronombres||'')}"></div>
    </div>
    <div class="grid2">
      <div class="field"><label>Cumpleaños</label><input type="date" id="pf-cumple" value="${perfil.cumple||''}"></div>
      <div class="field"><label>Color favorito</label><input id="pf-color" value="${esc(perfil.color||'')}"></div>
    </div>
    <div class="field"><label>Biografía</label><textarea id="pf-bio">${esc(perfil.bio||'')}</textarea></div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" id="pf-guardar">Guardar cambios</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="render()">Cancelar</button>
  </div>`;
  let fotoSel = perfil.foto_url || null;
  let fotoDataUrl = null;
  document.getElementById('pf-foto-input').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const img = new Image();
      img.onload = ()=>{
        const size=400, c=document.createElement('canvas'); c.width=size; c.height=size;
        const cx=c.getContext('2d'); const scale=Math.max(size/img.width,size/img.height);
        const sw=img.width*scale, sh=img.height*scale;
        cx.drawImage(img,(size-sw)/2,(size-sh)/2,sw,sh);
        fotoDataUrl = c.toDataURL('image/jpeg',0.75);
        document.getElementById('pf-preview').innerHTML = `<img class="avatar-preview" src="${fotoDataUrl}">`;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  window._pfQuitarFoto = ()=>{ fotoSel=null; fotoDataUrl=null; document.getElementById('pf-preview').innerHTML = `<div class="av-chibi-frame" style="width:96px;height:96px;margin:0 auto">${chibiAvatarSVG(perfilChibiConfig(perfil), true)}</div>`; };
  document.getElementById('pf-guardar').onclick = async ()=>{
    const btn = document.getElementById('pf-guardar');
    btn.innerHTML = '<span class="spinner"></span>'; btn.disabled=true;
    const upd = {
      nombre: document.getElementById('pf-nombre').value.trim(),
      apodo: document.getElementById('pf-apodo').value.trim(),
      pronombres: document.getElementById('pf-pron').value.trim(),
      cumple: document.getElementById('pf-cumple').value || null,
      color: document.getElementById('pf-color').value.trim(),
      bio: document.getElementById('pf-bio').value.trim(),
      updated_at: new Date().toISOString()
    };
    if(fotoDataUrl){ upd.foto_url = await subirImagen(fotoDataUrl, 'perfil', 'avatar'); }
    else if(fotoSel===null && (CACHE.perfiles[SESSION.slot]||{}).foto_url){ upd.foto_url = null; }
    const { error } = await sb.from('profiles').update(upd).eq('user_id', SESSION.user.id);
    if(error){ toast('No se pudo guardar'); console.error(error); btn.disabled=false; btn.textContent='Guardar cambios'; return; }
    await cargarPerfiles();
    pintarAvatarHeader(CACHE.perfiles[SESSION.slot]); pintarAvatarHeaderPareja();
    toast('Perfil actualizado 💗');
    render();
  };
  window.scrollTo({top:0});
}
function quitarFotoPerfil(){ window._pfQuitarFoto && window._pfQuitarFoto(); }

/* ================= tabs ================= */
const TABS = [
  {id:'inicio', ic:'🏡', label:'Inicio'},{id:'conoceme', ic:'💭', label:'Conóceme'},{id:'nosotros', ic:'💞', label:'Nosotros'},
  {id:'conexion', ic:'🌸', label:'Conexión'},{id:'cartas', ic:'💌', label:'Cartas'},{id:'crear', ic:'🎨', label:'Crear'},{id:'album', ic:'🖼️', label:'Álbum'},
  {id:'calendario', ic:'📅', label:'Calendario'},{id:'chat', ic:'💬', label:'Chat'},
  {id:'musica', ic:'🎵', label:'Música'},{id:'entretenimiento', ic:'🎬', label:'Entretenimiento'},
  {id:'regalos', ic:'🎁', label:'Regalos'},{id:'juegos', ic:'🎲', label:'Juegos'},{id:'compatibilidad', ic:'🧩', label:'Compatibilidad'},
  {id:'recuerdos', ic:'📖', label:'Recuerdos'},{id:'extras', ic:'✨', label:'Extras'},
  {id:'emojis', ic:'😊', label:'Emojis'},{id:'avatar', ic:'👤', label:'Avatar'},
  {id:'config', ic:'⚙️', label:'Ajustes'},
];
let activeTab='inicio';
function buildTabbar(){
  const bar = document.getElementById('tabbar');
  if(!bar) return;
  const ocultas = new Set((typeof PERSONALIZACION!=='undefined' && PERSONALIZACION.tabsOcultas) || []);
  const cats = (typeof CATEGORIAS_NAV!=='undefined') ? CATEGORIAS_NAV : TABS.map(t=>({id:t.id, ic:t.ic, label:t.label, tab:t.id}));
  bar.innerHTML = cats.map(cat=>{
    if(!cat.subs){
      if(ocultas.has(cat.tab) && cat.tab!=='inicio' && cat.tab!=='config') return '';
      return `<button data-tab="${cat.tab}" class="${cat.tab===activeTab?'active':''}"><span class="ic">${cat.ic}</span>${cat.label}</button>`;
    }
    const visibles = cat.subs.filter(s=>!s.tab || !ocultas.has(s.tab));
    if(!visibles.length) return '';
    const activa = cat.subs.some(s=>s.tab===activeTab);
    return `<button type="button" class="tabbar-cat-btn ${activa?'active':''}" data-catid="${cat.id}" onclick="toggleCatPopover(event,'${cat.id}')"><span class="ic">${cat.ic}</span>${cat.label}</button>`;
  }).join('');
  bar.querySelectorAll('button[data-tab]').forEach(b=>b.onclick=()=>{ switchTab(b.dataset.tab); });
}
function switchTab(id){
  activeTab=id;
  buildTabbar();
  render();
  window.scrollTo({top:0, behavior:'smooth'});
}
function render(){
  const fn = { inicio: renderInicio, conoceme: renderConoceme, nosotros: renderNosotros, cartas: renderCartas,
    crear: renderCrear, album: renderAlbum, calendario: renderCalendario, chat: renderChat,
    musica: renderMusica, entretenimiento: renderEntretenimiento,
    conexion: renderConexion, regalos: renderRegalos, juegos: renderJuegos, compatibilidad: renderCompatibilidad,
    recuerdos: renderRecuerdos, extras: renderExtras, emojis: renderEmojis, avatar: renderAvatar, config: renderConfig }[activeTab];
  if(fn) fn();
}

/* ================= INICIO ================= */
