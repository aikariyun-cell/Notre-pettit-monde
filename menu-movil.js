/* ================= BIBLIOTECA DE RECUERDOS ================= */
let bibliotecaFiltro = 'recientes';
let bibliotecaEtiqueta = '';
let bibliotecaPersona = 'todos';
let bibliotecaEmocion = '';
let bibliotecaSemilla = Math.random();

async function renderBiblioteca(){
  const main = document.getElementById('main');
  const { data } = await sb.from('album').select('*').eq('couple_id', SESSION.coupleId).eq('eliminado', false);
  let items = data||[];

  const todasEtiquetas = [...new Set(items.flatMap(a=>a.etiquetas||[]))];
  const todasEmociones = [...new Set(items.map(a=>a.emocion).filter(Boolean))];

  if(bibliotecaPersona==='tu') items = items.filter(a=>a.autor_id===SESSION.user.id);
  else if(bibliotecaPersona==='pareja') items = items.filter(a=>a.autor_id!==SESSION.user.id);
  if(bibliotecaEtiqueta) items = items.filter(a=>(a.etiquetas||[]).includes(bibliotecaEtiqueta));
  if(bibliotecaEmocion) items = items.filter(a=>a.emocion===bibliotecaEmocion);

  if(bibliotecaFiltro==='favoritos') items = items.filter(a=>a.favorito);
  if(bibliotecaFiltro==='mas_vistos') items = items.slice().sort((a,b)=>(b.vistas||0)-(a.vistas||0));
  else if(bibliotecaFiltro==='recientes') items = items.slice().sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  else if(bibliotecaFiltro==='aleatorio') items = mezclarConSemilla(items, bibliotecaSemilla);

  main.innerHTML = `
    <div class="card">
      <h2>📖 Biblioteca de recuerdos</h2>
      <p class="muted small">Todo su álbum, organizado como ustedes quieran verlo.</p>
      <div class="subtabs" id="bibliotecaSubtabs">
        <button data-f="recientes" class="${bibliotecaFiltro==='recientes'?'active':''}">🕐 Recientes</button>
        <button data-f="favoritos" class="${bibliotecaFiltro==='favoritos'?'active':''}">⭐ Favoritos</button>
        <button data-f="mas_vistos" class="${bibliotecaFiltro==='mas_vistos'?'active':''}">🔥 Más vistos</button>
        <button data-f="aleatorio" class="${bibliotecaFiltro==='aleatorio'?'active':''}">🎲 Aleatorio</button>
      </div>
      <div class="grid2" style="margin-top:8px">
        <div class="field"><label>Persona</label>
          <select id="bibliotecaPersonaSel" onchange="bibliotecaPersona=this.value;renderBiblioteca()">
            <option value="todos" ${bibliotecaPersona==='todos'?'selected':''}>Ambos</option>
            <option value="tu" ${bibliotecaPersona==='tu'?'selected':''}>Solo tú</option>
            <option value="pareja" ${bibliotecaPersona==='pareja'?'selected':''}>Solo tu pareja</option>
          </select>
        </div>
        <div class="field"><label>Emoción</label>
          <select id="bibliotecaEmocionSel" onchange="bibliotecaEmocion=this.value;renderBiblioteca()">
            <option value="">Todas</option>
            ${todasEmociones.map(e=>`<option value="${e}" ${bibliotecaEmocion===e?'selected':''}>${e}</option>`).join('')}
          </select>
        </div>
      </div>
      ${todasEtiquetas.length ? `<div class="field"><label>Etiqueta</label>
        <select id="bibliotecaEtiquetaSel" onchange="bibliotecaEtiqueta=this.value;renderBiblioteca()">
          <option value="">Todas</option>
          ${todasEtiquetas.map(t=>`<option value="${esc(t)}" ${bibliotecaEtiqueta===t?'selected':''}>${esc(t)}</option>`).join('')}
        </select></div>` : ''}
    </div>
    <p class="small muted" style="padding:0 4px">${items.length} recuerdo${items.length!==1?'s':''}</p>
    <div class="album-grid" id="bibliotecaGrid">
      ${items.length ? items.map(a=>`
        <div class="a-item" onclick="abrirItemAlbum('${a.id}')">
          ${a.img_url ? `<img src="${a.img_url}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:26px;background:linear-gradient(135deg,var(--rosa),var(--lila))">${a.emocion||'💗'}</div>`}
          ${a.favorito?`<div style="position:absolute;top:4px;left:4px;font-size:13px">⭐</div>`:''}
          ${bibliotecaFiltro==='mas_vistos'?`<div style="position:absolute;top:4px;right:4px;font-size:11px;background:rgba(0,0,0,.5);color:#fff;border-radius:8px;padding:1px 6px">👁️ ${a.vistas||0}</div>`:''}
          <div class="a-cap">${esc(a.texto||'')}</div>
        </div>`).join('') : '<div class="empty" style="grid-column:1/-1"><span class="ic">📖</span>No hay recuerdos con estos filtros.</div>'}
    </div>`;
  document.querySelectorAll('#bibliotecaSubtabs button').forEach(b=>b.onclick=()=>{
    bibliotecaFiltro = b.dataset.f;
    if(bibliotecaFiltro==='aleatorio') bibliotecaSemilla = Math.random();
    renderBiblioteca();
  });
}
function mezclarConSemilla(arr, semilla){
  const copia = arr.slice();
  let s = semilla*10000;
  const rand = ()=>{ s = (s*9301+49297)%233280; return s/233280; };
  for(let i=copia.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [copia[i],copia[j]]=[copia[j],copia[i]]; }
  return copia;
}
