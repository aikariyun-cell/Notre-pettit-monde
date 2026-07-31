/* ================= PERSONALIZACIÓN VISUAL (washi tape, marcos, sellos, pegatinas, temporadas) ================= */
const DECO_OPCIONES = [
  {id:'washi', icon:'🎀', label:'Washi tape en las tarjetas'},
  {id:'marco', icon:'🖼️', label:'Marcos decorativos'},
  {id:'sello', icon:'💌', label:'Sellos decorativos'},
  {id:'pegatinas', icon:'✨', label:'Pegatinas flotantes'},
];
const COLORES_ACENTO = ['#e97ea6','#c9527a','#8a5ad0','#e0a45f','#6fb0a3','#e06f8b','#9a7bd1','#d98a55'];
const FONDOS_COLECCION = [
  {id:'sakura', label:'Sakura', bg:'linear-gradient(135deg,#fff5f8,#ffe7ef)', texto:'#5a3a48'},
  {id:'lavanda', label:'Lavanda', bg:'linear-gradient(135deg,#f6f2ff,#eae0fb)', texto:'#453a5c'},
  {id:'dorado', label:'Atardecer dorado', bg:'linear-gradient(135deg,#fff8ea,#ffe9c2)', texto:'#5c4a28'},
  {id:'menta', label:'Menta suave', bg:'linear-gradient(135deg,#f1fbf6,#dcf3e6)', texto:'#2e5346'},
  {id:'nocturno', label:'Cielo nocturno', bg:'linear-gradient(135deg,#232041,#3a2f66)', texto:'#f3e9f6'},
];
const ICONOS_APP = ['💗','🌙','⭐','🌸','🦋','🍯','☕','🌿'];

async function renderPersonalizacionVisual(){
  const main = document.getElementById('main');
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = (extras && extras.decoracion) || {};
  const activos = deco.activos || [];
  main.innerHTML = `
    <div class="card">
      <h2>🎨 Personalización visual</h2>
      <p class="muted small">Decoren su espacio: washi tape, marcos, sellos y pegatinas se aplican en toda la app.</p>
      <div class="av-options">
        ${DECO_OPCIONES.map(o=>`<div class="av-opt ${activos.includes(o.id)?'active':''}" onclick="toggleDecoracion('${o.id}')"><span class="ao-icon">${o.icon}</span><span>${o.label}</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3>🍂 Temas estacionales automáticos</h3>
      <p class="small muted">Cambia sutilmente los colores de la app según la temporada del año.</p>
      <label class="row" style="gap:8px"><input type="checkbox" id="temaEstacionalChk" ${deco.temas_estacionales?'checked':''} onchange="guardarTemaEstacional(this.checked)"> <span class="small">Activar temas estacionales</span></label>
    </div>
    <div class="card">
      <h3>🌈 Color de acento</h3>
      <p class="small muted">Elige tu color favorito para resaltados y botones, o personaliza el tuyo.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${COLORES_ACENTO.map(c=>`<div onclick="guardarColorAcento('${c}')" style="width:32px;height:32px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${deco.colorAcento===c?'#333':'transparent'}"></div>`).join('')}
        <input type="color" id="colorAcentoCustom" value="${deco.colorAcento||'#e97ea6'}" style="width:40px;height:32px;border:none;background:none;cursor:pointer" onchange="guardarColorAcento(this.value)">
      </div>
      ${deco.colorAcento ? `<button class="btn btn-sm" style="margin-top:8px" onclick="guardarColorAcento('')">Quitar color personalizado</button>` : ''}
    </div>
    <div class="card">
      <h3>🖼️ Colección de fondos</h3>
      <div class="av-options">
        ${FONDOS_COLECCION.map(f=>`<div class="av-opt ${deco.fondo===f.id?'active':''}" onclick="guardarFondoColeccion('${f.id}')" style="background:${f.bg};color:${f.texto};border-color:${deco.fondo===f.id?'var(--dorado)':'rgba(0,0,0,.12)'}"><span>${f.label}</span></div>`).join('')}
        <div class="av-opt ${!deco.fondo?'active':''}" onclick="guardarFondoColeccion('')"><span class="ao-icon">🚫</span><span>Ninguno</span></div>
      </div>
    </div>
    <div class="card">
      <h3>💗 Icono de la app</h3>
      <p class="small muted">Personaliza el ícono que aparece en el encabezado.</p>
      <div class="av-options">
        ${ICONOS_APP.map(e=>`<div class="av-opt ${(deco.icono||'💗')===e?'active':''}" onclick="guardarIconoApp('${e}')"><span class="ao-icon">${e}</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3>🖱️ Cursor personalizado <span class="small muted">(versión web)</span></h3>
      <label class="row" style="gap:8px"><input type="checkbox" id="cursorChk" ${deco.cursor?'checked':''} onchange="guardarCursorPersonalizado(this.checked)"> <span class="small">Activar cursor con corazón</span></label>
    </div>
  `;
}
async function toggleDecoracion(id){
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = (extras && extras.decoracion) || {};
  let activos = deco.activos || [];
  activos = activos.includes(id) ? activos.filter(a=>a!==id) : [...activos, id];
  const nuevaDeco = Object.assign({}, deco, {activos});
  await sb.from('extras').upsert({couple_id:SESSION.coupleId, decoracion:nuevaDeco, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  aplicarDecoracionGlobal();
  renderPersonalizacionVisual();
}
async function guardarTemaEstacional(activo){
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = (extras && extras.decoracion) || {};
  const nuevaDeco = Object.assign({}, deco, {temas_estacionales:activo});
  await sb.from('extras').upsert({couple_id:SESSION.coupleId, decoracion:nuevaDeco, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  aplicarDecoracionGlobal();
  toast(activo? 'Temas estacionales activados 🍂' : 'Temas estacionales desactivados');
}

async function guardarColorAcento(color){
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = Object.assign({}, (extras && extras.decoracion) || {}, {colorAcento: color||null});
  await sb.from('extras').upsert({couple_id:SESSION.coupleId, decoracion:deco, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  aplicarDecoracionGlobal(); renderPersonalizacionVisual();
}
async function guardarFondoColeccion(id){
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = Object.assign({}, (extras && extras.decoracion) || {}, {fondo: id||null});
  await sb.from('extras').upsert({couple_id:SESSION.coupleId, decoracion:deco, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  aplicarDecoracionGlobal(); renderPersonalizacionVisual();
}
async function guardarIconoApp(emoji){
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = Object.assign({}, (extras && extras.decoracion) || {}, {icono: emoji});
  await sb.from('extras').upsert({couple_id:SESSION.coupleId, decoracion:deco, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  aplicarDecoracionGlobal(); renderPersonalizacionVisual();
}
async function guardarCursorPersonalizado(activo){
  const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
  const deco = Object.assign({}, (extras && extras.decoracion) || {}, {cursor: activo});
  await sb.from('extras').upsert({couple_id:SESSION.coupleId, decoracion:deco, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  aplicarDecoracionGlobal();
}
function seasonalClassForDate(d){
  const m = d.getMonth();
  if([2,3,4].includes(m)) return 'primavera';
  if([5,6,7].includes(m)) return 'verano';
  if([8,9,10].includes(m)) return 'otono';
  return 'invierno';
}
async function aplicarDecoracionGlobal(){
  try{
    if(!SESSION || !SESSION.coupleId) return;
    const { data: extras } = await sb.from('extras').select('decoracion').eq('couple_id', SESSION.coupleId).maybeSingle();
    const deco = (extras && extras.decoracion) || {};
    const activos = deco.activos || [];
    const html = document.documentElement;
    DECO_OPCIONES.forEach(o=> html.toggleAttribute('data-deco-'+o.id, activos.includes(o.id)));
    if(deco.temas_estacionales){
      html.setAttribute('data-estacion', seasonalClassForDate(new Date()));
    } else {
      html.removeAttribute('data-estacion');
    }
    if(deco.colorAcento){ html.style.setProperty('--rosa-int', deco.colorAcento); }
    else { html.style.removeProperty('--rosa-int'); }
    const fondo = FONDOS_COLECCION.find(f=>f.id===deco.fondo);
    if(fondo){ document.body.style.background = fondo.bg; document.body.style.backgroundAttachment='fixed'; }
    else { document.body.style.background = ''; }
    const mark = document.getElementById('appMark'); if(mark) mark.textContent = deco.icono || '💗';
    html.toggleAttribute('data-cursor-corazon', !!deco.cursor);
  }catch(e){ /* silencioso: la personalización visual es decorativa, no crítica */ }
}
// Aplica la decoración apenas la sesión esté lista (login demo o real)
(function pollDecoracionInicial(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof SESSION!=='undefined' && SESSION && SESSION.coupleId){
      clearInterval(t);
      aplicarDecoracionGlobal();
    } else if(intentos>120){
      clearInterval(t);
    }
  }, 1000);
})();
