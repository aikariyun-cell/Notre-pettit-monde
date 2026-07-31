/* ================= INICIO PERSONALIZABLE (catálogo ampliado de widgets) ================= */
const WIDGETS_EXTRA = [
  {id:'foto_pareja', icon:'🖼️', label:'Foto de la pareja', sub:'La última foto que subieron juntos'},
  {id:'foto_dia', icon:'🎞️', label:'Foto aleatoria del día', sub:'Cambia cada día, siempre la misma hasta mañana'},
  {id:'carta_reciente', icon:'💌', label:'Carta reciente', sub:'La última carta que se escribieron'},
  {id:'proxima_fecha', icon:'📅', label:'Próxima fecha importante', sub:'Cuenta regresiva al próximo hito'},
  {id:'tareas_compartidas', icon:'✅', label:'Lista de tareas compartida', sub:'Pendientes de sus checklists'},
  {id:'lista_compras_w', icon:'🛒', label:'Lista de compras', sub:'Productos pendientes por comprar'},
  {id:'nota_rapida_w', icon:'📝', label:'Nota rápida', sub:'Escribe una nota sin salir de Inicio'},
  {id:'cancion_favorita', icon:'🎵', label:'Canción favorita', sub:'Su pista mejor puntuada'},
  {id:'dibujo_favorito', icon:'🎨', label:'Dibujo favorito', sub:'El dibujo favorito del álbum'},
  {id:'recuerdo_aleatorio', icon:'🎲', label:'Recuerdo aleatorio', sub:'Un recuerdo al azar de su historia'},
  {id:'un_dia_como_hoy', icon:'🕰️', label:'Un día como hoy', sub:'Qué pasó en esta fecha, en años anteriores'},
  {id:'objetivos_compartidos', icon:'🎯', label:'Objetivos compartidos', sub:'Metas pendientes en pareja'},
  {id:'te_extrano_w', icon:'🥺', label:'Te extraño / Pensando en ti', sub:'Envía un pensamiento con un toque'},
  {id:'nota_compartida_w', icon:'🗒️', label:'Nota adhesiva compartida', sub:'Una nota que ambos pueden editar'},
  {id:'dibujo_compartido_w', icon:'✏️', label:'Dibujo compartido', sub:'Un boceto rápido que ve tu pareja'},
];

/* ---------- Extiende la pantalla de configuración de Inicio ---------- */
(function envolverConfigPersonalizacionInicio(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof window.renderConfigPersonalizacion==='function'){
      clearInterval(t);
      const original = window.renderConfigPersonalizacion;
      window.renderConfigPersonalizacion = function(body){
        original(body);
        body.insertAdjacentHTML('beforeend', bloqueWidgetsExtra() + bloqueOcultarFunciones() + bloqueAccesosRapidos());
        cablearWidgetsExtra(body);
      };
    } else if(intentos>120){ clearInterval(t); }
  }, 800);
})();

function bloqueWidgetsExtra(){
  const orden = PERSONALIZACION.widgetsOrden || [];
  const tamanos = PERSONALIZACION.widgetsTamano || {};
  return `
    <div class="card">
      <h3>🧩 Más widgets de Inicio</h3>
      <p class="muted small">Actívalos, reordénalos y elige su tamaño.</p>
      <div class="config-list" id="widgetsExtraLista">
        ${WIDGETS_EXTRA.map(w=>`
          <div class="config-item">
            <div class="config-item-info"><div class="config-item-icon pink">${w.icon}</div><div><label>${w.label}</label><div class="sub">${w.sub}</div></div></div>
            <div class="row" style="gap:6px;align-items:center">
              <button class="btn btn-sm" onclick="moverWidgetOrden('${w.id}',-1)" title="Subir">↑</button>
              <button class="btn btn-sm" onclick="moverWidgetOrden('${w.id}',1)" title="Bajar">↓</button>
              <select onchange="cambiarTamanoWidget('${w.id}', this.value)" style="border-radius:8px;border:1.5px solid var(--linea);font-size:12px">
                <option value="chico" ${tamanos[w.id]!=='grande'?'selected':''}>Chico</option>
                <option value="grande" ${tamanos[w.id]==='grande'?'selected':''}>Grande</option>
              </select>
              <button class="config-toggle ${widgetActivo(w.id)?'on':''}" onclick="toggleWidgetInicio('${w.id}',this)"></button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}
function bloqueOcultarFunciones(){
  const ocultas = new Set(PERSONALIZACION.tabsOcultas||[]);
  const opciones = (typeof TABS!=='undefined' ? TABS : []).filter(t=>!['inicio','config'].includes(t.id));
  return `
    <div class="card">
      <h3>🙈 Ocultar funciones que no usen</h3>
      <p class="muted small">Las pestañas ocultas desaparecen de la barra inferior; pueden volver a mostrarlas cuando quieran.</p>
      <div class="config-list">
        ${opciones.map(t=>`<div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">${t.ic||'✨'}</div><div><label>${t.label}</label></div></div><button class="config-toggle ${!ocultas.has(t.id)?'on':''}" onclick="toggleTabOculta('${t.id}',this)"></button></div>`).join('')}
      </div>
    </div>`;
}
function bloqueAccesosRapidos(){
  const accesos = PERSONALIZACION.accesosPersonalizados || [];
  const opciones = typeof TABS!=='undefined' ? TABS : [];
  return `
    <div class="card">
      <h3>⚡ Crear accesos rápidos</h3>
      <div class="row" style="gap:8px">
        <input id="accesoNombre" placeholder="Nombre" style="flex:1">
        <select id="accesoDestino">${opciones.map(t=>`<option value="${t.id}">${t.ic||''} ${t.label}</option>`).join('')}</select>
      </div>
      <button class="btn btn-sm btn-gold" style="margin-top:8px" onclick="agregarAccesoPersonalizado()">Añadir acceso</button>
      ${accesos.map((a,i)=>`<div class="row" style="justify-content:space-between;padding:6px 0"><span>${esc(a.nombre)} → ${esc(a.destino)}</span><span class="tag-del" onclick="quitarAccesoPersonalizado(${i})">✕</span></div>`).join('')}
    </div>`;
}
function cablearWidgetsExtra(body){ /* los onclick ya están inline; función reservada por si se necesita más adelante */ }

async function moverWidgetOrden(id, delta){
  const orden = (PERSONALIZACION.widgetsOrden && PERSONALIZACION.widgetsOrden.length) ? [...PERSONALIZACION.widgetsOrden] : WIDGETS_EXTRA.map(w=>w.id);
  const i = orden.indexOf(id);
  const j = i + delta;
  if(i<0 || j<0 || j>=orden.length) return;
  [orden[i], orden[j]] = [orden[j], orden[i]];
  await guardarPersonalizacion({widgetsOrden: orden});
  renderConfigPersonalizacion(document.getElementById('main'));
}
async function cambiarTamanoWidget(id, tamano){
  const tamanos = Object.assign({}, PERSONALIZACION.widgetsTamano||{}, {[id]:tamano});
  await guardarPersonalizacion({widgetsTamano: tamanos});
}
async function toggleTabOculta(id, btn){
  const ocultas = new Set(PERSONALIZACION.tabsOcultas||[]);
  if(ocultas.has(id)) ocultas.delete(id); else ocultas.add(id);
  btn.classList.toggle('on', !ocultas.has(id));
  await guardarPersonalizacion({tabsOcultas: Array.from(ocultas)});
  if(typeof buildTabbar==='function') buildTabbar();
}
async function agregarAccesoPersonalizado(){
  const nombre = document.getElementById('accesoNombre').value.trim();
  const destino = document.getElementById('accesoDestino').value;
  if(!nombre) { toast('Escribe un nombre'); return; }
  const accesos = [...(PERSONALIZACION.accesosPersonalizados||[]), {nombre, destino}];
  await guardarPersonalizacion({accesosPersonalizados: accesos});
  toast('Acceso rápido creado ⚡');
  renderConfigPersonalizacion(document.getElementById('main'));
}
async function quitarAccesoPersonalizado(i){
  const accesos = (PERSONALIZACION.accesosPersonalizados||[]).filter((_,idx)=>idx!==i);
  await guardarPersonalizacion({accesosPersonalizados: accesos});
  renderConfigPersonalizacion(document.getElementById('main'));
}

/* ---------- Filtra la barra de pestañas según tabsOcultas (oculta botones ya renderizados) ---------- */
(function envolverBuildTabbarOcultas(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof window.buildTabbar==='function' && typeof TABS!=='undefined'){
      clearInterval(t);
      const original = window.buildTabbar;
      window.buildTabbar = function(){
        original();
        const ocultas = new Set((typeof PERSONALIZACION!=='undefined' && PERSONALIZACION.tabsOcultas) || []);
        if(!ocultas.size) return;
        document.querySelectorAll('#tabbar button').forEach(b=>{
          if(ocultas.has(b.dataset.tab) && b.dataset.tab!=='inicio' && b.dataset.tab!=='config'){
            b.style.display = 'none';
          }
        });
      };
    } else if(intentos>150){ clearInterval(t); }
  }, 800);
})();

/* ---------- Renderiza los widgets extra activos + accesos personalizados al final de Inicio ---------- */
(function envolverRenderInicioExtra(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof window.renderInicio==='function'){
      clearInterval(t);
      const original = window.renderInicio;
      window.renderInicio = async function(){
        await original();
        await agregarWidgetsExtraAlInicio();
      };
    } else if(intentos>120){ clearInterval(t); }
  }, 800);
})();

async function agregarWidgetsExtraAlInicio(){
  const main = document.getElementById('main');
  if(!main) return;
  main.insertAdjacentHTML('afterbegin', bannerInstalarIOS());
  const ordenBase = (PERSONALIZACION.widgetsOrden && PERSONALIZACION.widgetsOrden.length) ? PERSONALIZACION.widgetsOrden : WIDGETS_EXTRA.map(w=>w.id);
  const activos = ordenBase.filter(id => widgetActivo(id));
  const accesos = PERSONALIZACION.accesosPersonalizados || [];
  let html = '';
  if(accesos.length){
    html += `<div class="card"><h3>⚡ Tus accesos</h3><div class="grid2">${accesos.map(a=>`<button class="btn btn-outline" onclick="switchTab('${a.destino}')">${esc(a.nombre)}</button>`).join('')}</div></div>`;
  }
  for(const id of activos){
    const tamano = (PERSONALIZACION.widgetsTamano||{})[id] || 'chico';
    html += await renderWidgetExtra(id, tamano);
  }
  main.insertAdjacentHTML('beforeend', html);
  inicializarInteraccionesWidgetsExtra();
}

function bannerInstalarIOS(){
  try{
    const enIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if(!enIOS || instalada) return '';
    if(localStorage.getItem('npm_banner_ios_oculto')==='1') return '';
  }catch(e){ return ''; }
  return `<div class="card" style="background:linear-gradient(135deg,rgba(238,177,205,.35),rgba(220,208,242,.35))">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div><b>📲 Instala la app para recibir notificaciones</b><p class="small muted" style="margin-top:4px">En iPhone: toca Compartir (□↑) → "Agregar a pantalla de inicio". Así podrán recibir avisos aunque tengan la app cerrada.</p></div>
      <span onclick="ocultarBannerInstalarIOS()" style="cursor:pointer;font-size:16px">✕</span>
    </div>
  </div>`;
}
function ocultarBannerInstalarIOS(){
  try{ localStorage.setItem('npm_banner_ios_oculto','1'); }catch(e){}
  const el = document.querySelector('#main .card');
  if(el) el.remove();
}
async function renderWidgetExtra(id, tamano){
  const grande = tamano==='grande';
  try{
    if(id==='foto_pareja'){
      const { data } = await sb.from('album').select('img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','foto').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(!data || !data.img_url) return '';
      return `<div class="card"><h3>🖼️ Foto de la pareja</h3><img src="${data.img_url}" style="width:100%;border-radius:14px;${grande?'':'max-height:220px;object-fit:cover'}">${data.texto?`<p class="small muted" style="margin-top:6px">${esc(data.texto)}</p>`:''}</div>`;
    }
    if(id==='foto_dia'){
      const { data } = await sb.from('album').select('id,img_url').eq('couple_id',SESSION.coupleId).eq('tipo','foto');
      if(!data || !data.length) return '';
      const diaAnio = Math.floor(Date.now()/86400000);
      const foto = data[diaAnio % data.length];
      return `<div class="card"><h3>🎞️ Foto del día</h3><img src="${foto.img_url}" style="width:100%;border-radius:14px;${grande?'':'max-height:220px;object-fit:cover'}"></div>`;
    }
    if(id==='carta_reciente'){
      const { data } = await sb.from('cartas').select('titulo,cuerpo,created_at').eq('couple_id',SESSION.coupleId).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(!data) return '';
      return `<div class="card" style="cursor:pointer" onclick="switchTab('cartas')"><h3>💌 Carta reciente</h3><b>${esc(data.titulo||'Sin título')}</b><p class="small muted" style="margin-top:4px">${esc((data.cuerpo||'').slice(0,grande?300:100))}${(data.cuerpo||'').length>100?'…':''}</p></div>`;
    }
    if(id==='proxima_fecha'){
      const hoyStr = new Date().toISOString().slice(0,10);
      const { data } = await sb.from('calendario').select('*').eq('couple_id',SESSION.coupleId).eq('tipo','hito').gte('fecha', hoyStr).order('fecha',{ascending:true}).limit(1).maybeSingle();
      if(!data) return '';
      const dias = Math.ceil((new Date(data.fecha+'T00:00:00')-new Date())/86400000);
      return `<div class="card" style="cursor:pointer" onclick="switchTab('calendario')"><h3>📅 Próxima fecha importante</h3><b>${data.icono_personalizado||'💞'} ${esc(data.titulo)}</b><p class="small muted">Faltan ${dias} día${dias!==1?'s':''}</p></div>`;
    }
    if(id==='tareas_compartidas'){
      const { data: listas } = await sb.from('checklists').select('id').eq('couple_id',SESSION.coupleId);
      if(!listas || !listas.length) return '';
      const { data: items } = await sb.from('checklist_items').select('texto,hecho').in('checklist_id', listas.map(l=>l.id)).eq('hecho', false).limit(grande?8:4);
      return `<div class="card" style="cursor:pointer" onclick="switchTab('organizacion')"><h3>✅ Tareas pendientes</h3>${(items&&items.length)?items.map(i=>`<div class="small" style="padding:2px 0">☐ ${esc(i.texto)}</div>`).join(''):'<div class="empty small">¡Todo al día! 🎉</div>'}</div>`;
    }
    if(id==='lista_compras_w'){
      const { data } = await sb.from('compras_items').select('nombre').eq('couple_id',SESSION.coupleId).eq('comprado', false).limit(grande?8:4);
      return `<div class="card" style="cursor:pointer" onclick="switchTab('organizacion')"><h3>🛒 Por comprar</h3>${(data&&data.length)?data.map(i=>`<div class="small" style="padding:2px 0">• ${esc(i.nombre)}</div>`).join(''):'<div class="empty small">Lista vacía 🛍️</div>'}</div>`;
    }
    if(id==='nota_rapida_w'){
      return `<div class="card"><h3>📝 Nota rápida</h3><textarea id="wNotaRapidaTexto" rows="2" placeholder="Escribe algo..."></textarea><button class="btn btn-sm btn-gold" style="margin-top:6px" onclick="guardarNotaRapidaWidget()">Guardar</button></div>`;
    }
    if(id==='cancion_favorita'){
      const { data } = await sb.from('musica_playlist').select('titulo,artista').eq('couple_id',SESSION.coupleId).order('calificacion',{ascending:false}).limit(1).maybeSingle();
      if(!data) return '';
      return `<div class="card" style="cursor:pointer" onclick="switchTab('chat')"><h3>🎵 Canción favorita</h3><b>${esc(data.titulo||'')}</b><div class="small muted">${esc(data.artista||'')}</div></div>`;
    }
    if(id==='dibujo_favorito'){
      const { data } = await sb.from('album').select('img_url').eq('couple_id',SESSION.coupleId).eq('tipo','dibujo').eq('favorito', true).limit(1).maybeSingle();
      if(!data) return '';
      return `<div class="card"><h3>🎨 Dibujo favorito</h3><img src="${data.img_url}" style="width:100%;border-radius:14px;max-height:220px;object-fit:contain"></div>`;
    }
    if(id==='recuerdo_aleatorio'){
      const { data } = await sb.from('banco_recuerdos').select('texto').eq('couple_id',SESSION.coupleId);
      if(!data || !data.length) return '';
      const r = data[Math.floor(Math.random()*data.length)];
      return `<div class="card"><h3>🎲 Recuerdo aleatorio</h3><p class="small" style="white-space:pre-wrap">${esc(r.texto)}</p></div>`;
    }
    if(id==='un_dia_como_hoy'){
      const now = new Date();
      const { data } = await sb.from('album').select('img_url,texto,created_at').eq('couple_id',SESSION.coupleId);
      const coinciden = (data||[]).filter(a=>{ const d=new Date(a.created_at); return d.getDate()===now.getDate() && d.getMonth()===now.getMonth() && d.getFullYear()<now.getFullYear(); });
      if(!coinciden.length) return '';
      const item = coinciden[0];
      return `<div class="card"><h3>🕰️ Un día como hoy</h3>${item.img_url?`<img src="${item.img_url}" style="width:100%;border-radius:14px;max-height:200px;object-fit:cover">`:''}<p class="small muted" style="margin-top:6px">${esc(item.texto||'')} · ${new Date(item.created_at).getFullYear()}</p></div>`;
    }
    if(id==='objetivos_compartidos'){
      const { data: p } = await sb.from('pareja').select('metas').eq('couple_id',SESSION.coupleId).maybeSingle();
      const metas = (p && p.metas) || [];
      const pendientes = metas.filter(m=>!m.hecho).slice(0,grande?8:4);
      if(!pendientes.length) return '';
      return `<div class="card" style="cursor:pointer" onclick="switchTab('nosotros')"><h3>🎯 Objetivos compartidos</h3>${pendientes.map(m=>`<div class="small" style="padding:2px 0">☐ ${esc(m.texto||m.titulo||'')}</div>`).join('')}</div>`;
    }
    if(id==='te_extrano_w'){
      return `<div class="card" style="text-align:center">
        <h3>🥺 Un pensamiento</h3>
        <div class="row" style="justify-content:center;gap:10px;margin-top:8px">
          <button class="btn btn-gold" onclick="enviarWidgetInteractivo('te_extrano')">🥺 Te extraño</button>
          <button class="btn btn-outline" onclick="enviarWidgetInteractivo('pensando_en_ti')">💭 Pensando en ti</button>
        </div>
        <div id="teExtranoUltimo" class="small muted" style="margin-top:8px"></div>
      </div>`;
    }
    if(id==='nota_compartida_w'){
      const { data } = await sb.from('widgets_interactivos').select('*').eq('couple_id',SESSION.coupleId).eq('tipo','nota_compartida').order('created_at',{ascending:false}).limit(1).maybeSingle();
      return `<div class="card"><h3>🗒️ Nota adhesiva compartida</h3><textarea id="wNotaCompartidaTexto" rows="2" placeholder="Escriban algo juntos...">${esc((data&&data.contenido)||'')}</textarea><button class="btn btn-sm btn-primary" style="margin-top:6px" onclick="guardarNotaCompartidaWidget()">Guardar</button></div>`;
    }
    if(id==='dibujo_compartido_w'){
      return `<div class="card"><h3>✏️ Dibujo compartido</h3><canvas id="wDibujoCanvas" width="280" height="160" style="width:100%;background:#fff;border-radius:12px;touch-action:none;border:1px solid var(--linea)"></canvas>
        <div class="row" style="gap:8px;margin-top:6px"><button class="btn btn-sm" onclick="limpiarDibujoWidget()">Borrar</button><button class="btn btn-sm btn-gold" onclick="enviarDibujoWidget()">Enviar a mi pareja</button></div></div>`;
    }
  }catch(e){ console.error('widget extra', id, e); return ''; }
  return '';
}

async function guardarNotaRapidaWidget(){
  const texto = document.getElementById('wNotaRapidaTexto').value.trim();
  if(!texto) return;
  await sb.from('notas_rapidas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'compartida', texto});
  toast('Nota guardada 📝'); renderInicio();
}
async function guardarNotaCompartidaWidget(){
  const contenido = document.getElementById('wNotaCompartidaTexto').value;
  await sb.from('widgets_interactivos').insert({couple_id:SESSION.coupleId, tipo:'nota_compartida', autor_id:SESSION.user.id, contenido});
  toast('Nota compartida actualizada 🗒️');
}
async function enviarWidgetInteractivo(tipo){
  await sb.from('widgets_interactivos').insert({couple_id:SESSION.coupleId, tipo, autor_id:SESSION.user.id});
  toast(tipo==='te_extrano' ? 'Le avisamos que los extrañas 🥺' : 'Le avisamos que piensas en ella/él 💭');
}
let dibujoWidgetCtx = null, dibujoWidgetDibujando = false;
function inicializarInteraccionesWidgetsExtra(){
  const cv = document.getElementById('wDibujoCanvas');
  if(cv && !cv.dataset.listo){
    cv.dataset.listo = '1';
    dibujoWidgetCtx = cv.getContext('2d');
    dibujoWidgetCtx.lineWidth = 3; dibujoWidgetCtx.lineCap = 'round'; dibujoWidgetCtx.strokeStyle = '#c3527a';
    const pos = (e)=>{ const r=cv.getBoundingClientRect(); const p = e.touches?e.touches[0]:e; return [(p.clientX-r.left)*(cv.width/r.width), (p.clientY-r.top)*(cv.height/r.height)]; };
    const start = (e)=>{ dibujoWidgetDibujando=true; const [x,y]=pos(e); dibujoWidgetCtx.beginPath(); dibujoWidgetCtx.moveTo(x,y); };
    const move = (e)=>{ if(!dibujoWidgetDibujando) return; e.preventDefault(); const [x,y]=pos(e); dibujoWidgetCtx.lineTo(x,y); dibujoWidgetCtx.stroke(); };
    const end = ()=> dibujoWidgetDibujando=false;
    cv.addEventListener('mousedown', start); cv.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    cv.addEventListener('touchstart', start); cv.addEventListener('touchmove', move); cv.addEventListener('touchend', end);
  }
}
function limpiarDibujoWidget(){ const cv=document.getElementById('wDibujoCanvas'); if(cv) dibujoWidgetCtx.clearRect(0,0,cv.width,cv.height); }
async function enviarDibujoWidget(){
  const cv = document.getElementById('wDibujoCanvas');
  if(!cv) return;
  const img_url = await subirImagen(cv.toDataURL('image/png'), 'widgets', 'dibujo');
  await sb.from('widgets_interactivos').insert({couple_id:SESSION.coupleId, tipo:'dibujo_compartido', autor_id:SESSION.user.id, img_url});
  toast('Dibujo enviado a tu pareja ✏️');
}
