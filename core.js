/* ================= LIBRO DE LA RELACIÓN (portada, dedicatoria, marcapáginas) ================= */
const PORTADAS_LIBRO = [
  {id:'clasica', label:'Clásica rosa', emoji:'💗'},
  {id:'dorada', label:'Dorada', emoji:'✨'},
  {id:'lila', label:'Lila', emoji:'🌸'},
  {id:'noche', label:'Nocturna', emoji:'🌙'},
];
// Estado local de edición: mientras el overlay está abierto, todos los cambios (portada,
// dedicatoria, marcapáginas) se aplican aquí y NO se vuelven a pedir a Supabase en cada
// re-render. Antes, cada clic en una portada llamaba a renderLibroPersonalizar(), que
// releía la config guardada (todavía sin el cambio) y así "pisaba" la selección que la
// persona acababa de hacer y cualquier dedicatoria que ya hubiera escrito.
let _libroCfgLocal = null;
async function renderLibroPersonalizar(){
  if(!_libroCfgLocal){
    const { data } = await sb.from('libro_config').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
    _libroCfgLocal = data || {portada_color:'clasica', portada_emoji:'💗', dedicatoria:'', marcapaginas:[]};
  }
  const cfg = _libroCfgLocal;
  const existente = document.getElementById('libroOverlay'); if(existente) existente.remove();
  const overlay = document.createElement('div');
  overlay.id = 'libroOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(30,20,30,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:460px;width:100%;max-height:92vh;overflow-y:auto;padding:20px;position:relative">
      <button onclick="cerrarLibroOverlay()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <h3>📖 Personalizar el libro</h3>
      <p class="muted small">Elige la portada, escribe una dedicatoria y guarda tus pasajes favoritos como marcapáginas.</p>
      <div class="field"><label>Portada</label>
        <div class="av-options">${PORTADAS_LIBRO.map(p=>`<div class="av-opt ${cfg.portada_color===p.id?'active':''}" onclick="elegirPortadaLibro('${p.id}','${p.emoji}')"><span class="ao-icon">${p.emoji}</span><span>${p.label}</span></div>`).join('')}</div>
      </div>
      <div class="field"><label>Dedicatoria</label><textarea id="libroDedicatoria" rows="3" placeholder="Para ti, que...">${esc(cfg.dedicatoria||'')}</textarea></div>
      <button class="btn btn-gold btn-block" onclick="guardarLibroConfig()">Guardar personalización</button>
      <div class="section-title" style="margin-top:16px">🔖 Marcapáginas</div>
      <div class="row" style="gap:8px"><input id="marcapaginaTitulo" placeholder="Pasaje o momento favorito" style="flex:1"></div>
      <textarea id="marcapaginaNota" rows="2" placeholder="Nota (opcional)" style="margin-top:6px"></textarea>
      <button class="btn btn-sm btn-primary" style="margin-top:6px" onclick="agregarMarcapagina()">Añadir marcapáginas</button>
      ${(cfg.marcapaginas||[]).map((m,i)=>`<div class="row" style="justify-content:space-between;padding:6px 0"><div><b>${esc(m.titulo)}</b>${m.nota?`<div class="small muted">${esc(m.nota)}</div>`:''}</div><span class="tag-del" onclick="quitarMarcapagina(${i})">✕</span></div>`).join('')}
    </div>`;
  document.body.appendChild(overlay);
}
function cerrarLibroOverlay(){
  const el = document.getElementById('libroOverlay'); if(el) el.remove();
  _libroCfgLocal = null; // al reabrir, que vuelva a leer lo último guardado en Supabase
}
function elegirPortadaLibro(id, emoji){
  // Guardamos primero lo que la persona ya haya escrito en la dedicatoria, para no perderlo
  // al re-renderizar el overlay con la nueva portada seleccionada.
  const ta = document.getElementById('libroDedicatoria');
  if(ta) _libroCfgLocal.dedicatoria = ta.value;
  _libroCfgLocal.portada_color = id;
  _libroCfgLocal.portada_emoji = emoji;
  renderLibroPersonalizar();
}
async function guardarLibroConfig(){
  const dedicatoria = document.getElementById('libroDedicatoria').value.trim();
  _libroCfgLocal.dedicatoria = dedicatoria;
  const { couple_id, ...resto } = _libroCfgLocal;
  await sb.from('libro_config').upsert({couple_id:SESSION.coupleId, ...resto, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  toast('Libro personalizado 📖');
  cerrarLibroOverlay();
}
async function agregarMarcapagina(){
  const titulo = document.getElementById('marcapaginaTitulo').value.trim();
  const nota = document.getElementById('marcapaginaNota').value.trim();
  if(!titulo){ toast('Escribe un título para el marcapáginas'); return; }
  const ta = document.getElementById('libroDedicatoria');
  if(ta) _libroCfgLocal.dedicatoria = ta.value;
  _libroCfgLocal.marcapaginas = [...(_libroCfgLocal.marcapaginas||[]), {titulo, nota}];
  const { couple_id, ...resto } = _libroCfgLocal;
  await sb.from('libro_config').upsert({couple_id:SESSION.coupleId, ...resto, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  toast('Marcapáginas añadido 🔖'); renderLibroPersonalizar();
}
async function quitarMarcapagina(idx){
  _libroCfgLocal.marcapaginas = (_libroCfgLocal.marcapaginas||[]).filter((_,i)=>i!==idx);
  const { couple_id, ...resto } = _libroCfgLocal;
  await sb.from('libro_config').upsert({couple_id:SESSION.coupleId, ...resto, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  renderLibroPersonalizar();
}
