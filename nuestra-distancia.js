/* ================= LLAMADAS DE AUDIO/VIDEO (LiveKit) =================
   Se integra en la pestaña "Chat privado 💬": un botón de llamada de voz y
   otro de videollamada. La señalización de "te está llamando" / "aceptó" /
   "rechazó" / "colgó" viaja por el canal de Supabase Realtime que ya existe
   para el hogar de la pareja (window._hogarChannel), así no se necesita
   ningún servidor propio de señalización.
   El audio/video en sí viaja por LiveKit (WebRTC), usando un token que se
   pide a /api/livekit-token (el secreto nunca llega al navegador). */

const LIVEKIT_URL_FALLBACK = 'wss://lingua-rgkmy7ud.livekit.cloud';

let LLAMADA = {
  activa: false,
  video: false,
  room: null,        // instancia de LivekitClient.Room
  saliente: false,    // true si YO inicié la llamada y estoy esperando respuesta
  fuiIniciador: false, // true si YO marqué (se mantiene aunque "saliente" pase a false al conectar)
  entrante: null,     // datos de la oferta entrante mientras suena
  inicio: null,       // timestamp de conexión (para el cronómetro)
  micApagado: false,
  camApagada: false,
  timerId: null,
};

/* ---------- Registro de la llamada como mensaje del chat ----------
   Solo quien marcó (fuiIniciador) escribe el registro, para que no se
   duplique el mensaje del lado de quien contesta/rechaza. El registro
   incluye tipo (voz/video), resultado y duración exacta. */
async function registrarLlamadaEnChat(estado, duracionMs){
  if(typeof enviarMensajeEspecial !== 'function') return;
  const detalle = JSON.stringify({ video: !!LLAMADA.video, estado, duracion: Math.max(0, Math.round((duracionMs||0)/1000)) });
  try{ await enviarMensajeEspecial('llamada', detalle); }
  catch(e){ console.error('No se pudo registrar la llamada en el chat', e); }
}

function idSalaLlamada(){ return 'llamada-' + SESSION.coupleId; }
function miIdentidadLlamada(){ return `${SESSION.slot}-${SESSION.user.id}`; }
function nombreMio(){ return (CACHE.perfiles && CACHE.perfiles[SESSION.slot] && CACHE.perfiles[SESSION.slot].nombre) || 'Yo'; }

function enviarSenalLlamada(payload){
  if(!window._hogarChannel) return;
  window._hogarChannel.send({ type:'broadcast', event:'llamada', payload: { ...payload, de: SESSION.slot } });
}

// Punto de entrada llamado desde core.js cuando llega un broadcast tipo "llamada"
function manejarSenalLlamada(data){
  if(!data || data.de === SESSION.slot) return; // ignorar mis propias señales
  if(data.tipo === 'oferta'){
    if(LLAMADA.activa || LLAMADA.entrante){
      // Ya estoy en otra llamada: rechazo automáticamente
      enviarSenalLlamada({ tipo:'rechazada', room: data.room });
      return;
    }
    LLAMADA.entrante = data;
    mostrarBannerEntrante(data);
    if(typeof reproducirSonido==='function') reproducirSonido('llamada');
  } else if(data.tipo === 'aceptada'){
    if(LLAMADA.saliente){ ocultarEsperandoRespuesta(); }
  } else if(data.tipo === 'rechazada'){
    if(LLAMADA.saliente){ toast('💔 No contestaron la llamada'); registrarLlamadaEnChat('rechazada', 0); finalizarLlamadaLocal(); }
  } else if(data.tipo === 'colgada'){
    if(LLAMADA.activa){ toast('📴 Tu pareja colgó'); finalizarLlamadaLocal(); }
    ocultarBannerEntrante();
  }
}

/* ---------- Iniciar / contestar / rechazar / colgar ---------- */

async function iniciarLlamada(video){
  if(LLAMADA.activa || LLAMADA.saliente){ toast('Ya hay una llamada en curso'); return; }
  if(typeof LivekitClient === 'undefined'){ toast('No se pudo cargar el módulo de llamadas'); return; }
  LLAMADA.saliente = true;
  LLAMADA.fuiIniciador = true;
  LLAMADA.video = !!video;
  mostrarEsperandoRespuesta(video);
  enviarSenalLlamada({ tipo:'oferta', video: !!video, room: idSalaLlamada() });
  const ok = await conectarSala(video);
  if(!ok){ toast('No se pudo iniciar la llamada'); finalizarLlamadaLocal(); return; }
}

async function contestarLlamada(){
  const oferta = LLAMADA.entrante;
  if(!oferta) return;
  ocultarBannerEntrante();
  LLAMADA.video = !!oferta.video;
  enviarSenalLlamada({ tipo:'aceptada', room: oferta.room });
  const ok = await conectarSala(oferta.video);
  if(!ok){ toast('No se pudo contestar la llamada'); finalizarLlamadaLocal(); }
}

function rechazarLlamada(){
  const oferta = LLAMADA.entrante;
  ocultarBannerEntrante();
  if(oferta) enviarSenalLlamada({ tipo:'rechazada', room: oferta.room });
  LLAMADA.entrante = null;
}

function colgarLlamada(){
  enviarSenalLlamada({ tipo:'colgada', room: idSalaLlamada() });
  finalizarLlamadaLocal();
}

/* ---------- Conexión a LiveKit ---------- */

async function conectarSala(video){
  try{
    const identity = miIdentidadLlamada();
    const room = idSalaLlamada();
    const resp = await fetch(`/api/livekit-token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(nombreMio())}`);
    if(!resp.ok){ throw new Error('token'); }
    const { token, url } = await resp.json();
    const livekitUrl = url || LIVEKIT_URL_FALLBACK;

    const salaLK = new LivekitClient.Room({ adaptiveStream:true, dynacast:true });
    LLAMADA.room = salaLK;

    salaLK.on(LivekitClient.RoomEvent.TrackSubscribed, (track, pub, participante)=>{
      adjuntarPistaRemota(track, participante);
    });
    salaLK.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track)=>{ track.detach(); });
    salaLK.on(LivekitClient.RoomEvent.Disconnected, ()=>{ finalizarLlamadaLocal(); });
    salaLK.on(LivekitClient.RoomEvent.ParticipantDisconnected, ()=>{
      const remoto = document.getElementById('llamadaVideoRemoto');
      if(remoto) remoto.innerHTML = '<div class="llamada-avatar-espera">💤</div>';
    });

    await salaLK.connect(livekitUrl, token);
    await salaLK.localParticipant.setMicrophoneEnabled(true);
    if(video) await salaLK.localParticipant.setCameraEnabled(true);

    LLAMADA.activa = true;
    LLAMADA.saliente = false;
    LLAMADA.entrante = null;
    LLAMADA.inicio = Date.now();
    ocultarEsperandoRespuesta();
    mostrarPanelLlamada(video);

    // Vista local
    salaLK.localParticipant.videoTrackPublications.forEach(pub=>{
      if(pub.track) adjuntarPistaLocal(pub.track);
    });

    return true;
  }catch(e){
    console.error('Error conectando llamada', e);
    return false;
  }
}

function finalizarLlamadaLocal(){
  if(LLAMADA.activa && LLAMADA.fuiIniciador && LLAMADA.inicio){
    // La llamada sí se conectó: registra la duración real en el chat.
    registrarLlamadaEnChat('realizada', Date.now()-LLAMADA.inicio);
  }
  if(LLAMADA.room){
    try{ LLAMADA.room.disconnect(); }catch(e){}
  }
  if(LLAMADA.timerId){ clearInterval(LLAMADA.timerId); }
  LLAMADA = { activa:false, video:false, room:null, saliente:false, fuiIniciador:false, entrante:null, inicio:null, micApagado:false, camApagada:false, timerId:null };
  ocultarEsperandoRespuesta();
  ocultarPanelLlamada();
}

/* ---------- Controles durante la llamada ---------- */

function toggleMicLlamada(){
  if(!LLAMADA.room) return;
  LLAMADA.micApagado = !LLAMADA.micApagado;
  LLAMADA.room.localParticipant.setMicrophoneEnabled(!LLAMADA.micApagado);
  const btn = document.getElementById('btnLlamadaMic');
  if(btn) btn.textContent = LLAMADA.micApagado ? '🔇' : '🎙️';
}

function toggleCamLlamada(){
  if(!LLAMADA.room) return;
  LLAMADA.camApagada = !LLAMADA.camApagada;
  LLAMADA.room.localParticipant.setCameraEnabled(!LLAMADA.camApagada);
  const btn = document.getElementById('btnLlamadaCam');
  if(btn) btn.textContent = LLAMADA.camApagada ? '📷' : '🎥';
  const local = document.getElementById('llamadaVideoLocal');
  if(local) local.style.visibility = LLAMADA.camApagada ? 'hidden' : 'visible';
}

/* ---------- UI ---------- */

function adjuntarPistaRemota(track, participante){
  const contenedor = document.getElementById('llamadaVideoRemoto');
  if(!contenedor) return;
  contenedor.innerHTML = '';
  const el = track.attach();
  el.id = 'llamadaVideoRemotoEl';
  el.autoplay = true;
  el.playsInline = true;
  if(track.kind === 'video'){ el.style.width='100%'; el.style.height='100%'; el.style.objectFit='cover'; }
  contenedor.appendChild(el);
}

function adjuntarPistaLocal(track){
  const contenedor = document.getElementById('llamadaVideoLocal');
  if(!contenedor) return;
  contenedor.innerHTML = '';
  const el = track.attach();
  el.muted = true;
  el.autoplay = true;
  el.playsInline = true;
  el.style.width='100%'; el.style.height='100%'; el.style.objectFit='cover';
  contenedor.appendChild(el);
}

function formatearDuracion(ms){
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const seg = s%60;
  return `${String(m).padStart(2,'0')}:${String(seg).padStart(2,'0')}`;
}

function mostrarPanelLlamada(video){
  let panel = document.getElementById('llamadaPanel');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'llamadaPanel';
    panel.className = 'llamada-panel';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div class="llamada-video-wrap">
      <div id="llamadaVideoRemoto" class="llamada-video-remoto">${video? '' : '<div class="llamada-avatar-espera">💗</div>'}</div>
      <div id="llamadaVideoLocal" class="llamada-video-local" style="${video? '':'display:none'}"></div>
      <div class="llamada-info">
        <span id="llamadaTiempo">00:00</span>
      </div>
    </div>
    <div class="llamada-controles">
      <button class="llamada-btn" id="btnLlamadaMic" onclick="toggleMicLlamada()">🎙️</button>
      ${video? `<button class="llamada-btn" id="btnLlamadaCam" onclick="toggleCamLlamada()">🎥</button>` : ''}
      <button class="llamada-btn llamada-btn-colgar" onclick="colgarLlamada()">📴</button>
    </div>
  `;
  panel.style.display = 'flex';
  LLAMADA.timerId = setInterval(()=>{
    const t = document.getElementById('llamadaTiempo');
    if(t && LLAMADA.inicio) t.textContent = formatearDuracion(Date.now()-LLAMADA.inicio);
  }, 1000);
}

function ocultarPanelLlamada(){
  const panel = document.getElementById('llamadaPanel');
  if(panel) panel.style.display = 'none';
}

function mostrarEsperandoRespuesta(video){
  let banner = document.getElementById('llamadaEsperando');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'llamadaEsperando';
    banner.className = 'llamada-banner';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <div class="llamada-banner-texto">📞 Llamando${video? ' (video)':''}...</div>
    <button class="llamada-btn llamada-btn-colgar" onclick="cancelarLlamadaSaliente()">Cancelar</button>
  `;
  banner.style.display = 'flex';
}

function ocultarEsperandoRespuesta(){
  const banner = document.getElementById('llamadaEsperando');
  if(banner) banner.style.display = 'none';
}

function cancelarLlamadaSaliente(){
  enviarSenalLlamada({ tipo:'colgada', room: idSalaLlamada() });
  if(LLAMADA.fuiIniciador) registrarLlamadaEnChat('cancelada', 0);
  finalizarLlamadaLocal();
}

function mostrarBannerEntrante(data){
  let banner = document.getElementById('llamadaEntrante');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'llamadaEntrante';
    banner.className = 'llamada-banner llamada-banner-entrante';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <div class="llamada-banner-texto">${data.video? '🎥':'📞'} Tu pareja te está llamando${data.video? ' por video':''}</div>
    <div class="llamada-banner-acciones">
      <button class="llamada-btn llamada-btn-colgar" onclick="rechazarLlamada()">✖</button>
      <button class="llamada-btn llamada-btn-contestar" onclick="contestarLlamada()">✔</button>
    </div>
  `;
  banner.style.display = 'flex';
}

function ocultarBannerEntrante(){
  const banner = document.getElementById('llamadaEntrante');
  if(banner) banner.style.display = 'none';
  LLAMADA.entrante = null;
}
