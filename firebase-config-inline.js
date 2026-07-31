/* ================= 📍 MAPA DE RECUERDOS =================
   Sección nueva y autocontenida. Se registra a sí misma (nueva pestaña
   'mapa') igual que hace js/tabs-register.js con las suyas, así que no
   se modifica ningún archivo existente ni ninguna función original.

   MUY IMPORTANTE — léase antes de tocar este archivo:
   Esta función NO es un sistema de rastreo. Notre Petit Monde es una app
   para crear recuerdos, no para vigilar a la pareja. Por diseño:
     - No hay ubicación en tiempo real ni "compartir ubicación" continuo.
     - No se guarda ningún historial de movimientos.
     - No hay geocercas ni alertas de llegada/salida.
     - No hay seguimiento en segundo plano ni notificaciones automáticas
       relacionadas con la ubicación.
   El GPS del dispositivo sólo se lee si la persona pulsa, de forma
   explícita, el botón "Usar mi ubicación actual" al guardar un lugar
   (ver usarUbicacionActualMapa) — es una lectura única y manual, nunca
   continua, y sólo se guarda el punto que ella decide guardar. Cualquier
   cambio futuro a este archivo debe conservar estas garantías; ver la
   subsección "🔒 Privacidad" (dibujarVistaPrivacidad) para el texto que
   se le muestra a la persona.

   ÚNICA EXCEPCIÓN, y solo si ambos miembros de la pareja lo aceptan de
   forma explícita: la subsección "❤️ Nuestra Distancia", que vive por
   completo en js/nuestra-distancia.js (este archivo sólo agrega el
   botón de la pestaña y una línea de despacho hacia
   dibujarVistaDistancia). Sigue siendo aproximada, sin historial, con
   tiempo límite y revocable al instante — ver ese archivo. */

/* ---------- categorías ---------- */
const MAPA_CATS_DEFAULT = [
  {id:'conocimos',    ic:'❤️', label:'Donde nos conocimos'},
  {id:'cafeterias',   ic:'☕', label:'Cafeterías'},
  {id:'restaurantes', ic:'🍽', label:'Restaurantes'},
  {id:'cines',        ic:'🎬', label:'Cines'},
  {id:'parques',      ic:'🏞', label:'Parques'},
  {id:'playas',       ic:'🏖', label:'Playas'},
  {id:'museos',       ic:'🏛', label:'Museos'},
  {id:'bibliotecas',  ic:'📚', label:'Bibliotecas'},
  {id:'atracciones',  ic:'🎡', label:'Atracciones'},
  {id:'viajes',       ic:'✈', label:'Viajes'},
  {id:'importantes',  ic:'🏡', label:'Lugares importantes'},
  {id:'favoritos',    ic:'⭐', label:'Favoritos'},
];
const MAPA_ICONOS_PARADA = ['☕','🏛','🌳','🍽','🎬','🏖','✈','📍','🎡','📚','🛍️','🎨'];

function iconoCategoriaMapa(nombre){
  const def = MAPA_CATS_DEFAULT.find(c=>c.label===nombre);
  if(def) return def.ic;
  const cus = (window._mapaCategoriasCustom||[]).find(c=>c.nombre===nombre);
  return cus ? (cus.icono||'📍') : '📍';
}
function selectorCategoriaHTML(id){
  const custom = window._mapaCategoriasCustom||[];
  return `<div class="field"><label>Categoría</label>
    <select id="${id}" onchange="if(this.value==='__nueva__'){ crearCategoriaMapaPersonalizada(this); }">
      ${MAPA_CATS_DEFAULT.map(c=>`<option value="${esc(c.label)}">${c.ic} ${esc(c.label)}</option>`).join('')}
      ${custom.map(c=>`<option value="${esc(c.nombre)}">${c.icono||'📍'} ${esc(c.nombre)}</option>`).join('')}
      <option value="__nueva__">+ Nueva categoría personalizada…</option>
    </select>
  </div>`;
}
async function crearCategoriaMapaPersonalizada(selectEl){
  const nombre = prompt('Nombre de la nueva categoría:');
  if(!nombre || !nombre.trim()){ selectEl.value = MAPA_CATS_DEFAULT[0].label; return; }
  const icono = prompt('Elige un emoji para esta categoría (opcional):', '📍') || '📍';
  const { data, error } = await sb.from('mapa_categorias').insert({couple_id:SESSION.coupleId, nombre:nombre.trim(), icono}).select().single();
  if(error){ toast('No se pudo crear la categoría'); console.error(error); selectEl.value = MAPA_CATS_DEFAULT[0].label; return; }
  window._mapaCategoriasCustom = [...(window._mapaCategoriasCustom||[]), data];
  const opt = document.createElement('option');
  opt.value = data.nombre; opt.textContent = `${data.icono} ${data.nombre}`;
  selectEl.insertBefore(opt, selectEl.lastElementChild);
  selectEl.value = data.nombre;
  toast('Categoría creada 🎨');
}

/* ---------- carga de datos ---------- */
async function cargarDatosMapaBase(){
  const [{data:lugares}, {data:cats}] = await Promise.all([
    sb.from('mapa_lugares').select('*').eq('couple_id', SESSION.coupleId).eq('eliminado', false).order('created_at',{ascending:false}),
    sb.from('mapa_categorias').select('*').eq('couple_id', SESSION.coupleId).order('nombre'),
  ]);
  window._mapaLugares = lugares||[];
  window._mapaCategoriasCustom = cats||[];
}

/* ---------- entrada de la pestaña ---------- */
let mapaVista = 'mapa';
async function renderMapaRecuerdos(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs" id="mapaSubtabs" style="flex-wrap:wrap">
      <button data-v="mapa" class="${mapaVista==='mapa'?'active':''}">🗺️ Lugares</button>
      <button data-v="lista" class="${mapaVista==='lista'?'active':''}">📋 Lista</button>
      <button data-v="porvisitar" class="${mapaVista==='porvisitar'?'active':''}">🌍 Por visitar</button>
      <button data-v="rutas" class="${mapaVista==='rutas'?'active':''}">🛣️ Rutas</button>
      <button data-v="resumen" class="${mapaVista==='resumen'?'active':''}">📊 Resumen</button>
      <button data-v="distancia" class="${mapaVista==='distancia'?'active':''}">❤️ Nuestra Distancia</button>
      <button data-v="privacidad" class="${mapaVista==='privacidad'?'active':''}">🔒 Privacidad</button>
    </div>
    <div id="mapaBody"><div class="empty"><span class="ic">📍</span>Cargando su mapa…</div></div>`;
  document.querySelectorAll('#mapaSubtabs button').forEach(b=>b.onclick=()=>{ mapaVista=b.dataset.v; renderMapaRecuerdos(); });
  const body = document.getElementById('mapaBody');
  await cargarDatosMapaBase();
  if(mapaVista==='mapa') return dibujarVistaMapaLugares(body);
  if(mapaVista==='lista') return dibujarVistaListaLugares(body);
  if(mapaVista==='porvisitar') return dibujarVistaPorVisitar(body);
  if(mapaVista==='rutas') return dibujarVistaRutas(body);
  if(mapaVista==='resumen') return dibujarVistaResumen(body);
  if(mapaVista==='distancia') return dibujarVistaDistancia(body);
  return dibujarVistaPrivacidad(body);
}

/* ---------- helpers de subida (reutilizan subirImagen/subirBlobDirecto de core.js) ---------- */
function redimensionarImagenADataUrl(file, maxW){
  return new Promise((resolve)=>{
    const reader = new FileReader();
    reader.onload = (e)=>{
      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, maxW/img.width);
        const c = document.createElement('canvas'); c.width = img.width*scale; c.height = img.height*scale;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = ()=> resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = ()=> resolve(null);
    reader.readAsDataURL(file);
  });
}
async function subirImagenRedimensionadaMapa(file, carpeta){
  const dataUrl = await redimensionarImagenADataUrl(file, 1000);
  if(!dataUrl) return null;
  return await subirImagen(dataUrl, carpeta, 'foto');
}

/* ---------- selector de cartas / scrapbook / dibujos relacionados ---------- */
window._mapaSel = window._mapaSel || {};
async function prepararRelacionados(prefix){
  window._mapaSel[prefix] = {cartas:new Set(), dibujos:new Set()};
  const [{data:cartas}, {data:paginas}, {data:dibujos}] = await Promise.all([
    sb.from('cartas').select('id,titulo').eq('couple_id',SESSION.coupleId).eq('eliminada', false).order('created_at',{ascending:false}).limit(40),
    sb.from('scrapbook').select('pagina').eq('couple_id',SESSION.coupleId),
    sb.from('album').select('id,img_url').eq('couple_id',SESSION.coupleId).eq('tipo','dibujo').eq('eliminado', false).order('created_at',{ascending:false}).limit(40),
  ]);
  const cCartas = document.getElementById(`${prefix}-cartas-chips`);
  if(cCartas) cCartas.innerHTML = (cartas&&cartas.length) ? cartas.map(c=>`<button type="button" class="cat-chip" onclick="toggleSeleccionMapa('${prefix}','cartas','${c.id}',this)">💌 ${esc(c.titulo||'Sin título')}</button>`).join('') : '<span class="small muted">Aún no hay cartas guardadas.</span>';
  const selPag = document.getElementById(`${prefix}-scrapbook`);
  if(selPag){
    const lista = [...new Set((paginas||[]).map(p=>p.pagina))];
    selPag.innerHTML = '<option value="">Ninguna</option>' + lista.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
  }
  const cDib = document.getElementById(`${prefix}-dibujos-chips`);
  if(cDib) cDib.innerHTML = (dibujos&&dibujos.length) ? dibujos.map(d=>`<button type="button" class="cat-chip" style="padding:3px" onclick="toggleSeleccionMapa('${prefix}','dibujos','${d.id}',this)"><img src="${d.img_url}" style="width:26px;height:26px;object-fit:cover;border-radius:6px;vertical-align:middle;display:block"></button>`).join('') : '<span class="small muted">Aún no hay dibujos guardados.</span>';
}
function toggleSeleccionMapa(prefix, tipo, id, btn){
  const set = window._mapaSel[prefix][tipo];
  if(set.has(id)){ set.delete(id); btn.classList.remove('active'); } else { set.add(id); btn.classList.add('active'); }
}
function relacionadosHTML(prefix){
  return `
    <div class="field"><label>💌 Cartas relacionadas</label><div id="${prefix}-cartas-chips" class="cat-chip-row" style="overflow-x:auto"><span class="small muted">Cargando…</span></div></div>
    <div class="field"><label>📒 Scrapbook relacionado</label><select id="${prefix}-scrapbook"><option value="">Ninguna</option></select></div>
    <div class="field"><label>🎨 Dibujos relacionados</label><div id="${prefix}-dibujos-chips" class="cat-chip-row" style="overflow-x:auto"><span class="small muted">Cargando…</span></div></div>`;
}

/* ---------- Leaflet (mapa) cargado de forma perezosa, solo cuando hace falta ---------- */
let _mapaLeafletCargado = null;
function cargarLeaflet(){
  if(_mapaLeafletCargado) return _mapaLeafletCargado;
  _mapaLeafletCargado = new Promise((resolve, reject)=>{
    if(window.L){ resolve(window.L); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = ()=> resolve(window.L);
    script.onerror = ()=> reject(new Error('No se pudo cargar el mapa'));
    document.head.appendChild(script);
  });
  return _mapaLeafletCargado;
}

/* ---------- selector de ubicación manual (click en el mapa / buscar / GPS una sola vez) ---------- */
function bloqueUbicacionHTML(prefix){
  return `
    <div class="field"><label>📍 Ubicación (opcional y manual)</label>
      <div class="small muted" style="margin-bottom:6px">Toca el mapa para marcar el sitio, busca una dirección, o usa tu ubicación actual una sola vez. Nunca se guarda ni se comparte de forma continua — ver 🔒 Privacidad.</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <button type="button" class="btn btn-sm btn-outline" onclick="buscarDireccionMapa('${prefix}')">🔎 Buscar dirección</button>
        <button type="button" class="btn btn-sm btn-outline" onclick="usarUbicacionActualMapa('${prefix}')">📍 Usar mi ubicación actual</button>
        <button type="button" class="btn btn-sm btn-ghost" onclick="borrarUbicacionMapa('${prefix}')">✕ Quitar ubicación</button>
      </div>
      <div id="${prefix}-mapa-mini" class="mapa-leaflet-box mapa-leaflet-box-mini"></div>
      <div class="row" style="gap:8px;margin-top:8px">
        <div class="field" style="flex:1;margin:0"><label>Ciudad</label><input id="${prefix}-ciudad" placeholder="Opcional"></div>
        <div class="field" style="flex:1;margin:0"><label>País</label><input id="${prefix}-pais" placeholder="Opcional"></div>
      </div>
    </div>`;
}
window._mapaPicker = window._mapaPicker || {};
async function inicializarUbicacionPicker(prefix){
  const L = await cargarLeaflet().catch(()=>{ toast('No se pudo cargar el mapa'); return null; });
  const el = document.getElementById(`${prefix}-mapa-mini`);
  if(!L || !el) return;
  const map = L.map(el, {zoomControl:true}).setView([20,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  window._mapaPicker[prefix] = {map, marker:null, lat:null, lng:null};
  const colocarMarcador = (latlng)=>{
    const p = window._mapaPicker[prefix];
    p.lat = latlng.lat; p.lng = latlng.lng;
    if(p.marker) p.marker.setLatLng(latlng);
    else {
      p.marker = L.marker(latlng, {draggable:true}).addTo(map);
      p.marker.on('dragend', ()=>{ const pos=p.marker.getLatLng(); p.lat=pos.lat; p.lng=pos.lng; });
    }
  };
  map.on('click', (e)=> colocarMarcador(e.latlng));
  setTimeout(()=> map.invalidateSize(), 200);
}
async function buscarDireccionMapa(prefix){
  const q = prompt('Escribe la dirección o el nombre del lugar a buscar:');
  if(!q || !q.trim()) return;
  toast('Buscando…');
  try{
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    if(!data || !data.length){ toast('No se encontró esa dirección'); return; }
    const r = data[0];
    aplicarUbicacionEncontrada(prefix, parseFloat(r.lat), parseFloat(r.lon), r.address||{});
    toast('Ubicación encontrada 📍');
  }catch(e){ console.error(e); toast('No se pudo buscar la dirección'); }
}
function usarUbicacionActualMapa(prefix){
  if(!navigator.geolocation){ toast('Este dispositivo no permite obtener ubicación'); return; }
  toast('Obteniendo tu ubicación actual (una sola vez)…');
  // Lectura ÚNICA y manual, pedida expresamente por la persona en este instante:
  // getCurrentPosition (nunca watchPosition), sin guardar ninguna traza, solo el
  // punto final que ella decida guardar al enviar el formulario.
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const { latitude:lat, longitude:lng } = pos.coords;
    aplicarUbicacionEncontrada(prefix, lat, lng, null);
    toast('Ubicación actual marcada 📍');
    try{
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if(data && data.address) rellenarCiudadPais(prefix, data.address);
    }catch(e){ /* la ciudad/país son opcionales, se puede completar a mano */ }
  }, ()=>{ toast('No se pudo obtener tu ubicación'); }, {enableHighAccuracy:false, timeout:10000});
}
function aplicarUbicacionEncontrada(prefix, lat, lng, address){
  const p = window._mapaPicker[prefix];
  if(p && p.map){
    p.map.setView([lat,lng], 15);
    if(p.marker) p.marker.setLatLng([lat,lng]);
    else { p.marker = window.L.marker([lat,lng], {draggable:true}).addTo(p.map); p.marker.on('dragend', ()=>{ const pos=p.marker.getLatLng(); p.lat=pos.lat; p.lng=pos.lng; }); }
    p.lat = lat; p.lng = lng;
  }
  if(address) rellenarCiudadPais(prefix, address);
}
function rellenarCiudadPais(prefix, addr){
  const ciudad = addr.city||addr.town||addr.village||addr.municipality||'';
  const pais = addr.country||'';
  const cCiudad = document.getElementById(`${prefix}-ciudad`); if(cCiudad && !cCiudad.value) cCiudad.value = ciudad;
  const cPais = document.getElementById(`${prefix}-pais`); if(cPais && !cPais.value) cPais.value = pais;
}
function borrarUbicacionMapa(prefix){
  const p = window._mapaPicker[prefix];
  if(p && p.marker){ p.map.removeLayer(p.marker); p.marker = null; }
  if(p){ p.lat = null; p.lng = null; }
  toast('Ubicación quitada');
}

/* ================= 🗺️ Vista: Lugares (mapa) ================= */
async function dibujarVistaMapaLugares(body){
  const lugares = (window._mapaLugares||[]).filter(l=>l.visitado!==false);
  const conCoord = lugares.filter(l=>l.lat!=null && l.lng!=null);
  body.innerHTML = `
    <div class="card">
      <h2>📍 Guardar un lugar</h2>
      <div class="small muted" style="margin-bottom:10px">Guarden a mano un sitio importante para ustedes. Nada de esto se comparte ni se registra en segundo plano.</div>
      <div class="field"><label>Nombre del lugar</label><input id="ml-nombre" placeholder="Ej: El café donde nos conocimos"></div>
      ${selectorCategoriaHTML('ml-categoria')}
      <div class="field"><label>Fecha</label><input type="date" id="ml-fecha" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="field"><label>Descripción</label><textarea id="ml-descripcion" rows="3" placeholder="¿Qué pasó aquí?"></textarea></div>
      <div class="field"><label>Notas</label><textarea id="ml-notas" rows="2" placeholder="Notas privadas (opcional)"></textarea></div>
      <div class="field"><label>Emojis</label><input id="ml-emojis" placeholder="✨💕"></div>
      <div class="field"><label>Color</label><input type="color" id="ml-color" value="#eeb1cd" style="height:38px"></div>
      <div class="field"><label>Etiquetas (separadas por coma)</label><input id="ml-etiquetas" placeholder="aniversario, sorpresa"></div>
      <div class="field"><label>Fotografías</label><input type="file" id="ml-fotos" accept="image/*" multiple></div>
      <div class="field"><label>Videos</label><input type="file" id="ml-videos" accept="video/*" multiple></div>
      ${relacionadosHTML('ml')}
      ${bloqueUbicacionHTML('ml')}
      <button class="btn btn-primary btn-block" id="ml-btn-guardar" style="margin-top:12px" onclick="guardarLugarMapa()">Guardar recuerdo 💗</button>
    </div>
    <div class="section-title">Su mapa (${conCoord.length} lugar${conCoord.length!==1?'es':''} ubicado${conCoord.length!==1?'s':''})</div>
    <div class="card" style="padding:8px">
      <div id="mapaLeafletPrincipal" class="mapa-leaflet-box"></div>
    </div>
    ${!lugares.length ? '<div class="empty"><span class="ic">📍</span>Aún no han guardado ningún lugar.</div>' : ''}`;
  await Promise.all([
    prepararRelacionados('ml'),
    inicializarUbicacionPicker('ml'),
    dibujarMapaPrincipal(lugares),
  ]);
}
async function dibujarMapaPrincipal(lugares){
  const L = await cargarLeaflet().catch(()=>{ toast('No se pudo cargar el mapa'); return null; });
  const el = document.getElementById('mapaLeafletPrincipal');
  if(!L || !el) return;
  const conCoord = lugares.filter(l=>l.lat!=null && l.lng!=null);
  const centro = conCoord.length ? [conCoord[0].lat, conCoord[0].lng] : [20,0];
  const map = L.map(el).setView(centro, conCoord.length ? 6 : 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  const bounds = [];
  conCoord.forEach(l=>{
    const icono = L.divIcon({
      className: 'mapa-marker-pin',
      html: `<div class="mapa-marker-pin-inner" style="background:${l.color||'#eeb1cd'}">${iconoCategoriaMapa(l.categoria)}</div>`,
      iconSize:[32,39], iconAnchor:[16,39],
    });
    const m = L.marker([l.lat,l.lng], {icon:icono}).addTo(map);
    m.bindTooltip(l.nombre||'', {direction:'top', offset:[0,-34]});
    m.on('click', ()=> abrirFichaLugarMapa(l.id));
    bounds.push([l.lat,l.lng]);
  });
  if(bounds.length>1) map.fitBounds(bounds, {padding:[30,30]});
  setTimeout(()=> map.invalidateSize(), 200);
}
async function guardarLugarMapa(){
  const nombre = document.getElementById('ml-nombre').value.trim();
  if(!nombre){ toast('Ponle un nombre al lugar'); return; }
  const btn = document.getElementById('ml-btn-guardar');
  const textoOriginal = btn.textContent;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try{
    const categoria = document.getElementById('ml-categoria').value;
    const fecha = document.getElementById('ml-fecha').value || null;
    const descripcion = document.getElementById('ml-descripcion').value.trim();
    const notas = document.getElementById('ml-notas').value.trim();
    const emojis = document.getElementById('ml-emojis').value.trim();
    const color = document.getElementById('ml-color').value;
    const etiquetasRaw = document.getElementById('ml-etiquetas').value.trim();
    const etiquetas = etiquetasRaw ? etiquetasRaw.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const scrapbook_pagina = document.getElementById('ml-scrapbook').value || null;
    const ciudad = document.getElementById('ml-ciudad').value.trim() || null;
    const pais = document.getElementById('ml-pais').value.trim() || null;
    const sel = window._mapaSel['ml'] || {cartas:new Set(), dibujos:new Set()};
    const picker = window._mapaPicker['ml'] || {};

    const fotoFiles = Array.from(document.getElementById('ml-fotos').files||[]);
    const videoFiles = Array.from(document.getElementById('ml-videos').files||[]);
    const fotos = [];
    for(const f of fotoFiles){ const url = await subirImagenRedimensionadaMapa(f, 'mapa'); if(url) fotos.push(url); }
    const videos = [];
    for(const f of videoFiles){ const url = await subirBlobDirecto(f, 'mapa', 'video', (f.name.split('.').pop()||'mp4'), f.type||'video/mp4'); if(url) videos.push(url); }

    const { error } = await sb.from('mapa_lugares').insert({
      couple_id: SESSION.coupleId, autor_id: SESSION.user.id,
      nombre, categoria, fecha, descripcion, notas, emojis, color, etiquetas,
      fotos, videos, cartas_ids:[...sel.cartas], dibujos_ids:[...sel.dibujos], scrapbook_pagina,
      lat: picker.lat, lng: picker.lng, ciudad, pais, visitado:true, favorito:false,
    });
    if(error){ toast('No se pudo guardar el lugar'); console.error(error); return; }
    toast('Lugar guardado en su mapa 💗');
    if(typeof verificarLogros==='function') verificarLogros(true);
    renderMapaRecuerdos();
  } finally {
    btn.disabled = false; btn.textContent = textoOriginal;
  }
}

/* ================= 📋 Vista: Lista ================= */
let mapaListaFiltro = {categoria:'todas', favoritos:false, texto:'', etiqueta:'todas', orden:'reciente'};
function dibujarVistaListaLugares(body){
  const todos = (window._mapaLugares||[]).filter(l=>l.visitado!==false);
  const categorias = [...new Set(todos.map(l=>l.categoria))];
  const etiquetasTodas = [...new Set(todos.flatMap(l=>l.etiquetas||[]))];
  body.innerHTML = `
    <div class="card">
      <input id="mapaListaBuscar" placeholder="Buscar por nombre o descripción..." style="width:100%;padding:11px 14px;border-radius:14px;border:1.5px solid var(--linea);margin-bottom:10px" value="${esc(mapaListaFiltro.texto)}">
      <div class="cat-chip-row" style="overflow-x:auto">
        <button class="cat-chip ${mapaListaFiltro.categoria==='todas'?'active':''}" onclick="mapaSetFiltroLista('categoria','todas')">Todas</button>
        ${categorias.map(c=>`<button class="cat-chip ${mapaListaFiltro.categoria===c?'active':''}" onclick="mapaSetFiltroLista('categoria','${jsAttr(c)}')">${iconoCategoriaMapa(c)} ${esc(c)}</button>`).join('')}
      </div>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="cat-chip ${mapaListaFiltro.favoritos?'active':''}" onclick="mapaListaFiltro.favoritos=!mapaListaFiltro.favoritos;pintarMapaListaGrid();dibujarVistaListaLugares(document.getElementById('mapaBody'))">⭐ Favoritos</button>
        <select onchange="mapaSetFiltroLista('etiqueta',this.value)" style="border-radius:10px;border:1.5px solid var(--linea);padding:6px 10px">
          <option value="todas" ${mapaListaFiltro.etiqueta==='todas'?'selected':''}>Todas las etiquetas</option>
          ${etiquetasTodas.map(t=>`<option value="${esc(t)}" ${mapaListaFiltro.etiqueta===t?'selected':''}>#${esc(t)}</option>`).join('')}
        </select>
        <select onchange="mapaSetFiltroLista('orden',this.value)" style="border-radius:10px;border:1.5px solid var(--linea);padding:6px 10px">
          <option value="reciente" ${mapaListaFiltro.orden==='reciente'?'selected':''}>Más recientes</option>
          <option value="antiguo" ${mapaListaFiltro.orden==='antiguo'?'selected':''}>Más antiguos</option>
          <option value="az" ${mapaListaFiltro.orden==='az'?'selected':''}>Alfabético (A-Z)</option>
        </select>
      </div>
    </div>
    <div class="section-title">Lugares guardados (<span id="mapaListaCount"></span>)</div>
    <div id="mapaListaGrid"></div>`;
  document.getElementById('mapaListaBuscar').addEventListener('input', (e)=>{ mapaListaFiltro.texto = e.target.value; pintarMapaListaGrid(); });
  pintarMapaListaGrid();
}
function mapaSetFiltroLista(campo, valor){ mapaListaFiltro[campo] = valor; dibujarVistaListaLugares(document.getElementById('mapaBody')); }
function pintarMapaListaGrid(){
  let items = (window._mapaLugares||[]).filter(l=>l.visitado!==false);
  if(mapaListaFiltro.categoria!=='todas') items = items.filter(l=>l.categoria===mapaListaFiltro.categoria);
  if(mapaListaFiltro.favoritos) items = items.filter(l=>l.favorito);
  if(mapaListaFiltro.etiqueta!=='todas') items = items.filter(l=>(l.etiquetas||[]).includes(mapaListaFiltro.etiqueta));
  if(mapaListaFiltro.texto.trim()){
    const q = mapaListaFiltro.texto.trim().toLowerCase();
    items = items.filter(l=> (l.nombre||'').toLowerCase().includes(q) || (l.descripcion||'').toLowerCase().includes(q));
  }
  if(mapaListaFiltro.orden==='reciente') items = [...items].sort((a,b)=> new Date(b.fecha||b.created_at) - new Date(a.fecha||a.created_at));
  else if(mapaListaFiltro.orden==='antiguo') items = [...items].sort((a,b)=> new Date(a.fecha||a.created_at) - new Date(b.fecha||b.created_at));
  else items = [...items].sort((a,b)=> (a.nombre||'').localeCompare(b.nombre||''));
  const grid = document.getElementById('mapaListaGrid');
  const count = document.getElementById('mapaListaCount');
  if(count) count.textContent = items.length;
  if(!grid) return;
  grid.innerHTML = items.length ? items.map(l=>`
    <div class="letter-card" style="cursor:pointer;border-left:4px solid ${l.color||'#eeb1cd'}" onclick="abrirFichaLugarMapa('${l.id}')">
      <div class="row" style="justify-content:space-between">
        <b>${esc(l.emojis||'')} ${esc(l.nombre)}</b>
        ${l.favorito?'<span>⭐</span>':''}
      </div>
      <div class="small muted">${iconoCategoriaMapa(l.categoria)} ${esc(l.categoria)}${l.fecha?' · '+new Date(l.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):''}</div>
      ${l.descripcion? `<p class="small" style="margin:6px 0 0">${esc(l.descripcion.slice(0,120))}${l.descripcion.length>120?'…':''}</p>`:''}
      ${(l.etiquetas&&l.etiquetas.length) ? `<div style="margin-top:6px">${l.etiquetas.map(t=>`<span class="chip">#${esc(t)}</span>`).join('')}</div>`:''}
    </div>`).join('') : '<div class="empty"><span class="ic">📍</span>No hay lugares con estos filtros.</div>';
}

/* ================= 🌍 Vista: Lugares por visitar ================= */
function dibujarVistaPorVisitar(body){
  const pendientes = (window._mapaLugares||[]).filter(l=>l.visitado===false);
  body.innerHTML = `
    <div class="card">
      <h2>🌍 Añadir lugar por visitar</h2>
      <div class="field"><label>Nombre</label><input id="pv-nombre" placeholder="Ej: Ese mirador que vieron en fotos"></div>
      <div class="field"><label>Descripción</label><textarea id="pv-descripcion" rows="3" placeholder="¿Por qué quieren ir?"></textarea></div>
      ${selectorCategoriaHTML('pv-categoria')}
      <div class="field"><label>Prioridad</label>
        <div class="cat-chip-row" id="pv-prioridades">
          <button type="button" class="cat-chip" data-p="alta" onclick="seleccionarPrioridadMapa(this)">🔴 Alta</button>
          <button type="button" class="cat-chip active" data-p="media" onclick="seleccionarPrioridadMapa(this)">🟡 Media</button>
          <button type="button" class="cat-chip" data-p="baja" onclick="seleccionarPrioridadMapa(this)">🟢 Baja</button>
        </div>
        <input type="hidden" id="pv-prioridad" value="media">
      </div>
      <div class="field"><label>Fecha planeada (opcional)</label><input type="date" id="pv-fecha"></div>
      <div class="field"><label>Fotografías</label><input type="file" id="pv-fotos" accept="image/*" multiple></div>
      <div class="field"><label>Notas</label><textarea id="pv-notas" rows="2"></textarea></div>
      <button class="btn btn-primary btn-block" id="pv-btn-guardar" style="margin-top:8px" onclick="guardarPorVisitarMapa()">Guardar en pendientes 🌍</button>
    </div>
    <div class="section-title">Lugares pendientes (${pendientes.length})</div>
    <div id="mapaPendientesGrid">
      ${pendientes.length ? pendientes.map(l=>fichaPendienteHTML(l)).join('') : '<div class="empty"><span class="ic">🌍</span>Aún no tienen lugares pendientes por visitar.</div>'}
    </div>`;
}
function seleccionarPrioridadMapa(btn){
  btn.parentElement.querySelectorAll('.cat-chip').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pv-prioridad').value = btn.dataset.p;
}
function fichaPendienteHTML(l){
  const PR = {alta:'🔴 Alta', media:'🟡 Media', baja:'🟢 Baja'};
  return `<div class="letter-card">
    <div class="row" style="justify-content:space-between">
      <b>${iconoCategoriaMapa(l.categoria)} ${esc(l.nombre)}</b>
      <span class="small muted">${PR[l.prioridad]||''}</span>
    </div>
    ${l.descripcion?`<p class="small" style="margin:6px 0">${esc(l.descripcion)}</p>`:''}
    ${l.fecha_planeada?`<div class="small muted">📅 Planeado para ${new Date(l.fecha_planeada+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div>`:''}
    ${l.fotos && l.fotos.length ? `<div class="cat-chip-row" style="overflow-x:auto;margin-top:6px">${l.fotos.map(f=>`<img src="${f}" style="width:70px;height:70px;object-fit:cover;border-radius:10px">`).join('')}</div>`:''}
    <div class="row" style="margin-top:10px;gap:8px">
      <button class="btn btn-sm btn-gold" onclick="marcarVisitadoMapa('${l.id}')">✅ Marcar como visitado</button>
      <button class="btn btn-sm btn-ghost" style="color:#c0527a" onclick="eliminarLugarMapa('${l.id}')">🗑</button>
    </div>
  </div>`;
}
async function guardarPorVisitarMapa(){
  const nombre = document.getElementById('pv-nombre').value.trim();
  if(!nombre){ toast('Ponle un nombre al lugar'); return; }
  const btn = document.getElementById('pv-btn-guardar');
  const textoOriginal = btn.textContent;
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>';
  try{
    const categoria = document.getElementById('pv-categoria').value;
    const descripcion = document.getElementById('pv-descripcion').value.trim();
    const prioridad = document.getElementById('pv-prioridad').value;
    const fecha_planeada = document.getElementById('pv-fecha').value || null;
    const notas = document.getElementById('pv-notas').value.trim();
    const fotoFiles = Array.from(document.getElementById('pv-fotos').files||[]);
    const fotos = [];
    for(const f of fotoFiles){ const url = await subirImagenRedimensionadaMapa(f, 'mapa-pendientes'); if(url) fotos.push(url); }
    const { error } = await sb.from('mapa_lugares').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, nombre, categoria, descripcion, notas, prioridad, fecha_planeada, fotos, visitado:false, favorito:false});
    if(error){ toast('No se pudo guardar'); console.error(error); return; }
    toast('Añadido a lugares por visitar 🌍');
    renderMapaRecuerdos();
  } finally { btn.disabled=false; btn.textContent=textoOriginal; }
}
async function marcarVisitadoMapa(id){
  const l = (window._mapaLugares||[]).find(x=>x.id===id);
  const fecha = (l && l.fecha) || new Date().toISOString().slice(0,10);
  await sb.from('mapa_lugares').update({visitado:true, fecha}).eq('id', id);
  toast('¡Convertido en recuerdo! 💗 Toda su información se conserva.');
  renderMapaRecuerdos();
}
async function eliminarLugarMapa(id){
  if(!confirm('¿Eliminar este lugar?')) return;
  await sb.from('mapa_lugares').update({eliminado:true}).eq('id', id);
  cerrarFichaLugarMapa();
  toast('Lugar eliminado 🗑️');
  renderMapaRecuerdos();
}
async function toggleFavoritoLugarMapa(id, valor){
  await sb.from('mapa_lugares').update({favorito:valor}).eq('id', id);
  const l = (window._mapaLugares||[]).find(x=>x.id===id); if(l) l.favorito = valor;
  cerrarFichaLugarMapa();
  toast(valor ? 'Marcado como favorito ⭐' : 'Quitado de favoritos');
}

/* ================= 🛣️ Vista: Rutas ================= */
let mapaCreandoRuta = false;
async function dibujarVistaRutas(body){
  const { data: rutas } = await sb.from('mapa_rutas').select('*, mapa_rutas_paradas(*)').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  window._mapaRutas = rutas||[];
  body.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between;align-items:center">
        <h2 style="margin:0">🛣️ Rutas</h2>
        <button class="btn btn-sm btn-primary" onclick="mapaCreandoRuta=!mapaCreandoRuta; if(mapaCreandoRuta) window._mapaRutaStopsTemp=[]; dibujarVistaRutas(document.getElementById('mapaBody'))">${mapaCreandoRuta?'Cancelar':'+ Nueva ruta'}</button>
      </div>
      <div class="small muted" style="margin-top:6px">Un recorrido manual, paso a paso — nada se registra automáticamente.</div>
      ${mapaCreandoRuta? formularioNuevaRutaHTML() : ''}
    </div>
    <div id="mapaRutasLista">${(window._mapaRutas||[]).length ? (window._mapaRutas||[]).map(r=>rutaCardHTML(r)).join('') : '<div class="empty"><span class="ic">🛣️</span>Aún no han creado ninguna ruta.</div>'}</div>`;
  if(mapaCreandoRuta){
    window._mapaRutaStopsTemp = window._mapaRutaStopsTemp || [];
    await prepararRelacionados('rt');
    pintarStopsPreview();
  }
}
function formularioNuevaRutaHTML(){
  return `
    <div class="field" style="margin-top:12px"><label>Nombre de la ruta</label><input id="rt-nombre" placeholder="Ej: Nuestra tarde perfecta"></div>
    <div class="field"><label>Descripción</label><textarea id="rt-descripcion" rows="2"></textarea></div>
    <div class="section-title" style="margin-top:14px">Añadir parada</div>
    <div class="field"><label>Nombre de la parada</label><input id="rt-parada-nombre" placeholder="Ej: Cafetería"></div>
    <div class="field"><label>Icono</label>
      <div class="cat-chip-row" id="rt-parada-iconos">
        ${MAPA_ICONOS_PARADA.map((e,i)=>`<button type="button" class="cat-chip ${i===0?'active':''}" onclick="document.getElementById('rt-parada-icono').value='${e}';document.querySelectorAll('#rt-parada-iconos .cat-chip').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${e}</button>`).join('')}
      </div>
      <input type="hidden" id="rt-parada-icono" value="${MAPA_ICONOS_PARADA[0]}">
    </div>
    <div class="field"><label>Notas</label><textarea id="rt-parada-notas" rows="2"></textarea></div>
    <div class="field"><label>Fotografías</label><input type="file" id="rt-parada-fotos" accept="image/*" multiple></div>
    <div class="field"><label>Videos</label><input type="file" id="rt-parada-videos" accept="video/*" multiple></div>
    <div class="field"><label>💌 Cartas relacionadas</label><div id="rt-cartas-chips" class="cat-chip-row" style="overflow-x:auto"><span class="small muted">Cargando…</span></div></div>
    <div class="field"><label>🎨 Dibujos relacionados</label><div id="rt-dibujos-chips" class="cat-chip-row" style="overflow-x:auto"><span class="small muted">Cargando…</span></div></div>
    <button class="btn btn-outline btn-block" onclick="agregarParadaTemp()">+ Añadir parada al recorrido</button>
    <div class="section-title" style="margin-top:14px">Recorrido</div>
    <div id="mapaStopsPreview"></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" id="rt-btn-guardar" onclick="guardarRutaMapa()">Guardar ruta 🛣️</button>`;
}
async function agregarParadaTemp(){
  const nombre = document.getElementById('rt-parada-nombre').value.trim();
  if(!nombre){ toast('Ponle un nombre a la parada'); return; }
  const icono = document.getElementById('rt-parada-icono').value || '📍';
  const notas = document.getElementById('rt-parada-notas').value.trim();
  const fotoFiles = Array.from(document.getElementById('rt-parada-fotos').files||[]);
  const videoFiles = Array.from(document.getElementById('rt-parada-videos').files||[]);
  toast('Añadiendo parada…');
  const fotos = [];
  for(const f of fotoFiles){ const url = await subirImagenRedimensionadaMapa(f, 'mapa-rutas'); if(url) fotos.push(url); }
  const videos = [];
  for(const f of videoFiles){ const url = await subirBlobDirecto(f, 'mapa-rutas', 'video', (f.name.split('.').pop()||'mp4'), f.type||'video/mp4'); if(url) videos.push(url); }
  const sel = window._mapaSel['rt'] || {cartas:new Set(), dibujos:new Set()};
  window._mapaRutaStopsTemp.push({nombre, icono, notas, fotos, videos, cartas_ids:[...sel.cartas], dibujos_ids:[...sel.dibujos]});
  document.getElementById('rt-parada-nombre').value=''; document.getElementById('rt-parada-notas').value='';
  document.getElementById('rt-parada-fotos').value=''; document.getElementById('rt-parada-videos').value='';
  window._mapaSel['rt'] = {cartas:new Set(), dibujos:new Set()};
  document.querySelectorAll('#rt-cartas-chips .cat-chip, #rt-dibujos-chips .cat-chip').forEach(b=>b.classList.remove('active'));
  pintarStopsPreview();
  toast('Parada añadida ✅');
}
function pintarStopsPreview(){
  const cont = document.getElementById('mapaStopsPreview');
  if(!cont) return;
  const stops = window._mapaRutaStopsTemp||[];
  cont.innerHTML = stops.length ? stops.map((s,i)=>`
    ${i>0?'<div class="mapa-ruta-flecha">⬇</div>':''}
    <div class="config-item">
      <div class="config-item-info"><div class="config-item-icon pink">${s.icono}</div><div><label>${esc(s.nombre)}</label>${s.notas?`<div class="sub">${esc(s.notas)}</div>`:''}</div></div>
      <button class="icon-btn" onclick="quitarParadaTemp(${i})">✕</button>
    </div>`).join('') : '<div class="small muted">Aún no han añadido paradas.</div>';
}
function quitarParadaTemp(i){ window._mapaRutaStopsTemp.splice(i,1); pintarStopsPreview(); }
async function guardarRutaMapa(){
  const nombre = document.getElementById('rt-nombre').value.trim();
  if(!nombre){ toast('Ponle un nombre a la ruta'); return; }
  const stops = window._mapaRutaStopsTemp||[];
  if(!stops.length){ toast('Añade al menos una parada'); return; }
  const btn = document.getElementById('rt-btn-guardar');
  const textoOriginal = btn.textContent;
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>';
  try{
    const descripcion = document.getElementById('rt-descripcion').value.trim();
    const { data: ruta, error } = await sb.from('mapa_rutas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, nombre, descripcion}).select().single();
    if(error){ toast('No se pudo guardar la ruta'); console.error(error); return; }
    const paradas = stops.map((s,i)=>({ruta_id:ruta.id, orden:i, nombre:s.nombre, icono:s.icono, notas:s.notas, fotos:s.fotos, videos:s.videos, cartas_ids:s.cartas_ids, dibujos_ids:s.dibujos_ids}));
    const { error: e2 } = await sb.from('mapa_rutas_paradas').insert(paradas);
    if(e2){ toast('La ruta se guardó, pero hubo un problema al guardar las paradas'); console.error(e2); }
    else toast('Ruta guardada 🛣️');
    mapaCreandoRuta = false; window._mapaRutaStopsTemp = [];
    dibujarVistaRutas(document.getElementById('mapaBody'));
  } finally { btn.disabled=false; btn.textContent=textoOriginal; }
}
function rutaCardHTML(r){
  const paradas = (r.mapa_rutas_paradas||[]).slice().sort((a,b)=>a.orden-b.orden);
  return `<div class="card">
    <div class="row" style="justify-content:space-between">
      <h3 style="margin:0">${esc(r.nombre)}</h3>
      <button class="icon-btn" onclick="eliminarRutaMapa('${r.id}')">🗑</button>
    </div>
    ${r.descripcion?`<div class="small muted" style="margin-bottom:8px">${esc(r.descripcion)}</div>`:''}
    ${paradas.map((p,i)=>`${i>0?'<div class="mapa-ruta-flecha">⬇</div>':''}<div class="config-item" style="cursor:pointer" onclick="abrirFichaParadaMapa('${p.id}')"><div class="config-item-info"><div class="config-item-icon lila">${p.icono||'📍'}</div><div><label>${esc(p.nombre)}</label></div></div></div>`).join('')}
  </div>`;
}
async function eliminarRutaMapa(id){
  if(!confirm('¿Eliminar esta ruta y todas sus paradas?')) return;
  await sb.from('mapa_rutas').delete().eq('id', id);
  toast('Ruta eliminada');
  dibujarVistaRutas(document.getElementById('mapaBody'));
}
function abrirFichaParadaMapa(paradaId){
  let parada = null;
  for(const r of (window._mapaRutas||[])){ const p=(r.mapa_rutas_paradas||[]).find(x=>x.id===paradaId); if(p){ parada=p; break; } }
  if(!parada) return;
  cerrarFichaLugarMapa();
  const overlay = document.createElement('div');
  overlay.id = 'mapaFichaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(30,20,30,.75);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--crema);border-radius:22px 22px 0 0;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:18px;position:relative">
    <button onclick="cerrarFichaLugarMapa()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
    <div style="font-weight:700;font-size:17px">${parada.icono||'📍'} ${esc(parada.nombre)}</div>
    ${parada.notas?`<p style="margin:10px 0">${esc(parada.notas)}</p>`:''}
    ${parada.fotos && parada.fotos.length ? `<div class="cat-chip-row" style="overflow-x:auto;margin:8px 0">${parada.fotos.map(f=>`<img src="${f}" style="width:120px;height:120px;object-fit:cover;border-radius:14px;cursor:pointer" onclick="verImagenGrandeMapa('${jsAttr(f)}')">`).join('')}</div>`:''}
    ${parada.videos && parada.videos.length ? parada.videos.map(v=>`<video src="${v}" controls style="width:100%;border-radius:14px;margin-bottom:8px"></video>`).join(''):''}
    ${(parada.cartas_ids&&parada.cartas_ids.length)?`<button class="btn btn-sm btn-outline btn-block" onclick="cerrarFichaLugarMapa();switchTab('cartas')">💌 Ver cartas relacionadas</button>`:''}
    ${(parada.dibujos_ids&&parada.dibujos_ids.length)?`<button class="btn btn-sm btn-outline btn-block" style="margin-top:6px" onclick="cerrarFichaLugarMapa();switchTab('album')">🎨 Ver dibujos relacionados</button>`:''}
  </div>`;
  document.body.appendChild(overlay);
}

/* ================= 📊 Vista: Resumen ================= */
function dibujarVistaResumen(body){
  const todos = window._mapaLugares||[];
  const visitados = todos.filter(l=>l.visitado!==false);
  const pendientes = todos.filter(l=>l.visitado===false);
  const conteoCat = {};
  visitados.forEach(l=>{ conteoCat[l.categoria]=(conteoCat[l.categoria]||0)+1; });
  const catTop = Object.entries(conteoCat).sort((a,b)=>b[1]-a[1])[0];
  const conFecha = visitados.filter(l=>l.fecha).sort((a,b)=> new Date(a.fecha)-new Date(b.fecha));
  const masAntiguo = conFecha[0];
  const masReciente = conFecha[conFecha.length-1];
  const ciudades = new Set(visitados.map(l=>l.ciudad).filter(Boolean));
  const paises = new Set(visitados.map(l=>l.pais).filter(Boolean));
  const fmt = (f)=> new Date(f+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
  body.innerHTML = `
    <div class="card">
      <h2>📊 Resumen</h2>
      <div class="small muted" style="margin-bottom:10px">Solo con los lugares que ustedes agregaron a mano.</div>
      <div class="stat-strip">
        <div class="stat-box"><b>${visitados.length}</b><span>Lugares guardados</span></div>
        <div class="stat-box"><b>${pendientes.length}</b><span>Por visitar</span></div>
        <div class="stat-box"><b>${ciudades.size}</b><span>Ciudades</span></div>
        <div class="stat-box"><b>${paises.size}</b><span>Países</span></div>
      </div>
      ${catTop? `<div class="config-item" style="margin-top:10px"><div class="config-item-info"><div class="config-item-icon gold">${iconoCategoriaMapa(catTop[0])}</div><div><label>Categoría más usada</label><div class="sub">${esc(catTop[0])} · ${catTop[1]} lugar${catTop[1]!==1?'es':''}</div></div></div></div>` : ''}
      ${masAntiguo? `<div class="config-item" style="margin-top:8px"><div class="config-item-info"><div class="config-item-icon lila">🕰️</div><div><label>Lugar más antiguo</label><div class="sub">${esc(masAntiguo.nombre)} · ${fmt(masAntiguo.fecha)}</div></div></div></div>` : ''}
      ${masReciente && masReciente!==masAntiguo? `<div class="config-item" style="margin-top:8px"><div class="config-item-info"><div class="config-item-icon pink">✨</div><div><label>Lugar más reciente</label><div class="sub">${esc(masReciente.nombre)} · ${fmt(masReciente.fecha)}</div></div></div></div>` : ''}
      ${!visitados.length? '<div class="empty" style="margin-top:10px"><span class="ic">📊</span>Guarden su primer lugar para ver estadísticas aquí.</div>':''}
    </div>`;
}

/* ================= 🔒 Vista: Privacidad ================= */
function dibujarVistaPrivacidad(body){
  const puntos = [
    ['🚫','red','Sin ubicación en tiempo real','Nunca se envía ni se muestra dónde está cada quien en este momento.'],
    ['🚫','red','Sin compartir ubicación permanente','No existe ningún modo de "compartir mi ubicación" continuo con tu pareja.'],
    ['🚫','red','Sin historial de movimientos','La app no guarda por dónde han pasado, solo los lugares que ustedes eligen registrar.'],
    ['🚫','red','Sin geocercas ni alertas de llegada o salida','No hay notificaciones automáticas relacionadas con dónde están.'],
    ['🚫','red','Sin seguimiento en segundo plano','La ubicación del dispositivo solo se lee si tú lo pides expresamente, y una sola vez, al guardar un lugar.'],
    ['✅','green','Todo manual y opcional','Cada lugar se agrega a mano, cuando ustedes quieren, con la información que ustedes eligen compartir entre los dos.'],
    ['🔒','lila','Privado entre ustedes dos','Esta información no se comparte con terceros ni se usa para nada fuera de la pareja.'],
  ];
  body.innerHTML = `<div class="card">
    <h2>🔒 Privacidad del Mapa de Recuerdos</h2>
    <div class="small muted" style="margin-bottom:12px">Notre Petit Monde es una app para crear recuerdos, no para vigilar a la pareja.</div>
    ${puntos.map(([ic,color,t,d])=>`<div class="config-item" style="margin-bottom:8px"><div class="config-item-info"><div class="config-item-icon ${color}">${ic}</div><div><label>${esc(t)}</label><div class="sub">${esc(d)}</div></div></div></div>`).join('')}
  </div>`;
}

/* ================= 🖼️ Ficha de un lugar (modal) ================= */
async function abrirFichaLugarMapa(id){
  const l = (window._mapaLugares||[]).find(x=>x.id===id);
  if(!l) return;
  cerrarFichaLugarMapa();
  let cartas=[], dibujos=[];
  if(l.cartas_ids && l.cartas_ids.length){ const {data} = await sb.from('cartas').select('id,titulo').in('id', l.cartas_ids); cartas = data||[]; }
  if(l.dibujos_ids && l.dibujos_ids.length){ const {data} = await sb.from('album').select('id,img_url').in('id', l.dibujos_ids); dibujos = data||[]; }
  const overlay = document.createElement('div');
  overlay.id = 'mapaFichaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(30,20,30,.75);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px 22px 0 0;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:18px;position:relative">
      <button onclick="cerrarFichaLugarMapa()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      ${l.fotos && l.fotos.length ? `<div class="cat-chip-row" style="overflow-x:auto;margin-bottom:10px">${l.fotos.map(f=>`<img src="${f}" style="width:120px;height:120px;object-fit:cover;border-radius:14px;cursor:pointer" onclick="verImagenGrandeMapa('${jsAttr(f)}')">`).join('')}</div>` : ''}
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div style="flex:1">
          <div style="font-weight:700;font-size:17px">${esc(l.emojis||'')} ${esc(l.nombre)}</div>
          <div class="small muted">${iconoCategoriaMapa(l.categoria)} ${esc(l.categoria)}${l.fecha?' · '+new Date(l.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):''}</div>
          ${(l.ciudad||l.pais) ? `<div class="small muted">📍 ${esc([l.ciudad,l.pais].filter(Boolean).join(', '))}</div>`:''}
        </div>
        <button class="icon-btn" onclick="toggleFavoritoLugarMapa('${l.id}', ${!l.favorito})" title="Favorito">${l.favorito?'⭐':'☆'}</button>
      </div>
      ${l.descripcion ? `<p style="white-space:pre-wrap;margin:10px 0">${esc(l.descripcion)}</p>` : ''}
      ${l.notas ? `<div class="small muted" style="background:var(--superficie);border:1px solid var(--linea);border-radius:12px;padding:8px 10px;margin:8px 0"><b>Notas:</b> ${esc(l.notas)}</div>` : ''}
      ${(l.etiquetas&&l.etiquetas.length) ? `<div style="margin:8px 0">${l.etiquetas.map(t=>`<span class="chip">#${esc(t)}</span>`).join('')}</div>` : ''}
      ${l.videos && l.videos.length ? l.videos.map(v=>`<video src="${v}" controls style="width:100%;border-radius:14px;margin-bottom:8px"></video>`).join('') : ''}
      ${cartas.length ? `<div class="section-title" style="margin-top:14px">💌 Cartas relacionadas</div>${cartas.map(c=>`<button class="btn btn-sm btn-outline btn-block" style="margin-bottom:6px" onclick="cerrarFichaLugarMapa();switchTab('cartas')">💌 ${esc(c.titulo||'Sin título')}</button>`).join('')}` : ''}
      ${l.scrapbook_pagina ? `<div class="section-title" style="margin-top:14px">📒 Scrapbook</div><button class="btn btn-sm btn-outline btn-block" onclick="irAScrapbookDesdeMapa('${jsAttr(l.scrapbook_pagina)}')">Ver "${esc(l.scrapbook_pagina)}"</button>` : ''}
      ${dibujos.length ? `<div class="section-title" style="margin-top:14px">🎨 Dibujos relacionados</div><div class="cat-chip-row" style="overflow-x:auto">${dibujos.map(d=>`<img src="${d.img_url}" style="width:56px;height:56px;object-fit:cover;border-radius:10px;cursor:pointer" onclick="cerrarFichaLugarMapa();switchTab('album')">`).join('')}</div>` : ''}
      <div class="row" style="margin-top:16px;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-ghost" style="color:#c0527a" onclick="eliminarLugarMapa('${l.id}')">🗑 Eliminar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
function cerrarFichaLugarMapa(){ const o=document.getElementById('mapaFichaOverlay'); if(o) o.remove(); }
function verImagenGrandeMapa(url){
  const overlay = document.createElement('div');
  overlay.id = 'mapaImagenOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:130;background:rgba(10,5,10,.92);display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `<img src="${url}" style="max-width:100%;max-height:100%;border-radius:12px;object-fit:contain"><button onclick="document.getElementById('mapaImagenOverlay').remove()" style="position:absolute;top:16px;right:16px;border:none;background:rgba(255,255,255,.15);color:#fff;width:36px;height:36px;border-radius:50%;font-size:18px">✕</button>`;
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
function irAScrapbookDesdeMapa(pagina){
  scrapPaginaActual = pagina; scrapVista = 'paginas';
  cerrarFichaLugarMapa();
  switchTab('recuerdos');
}

/* ================= registro de la pestaña (no toca archivos existentes) ================= */
(function registrarMapaRecuerdos(){
  // Se inserta justo antes de "Extras" (y no antes de "Ajustes") para que
  // "Extras" siga siendo siempre la última categoría antes de Configuración.
  const idxExtras = TABS.findIndex(t=>t.id==='extras');
  const idxConfig = TABS.findIndex(t=>t.id==='config');
  const idxInsercion = idxExtras>=0 ? idxExtras : (idxConfig>=0 ? idxConfig : TABS.length);
  TABS.splice(idxInsercion, 0, {id:'mapa', ic:'📍', label:'Mapa de Recuerdos'});

  if(typeof CATEGORIAS_NAV !== 'undefined' && Array.isArray(CATEGORIAS_NAV)){
    const idxExtrasCat = CATEGORIAS_NAV.findIndex(c=>c.id==='extras');
    const idxCfgCat = CATEGORIAS_NAV.findIndex(c=>c.id==='config' || c.tab==='config');
    const pos = idxExtrasCat>=0 ? idxExtrasCat : (idxCfgCat>=0 ? idxCfgCat : CATEGORIAS_NAV.length);
    CATEGORIAS_NAV.splice(pos, 0, {id:'mapa', ic:'📍', label:'Mapa de Recuerdos', tab:'mapa'});
  }

  const renderOriginal = render;
  render = function(){
    if(activeTab==='mapa') return renderMapaRecuerdos();
    return renderOriginal();
  };
})();
