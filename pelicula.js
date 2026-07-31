/* ================= ❤️ NUESTRA DISTANCIA =================
   Sección opcional dentro del Mapa de Recuerdos (js/mapa-recuerdos.js
   sólo agrega el botón de la pestaña y la línea de despacho hacia
   dibujarVistaDistancia; toda la lógica vive aquí, autocontenida).

   ES LA ÚNICA EXCEPCIÓN, y solo si ambos la activan, a la garantía de
   "nada de ubicación en tiempo real" del resto del Mapa de Recuerdos.
   Reglas que este archivo debe conservar siempre:
     - Desactivada por defecto. Nunca se activa sola.
     - Solo funciona si AMBOS miembros de la pareja aceptaron compartir.
       Si uno no acepta (o revoca), la función queda apagada para los dos.
     - Nunca se muestra ni se guarda una ubicación exacta: solo una
       distancia aproximada (ver redondearAproximado y calcularEstadoDistancia).
     - Nunca se guarda historial de ubicaciones, rutas ni velocidad.
     - Nada de geocercas, alertas de llegada/salida ni seguimiento en
       segundo plano: el GPS solo se lee con una acción manual y explícita
       (activar la función o pulsar "Actualizar mi ubicación"), nunca con
       watchPosition ni con temporizadores en segundo plano.
     - La compartición siempre tiene un tiempo límite elegido por la
       persona (o "hasta desactivarla manualmente") y se apaga sola al
       vencer.
   El texto legal/explicativo de esta función vive en Ajustes → Legal
   (ver renderConfigLegal en js/tabs-personalizacion.js), no aquí. */

const DISTANCIA_DURACIONES = [
  {id:'1h',    label:'1 hora'},
  {id:'8h',    label:'8 horas'},
  {id:'hoy',   label:'Hasta finalizar el día'},
  {id:'manual',label:'Hasta desactivarla manualmente'},
];

/* ---------- redondeo de privacidad ---------- */
// Redondea a 2 decimales (~1.1 km de margen) antes de guardar o de usar
// en cualquier cálculo. La app nunca trabaja con la coordenada exacta.
function redondearAproximado(n){ return Math.round(n*100)/100; }

function calcularExpiraAt(duracion){
  const ahora = new Date();
  if(duracion==='1h') return new Date(ahora.getTime()+60*60*1000).toISOString();
  if(duracion==='8h') return new Date(ahora.getTime()+8*60*60*1000).toISOString();
  if(duracion==='hoy'){
    const fin = new Date(ahora); fin.setHours(23,59,59,999);
    return fin.toISOString();
  }
  return null; // 'manual'
}

/* ---------- distancia entre dos puntos (Haversine, resultado aproximado) ---------- */
function distanciaKmAprox(lat1,lng1,lat2,lng2){
  const R = 6371;
  const toRad = d=> d*Math.PI/180;
  const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Traduce la distancia y la geografía a un estado cálido y romántico,
// nunca a un número de más de "aproximadamente X km".
function calcularEstadoDistancia(distKm, mia, pareja){
  if(mia.pais && pareja.pais && mia.pais!==pareja.pais){
    return {icono:'✈️', corto:'En países diferentes', calido:'Hoy los separan muchos kilómetros'};
  }
  if(mia.estado && pareja.estado && mia.estado!==pareja.estado){
    return {icono:'🌎', corto:'En estados diferentes', calido:'Un buen viaje los separa, pero siguen compartiendo su Petit Monde'};
  }
  if(mia.ciudad && pareja.ciudad && mia.ciudad!==pareja.ciudad){
    return {icono:'🏙️', corto:'En ciudades diferentes', calido:'Un pequeño viaje los separa'};
  }
  if(distKm < 0.3) return {icono:'❤️', corto:'Están muy cerca', calido:'Muy cerca 💕'};
  if(distKm < 2)   return {icono:'💕', corto:'A pocos minutos', calido:'A pocos minutos uno del otro'};
  if(distKm < 6)   return {icono:'🚶', corto:`Aproximadamente a ${Math.max(1,Math.round(distKm))} km`, calido:'Pueden verse caminando'};
  return {icono:'🚗', corto:`Aproximadamente a ${Math.round(distKm)} km`, calido:'Un pequeño viaje los separa'};
}

/* ---------- carga ---------- */
async function cargarFilasDistancia(){
  const { data, error } = await sb.from('distancia_compartida').select('*').eq('couple_id', SESSION.coupleId);
  if(error){
    console.error('distancia_compartida:', error);
    window._distanciaErrorCarga = error;
  } else {
    window._distanciaErrorCarga = null;
  }
  const filas = data || [];
  const mia = filas.find(f=>f.user_id===SESSION.user.id) || null;
  const pareja = filas.find(f=>f.user_id!==SESSION.user.id) || null;
  return { mia, pareja };
}
function distanciaEstaVencida(fila){
  return !!(fila && fila.expira_at && new Date(fila.expira_at) < new Date());
}
async function apagarSiVencida(fila){
  if(fila && fila.activo && distanciaEstaVencida(fila)){
    await sb.from('distancia_compartida').update({activo:false}).eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
    return true;
  }
  return false;
}

/* ---------- vista principal (llamada desde mapa-recuerdos.js) ---------- */
async function dibujarVistaDistancia(body){
  let { mia, pareja } = await cargarFilasDistancia();
  if(window._distanciaErrorCarga){
    body.innerHTML = htmlErrorDistancia(window._distanciaErrorCarga);
    return;
  }
  if(await apagarSiVencida(mia)){ ({ mia, pareja } = await cargarFilasDistancia()); }

  if(!mia || !mia.activo){
    body.innerHTML = htmlActivacionDistancia();
    return;
  }
  if(mia.pausado){
    body.innerHTML = htmlTarjetaEstadoSimple('⏸️', 'Nuestra Distancia está en pausa', 'Tu pareja no puede ver tu distancia aproximada mientras esté en pausa.') + htmlBotonesGestion(mia, false);
    return;
  }
  if(!pareja || !pareja.activo || distanciaEstaVencida(pareja)){
    body.innerHTML = htmlTarjetaEstadoSimple('🕊️', 'Compartiendo, esperando a tu pareja', 'Ya activaste tu ubicación aproximada. En cuanto tu pareja también la active, verán la distancia entre ambos.') + htmlBotonesGestion(mia, true);
    return;
  }
  if(pareja.pausado){
    body.innerHTML = htmlTarjetaEstadoSimple('⏸️', 'Tu pareja pausó su distancia', 'Cuando la reanude, volverán a ver cuánto los separa.') + htmlBotonesGestion(mia, true);
    return;
  }
  if(mia.ocultar_para_mi){
    body.innerHTML = htmlTarjetaEstadoSimple('🙈', 'Distancia oculta para ti', 'Elegiste no ver la distancia. Tu pareja sigue viendo la suya con normalidad.') + htmlBotonesGestion(mia, true, true);
    return;
  }
  const distKm = distanciaKmAprox(mia.lat, mia.lng, pareja.lat, pareja.lng);
  const estado = calcularEstadoDistancia(distKm, mia, pareja);
  const actualizadoHace = tiempoRelativoCorto(mia.updated_at);
  body.innerHTML = `
    <div class="card distancia-card">
      <h3>📍 Nuestra Distancia</h3>
      <div class="distancia-emoji">${estado.icono}</div>
      <div class="distancia-principal">${esc(estado.corto)}</div>
      <div class="small muted" style="text-align:center">${esc(estado.calido)}</div>
      <div class="small muted" style="text-align:center;margin-top:10px">📍 Ubicación aproximada compartida · Actualizado hace ${actualizadoHace}</div>
    </div>
    ${htmlBotonesGestion(mia, true)}
    <div class="card">
      <h3>⚙️ Ajustes de esta función</h3>
      <div class="config-item">
        <div class="config-item-info"><div class="config-item-icon lila">🙈</div><div><label>Ocultar mi distancia</label><div class="sub">Tu pareja sigue viendo su tarjeta; tú no verás la tuya</div></div></div>
        <button class="config-toggle ${mia.ocultar_para_mi?'on':''}" onclick="toggleOcultarDistancia()"></button>
      </div>
      <div class="config-item">
        <div class="config-item-info"><div class="config-item-icon blue">👀</div><div><label>Quién puede verla</label><div class="sub">Solo tu pareja en Notre Petit Monde</div></div></div>
      </div>
    </div>`;
}

function htmlErrorDistancia(error){
  const faltaTabla = error && (error.code==='42P01' || /relation .* does not exist/i.test(error.message||''));
  return `<div class="card">
    <h3>⚠️ No se pudo cargar Nuestra Distancia</h3>
    <p class="small muted">${faltaTabla
      ? 'Parece que falta ejecutar la migración de base de datos. En el SQL Editor de su proyecto de Supabase, ejecuten una sola vez el contenido de <b>supabase/nuestra_distancia.sql</b> y vuelvan a intentarlo.'
      : 'Ocurrió un error al conectar con la base de datos. Revisen la consola del navegador para más detalle: <code>' + esc(error.message||'error desconocido') + '</code>'}</p>
    <button class="btn btn-sm btn-outline" onclick="renderMapaRecuerdos()">Reintentar</button>
  </div>`;
}
function htmlBotonesGestion(mia, mostrarPausa, yaPausadoPorMi){
  const pausado = !!mia.pausado;
  return `<div class="card">
    <div class="row" style="gap:8px;flex-wrap:wrap">
      ${mostrarPausa || true ? `<button class="btn btn-sm btn-outline" onclick="togglePausaDistancia()">${pausado?'▶️ Reanudar':'⏸️ Pausar'}</button>` : ''}
      <button class="btn btn-sm btn-outline" onclick="renovarTiempoDistancia()">🔄 Renovar tiempo</button>
      <button class="btn btn-sm btn-outline" onclick="actualizarMiUbicacionDistancia()">📍 Actualizar mi ubicación</button>
      <button class="btn btn-sm btn-danger" onclick="dejarDeCompartirDistancia()">Dejar de compartir</button>
    </div>
  </div>`;
}
function htmlTarjetaEstadoSimple(icono, titulo, sub){
  return `<div class="card distancia-card">
    <div class="distancia-emoji">${icono}</div>
    <div class="distancia-principal">${esc(titulo)}</div>
    <div class="small muted" style="text-align:center">${esc(sub)}</div>
  </div>`;
}
function tiempoRelativoCorto(iso){
  if(!iso) return 'unos minutos';
  const min = Math.max(0, Math.round((Date.now()-new Date(iso).getTime())/60000));
  if(min<1) return 'un momento';
  if(min<60) return `${min} min`;
  const horas = Math.round(min/60);
  return `${horas} h`;
}

/* ---------- pantalla de activación / permiso ---------- */
function htmlActivacionDistancia(){
  return `
    <div class="card distancia-card">
      <h3>📍 Nuestra Distancia</h3>
      <p class="muted small" style="text-align:center">Una forma opcional de sentir cercanía, nunca de rastrearse. Solo funciona si ambos la activan.</p>
      <div style="margin:10px 0;padding:12px;background:rgba(143,191,159,.2);border-radius:12px;font-size:12.5px;color:var(--tinta-suave)">
        Compartiremos únicamente una ubicación aproximada para calcular la distancia entre ustedes. Nunca mostraremos la ubicación exacta ni almacenaremos un historial de movimientos.
      </div>
      <div class="field"><label>¿Por cuánto tiempo quieres compartir?</label>
        <select id="distanciaDuracionSel">
          ${DISTANCIA_DURACIONES.map(d=>`<option value="${d.id}">${d.label}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-gold btn-block" onclick="activarDistancia()">❤️ Activar Nuestra Distancia</button>
    </div>
    <div class="card">
      <h3>🔒 Recuerden</h3>
      <ul class="small muted" style="padding-left:18px;margin:0">
        <li>Está desactivada hasta que la enciendan.</li>
        <li>Si tu pareja no la activa también, no se calcula ninguna distancia.</li>
        <li>Pueden pausarla, renovarla o dejar de compartir en cualquier momento.</li>
        <li>Más detalles en Ajustes → Legal → Política de privacidad.</li>
      </ul>
    </div>`;
}

/* ---------- acciones ---------- */
async function activarDistancia(){
  if(!navigator.geolocation){ toast('Este dispositivo no permite obtener ubicación'); return; }
  const duracion = document.getElementById('distanciaDuracionSel').value;
  toast('Obteniendo tu ubicación aproximada (una sola vez)…');
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const lat = redondearAproximado(pos.coords.latitude);
    const lng = redondearAproximado(pos.coords.longitude);
    let ciudad=null, estado=null, pais=null;
    try{
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const a = data && data.address;
      if(a){ ciudad = a.city||a.town||a.village||null; estado = a.state||null; pais = a.country||null; }
    }catch(e){ /* la ciudad/estado/país son opcionales para el cálculo de "misma ciudad" */ }
    const { error } = await sb.from('distancia_compartida').upsert({
      couple_id: SESSION.coupleId, user_id: SESSION.user.id,
      activo:true, pausado:false, duracion,
      expira_at: calcularExpiraAt(duracion),
      lat, lng, ciudad, estado, pais, ocultar_para_mi:false,
      updated_at: new Date().toISOString(),
    }, {onConflict:'couple_id,user_id'});
    if(error){
      console.error('activarDistancia:', error);
      toast('No se pudo activar: revisen que ejecutaron supabase/nuestra_distancia.sql');
      renderMapaRecuerdos();
      return;
    }
    toast('Nuestra Distancia activada ❤️');
    renderMapaRecuerdos();
  }, ()=>{ toast('No se pudo obtener tu ubicación'); }, {enableHighAccuracy:false, timeout:10000});
}
async function actualizarMiUbicacionDistancia(){
  if(!navigator.geolocation){ toast('Este dispositivo no permite obtener ubicación'); return; }
  toast('Actualizando tu ubicación aproximada…');
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const lat = redondearAproximado(pos.coords.latitude);
    const lng = redondearAproximado(pos.coords.longitude);
    await sb.from('distancia_compartida').update({lat, lng, updated_at:new Date().toISOString()}).eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
    toast('Ubicación actualizada 📍');
    renderMapaRecuerdos();
  }, ()=>{ toast('No se pudo actualizar tu ubicación'); }, {enableHighAccuracy:false, timeout:10000});
}
async function togglePausaDistancia(){
  const { mia } = await cargarFilasDistancia();
  if(!mia) return;
  await sb.from('distancia_compartida').update({pausado: !mia.pausado}).eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
  toast(!mia.pausado ? 'En pausa ⏸️' : 'Reanudada ▶️');
  renderMapaRecuerdos();
}
async function renovarTiempoDistancia(){
  const { mia } = await cargarFilasDistancia();
  if(!mia) return;
  await sb.from('distancia_compartida').update({expira_at: calcularExpiraAt(mia.duracion), pausado:false}).eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
  toast('Tiempo renovado 🔄');
  renderMapaRecuerdos();
}
async function toggleOcultarDistancia(){
  const { mia } = await cargarFilasDistancia();
  if(!mia) return;
  await sb.from('distancia_compartida').update({ocultar_para_mi: !mia.ocultar_para_mi}).eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
  renderMapaRecuerdos();
}
async function dejarDeCompartirDistancia(){
  if(!confirm('¿Dejar de compartir tu ubicación aproximada? Tu pareja dejará de ver la distancia de inmediato.')) return;
  await sb.from('distancia_compartida').update({activo:false, pausado:false, lat:null, lng:null, ciudad:null, estado:null, pais:null}).eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
  toast('Dejaste de compartir tu ubicación');
  renderMapaRecuerdos();
}
