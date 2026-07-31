/* ================= CALIDAD DE VIDA (búsqueda global, atajos, accesibilidad, idioma) ================= */

/* ---------- Modo offline / caché para carga rápida ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('firebase-messaging-sw.js').catch(()=>{ /* silencioso: sin caché offline si falla */ });
  });
}

/* ---------- Búsqueda global ---------- */
async function abrirBusquedaGlobal(){
  const existente = document.getElementById('busquedaOverlay'); if(existente){ existente.remove(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'busquedaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:150;background:rgba(30,20,30,.75);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;padding:18px;position:relative">
      <button onclick="document.getElementById('busquedaOverlay').remove()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <h3>🔎 Buscar en toda la app</h3>
      <input id="busquedaGlobalInput" placeholder="Cartas, álbum, diario, colecciones..." style="width:100%;padding:12px 14px;border-radius:14px;border:1.5px solid var(--linea);margin:10px 0" autofocus>
      <div id="busquedaGlobalResultados" class="small muted">Escribe al menos 3 letras para buscar.</div>
    </div>`;
  document.body.appendChild(overlay);
  const input = document.getElementById('busquedaGlobalInput');
  input.focus();
  let t = null;
  input.addEventListener('input', ()=>{
    clearTimeout(t);
    t = setTimeout(()=> ejecutarBusquedaGlobal(input.value.trim()), 350);
  });
}
async function ejecutarBusquedaGlobal(q){
  const cont = document.getElementById('busquedaGlobalResultados');
  if(!cont) return;
  if(q.length < 3){ cont.innerHTML = '<div class="small muted">Escribe al menos 3 letras para buscar.</div>'; return; }
  cont.innerHTML = '<div class="small muted">Buscando...</div>';
  const like = `%${q}%`;
  const [cartas, album, diario, notas, colecciones] = await Promise.all([
    sb.from('cartas').select('id,titulo,cuerpo').eq('couple_id',SESSION.coupleId).or(`titulo.ilike.${like},cuerpo.ilike.${like}`).limit(6),
    sb.from('album').select('id,texto').eq('couple_id',SESSION.coupleId).ilike('texto', like).limit(6),
    sb.from('diario').select('id,texto').eq('couple_id',SESSION.coupleId).ilike('texto', like).limit(6),
    sb.from('notas_rapidas').select('id,texto').eq('couple_id',SESSION.coupleId).ilike('texto', like).limit(6),
    sb.from('colecciones_items').select('id,titulo,texto,coleccion').eq('couple_id',SESSION.coupleId).or(`titulo.ilike.${like},texto.ilike.${like}`).limit(6),
  ]);
  const bloques = [
    {titulo:'💌 Cartas', items:(cartas.data||[]).map(c=>`<div class="small" style="padding:4px 0">${esc(c.titulo||c.cuerpo?.slice(0,60)||'')}</div>`), tab:'cartas'},
    {titulo:'🖼️ Álbum', items:(album.data||[]).map(a=>`<div class="small" style="padding:4px 0">${esc(a.texto||'')}</div>`), tab:'cartas'},
    {titulo:'📔 Diario', items:(diario.data||[]).map(d=>`<div class="small" style="padding:4px 0">${esc(d.texto||'')}</div>`), tab:'recuerdos'},
    {titulo:'📝 Notas', items:(notas.data||[]).map(n=>`<div class="small" style="padding:4px 0">${esc(n.texto||'')}</div>`), tab:'notas'},
    {titulo:'💕 Colecciones', items:(colecciones.data||[]).map(c=>`<div class="small" style="padding:4px 0">${esc(c.titulo||'')} <span class="muted">(${c.coleccion})</span></div>`), tab:'coleccion'},
  ].filter(b=>b.items.length);
  cont.innerHTML = bloques.length ? bloques.map(b=>`<div style="margin-top:10px"><b class="small">${b.titulo}</b><div onclick="document.getElementById('busquedaOverlay').remove();switchTab('${b.tab}')" style="cursor:pointer">${b.items.join('')}</div></div>`).join('') : '<div class="small muted">Sin resultados.</div>';
}

/* ---------- Atajos de teclado (versión web) ---------- */
const ATAJOS_TABS = {'1':'inicio','2':'cartas','3':'chat','4':'album','5':'calendario','6':'organizacion','7':'coleccion','8':'config'};
document.addEventListener('keydown', (e)=>{
  const enCampo = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  if(e.key==='/' && !enCampo){ e.preventDefault(); abrirBusquedaGlobal(); return; }
  if(e.key==='Escape'){
    ['busquedaOverlay','estadoOverlay','libroOverlay','historiaOverlay','albumModalOverlay'].forEach(id=>{ const o=document.getElementById(id); if(o) o.remove(); });
    return;
  }
  if(!enCampo && typeof ATAJOS_TABS[e.key]!=='undefined' && typeof switchTab==='function'){
    switchTab(ATAJOS_TABS[e.key]);
  }
});

/* ---------- Accesibilidad ---------- */
async function renderConfigAccesibilidad(body){
  const p = PERSONALIZACION || {};
  const acc = p.accesibilidad || {};
  body.innerHTML = `
    <div class="card">
      <h3>♿ Accesibilidad</h3>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon blue">🔠</div><div><label>Texto más grande</label></div></div><button class="config-toggle ${acc.textoGrande?'on':''}" onclick="guardarAccesibilidad('textoGrande', this)"></button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">◐</div><div><label>Alto contraste</label></div></div><button class="config-toggle ${acc.altoContraste?'on':''}" onclick="guardarAccesibilidad('altoContraste', this)"></button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">🚫</div><div><label>Reducir animaciones</label></div></div><button class="config-toggle ${acc.reducirMovimiento?'on':''}" onclick="guardarAccesibilidad('reducirMovimiento', this)"></button></div>
    </div>`;
}
async function guardarAccesibilidad(key, btn){
  const acc = Object.assign({}, PERSONALIZACION.accesibilidad||{});
  acc[key] = !acc[key];
  btn.classList.toggle('on', acc[key]);
  await guardarPersonalizacion({accesibilidad: acc});
  aplicarAccesibilidad();
}
function aplicarAccesibilidad(){
  const acc = (PERSONALIZACION && PERSONALIZACION.accesibilidad) || {};
  const html = document.documentElement;
  html.toggleAttribute('data-a11y-texto-grande', !!acc.textoGrande);
  html.toggleAttribute('data-a11y-alto-contraste', !!acc.altoContraste);
  html.toggleAttribute('data-a11y-reducir-mov', !!acc.reducirMovimiento);
}

/* ---------- Soporte multidioma (interfaz) ---------- */
/* NOTA: el selector de idioma se quitó de Ajustes por ahora (a pedido). El código de
   traducción se deja aquí desactivado, listo para reactivarse más adelante: basta con
   volver a mostrar el <select> en renderConfigAccesibilidad y descomentar el bloque
   de abajo que arranca el observador. */
const I18N = {
  es: {},
  en: {}
};
function tI18n(texto){ return texto; }
async function guardarIdioma(idioma){
  await guardarPersonalizacion({idioma});
  if(typeof buildTabbar==='function') buildTabbar();
}
function aplicarIdiomaGlobal(){ /* desactivado por ahora */ }
/*
(function observarCambiosParaIdioma(){
  let pendiente = null;
  const obs = new MutationObserver(()=>{
    if(pendiente) clearTimeout(pendiente);
    pendiente = setTimeout(aplicarIdiomaGlobal, 120);
  });
  const intento = setInterval(()=>{
    const main = document.getElementById('main');
    if(main){
      clearInterval(intento);
      obs.observe(document.body, {childList:true, subtree:true, characterData:true});
      aplicarIdiomaGlobal();
    }
  }, 500);
})();
*/

/* Inicializa accesibilidad apenas la sesión esté lista */
(function pollA11yInicial(){
  let intentos = 0;
  const t2 = setInterval(()=>{
    intentos++;
    if(typeof PERSONALIZACION!=='undefined' && PERSONALIZACION){ clearInterval(t2); aplicarAccesibilidad(); }
    else if(intentos>120){ clearInterval(t2); }
  }, 1000);
})();
