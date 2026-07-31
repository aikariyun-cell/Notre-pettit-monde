/* ================= 📒 SCRAPBOOK INTERACTIVO (páginas libres) ================= */
const PAPELES_SCRAPBOOK = {
  kraft: {label:'Kraft', bg:'#d9c5a0'},
  blanco: {label:'Blanco', bg:'#fdfaf4'},
  rosa: {label:'Rosa', bg:'#fbe4ec'},
  azul: {label:'Azul', bg:'#e2edf7'},
  negro: {label:'Negro', bg:'#2a2530'},
};
let scrapPaginaActual = 'Página 1';
let scrapModoAgregar = null;

async function renderScrapbookPaginas(body){
  const [{data:paginas}, {data:itemsPag}, {data:cfg}] = await Promise.all([
    sb.from('scrapbook').select('pagina').eq('couple_id',SESSION.coupleId),
    sb.from('scrapbook').select('*').eq('couple_id',SESSION.coupleId).eq('pagina', scrapPaginaActual).order('z_index',{ascending:true}),
    sb.from('scrapbook_paginas_config').select('*').eq('couple_id',SESSION.coupleId).eq('pagina', scrapPaginaActual).maybeSingle(),
  ]);
  const listaPaginas = [...new Set((paginas||[]).map(p=>p.pagina))];
  if(!listaPaginas.includes(scrapPaginaActual)) listaPaginas.push(scrapPaginaActual);
  const papel = PAPELES_SCRAPBOOK[(cfg&&cfg.papel)||'kraft'];

  body.innerHTML = `
    <div class="subtabs" id="scrapVistaTabs">
      <button data-v="cuadricula" class="${scrapVista==='cuadricula'?'active':''}">▦ Cuadrícula</button>
      <button data-v="paginas" class="${scrapVista==='paginas'?'active':''}">📒 Páginas libres</button>
    </div>
    <div class="card">
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <select id="scrapPaginaSel" style="flex:1">${listaPaginas.map(p=>`<option value="${esc(p)}" ${p===scrapPaginaActual?'selected':''}>${esc(p)}</option>`).join('')}</select>
        <button class="btn btn-sm btn-primary" onclick="crearPaginaScrapbook()">+ Página</button>
      </div>
      <div class="field" style="margin-top:8px"><label>Textura del papel</label>
        <div class="row" style="gap:6px">${Object.entries(PAPELES_SCRAPBOOK).map(([id,p])=>`<div onclick="cambiarPapelScrapbook('${id}')" style="width:34px;height:34px;border-radius:8px;background:${p.bg};cursor:pointer;border:2px solid ${((cfg&&cfg.papel)||'kraft')===id?'#333':'rgba(0,0,0,.15)'}"></div>`).join('')}</div>
      </div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorScrap('foto')">📷 Foto</button>
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorScrap('dibujo')">🎨 Dibujo</button>
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorScrap('postal')">💌 Postal</button>
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorScrap('carta')">✉️ Carta</button>
        <button class="btn btn-sm btn-primary" onclick="agregarNotaScrap()">📝 Nota</button>
        <button class="btn btn-sm btn-primary" onclick="agregarStickerScrap()">✨ Sticker</button>
        <button class="btn btn-sm btn-primary" onclick="agregarDecoScrap('washi')">🎀 Washi tape</button>
        <button class="btn btn-sm btn-primary" onclick="agregarDecoScrap('flor')">🌸 Flor</button>
      </div>
    </div>
    <div id="scrapTablero" style="position:relative;width:100%;height:520px;background:${papel.bg};border-radius:12px;overflow:hidden;touch-action:none;box-shadow:0 8px 24px rgba(0,0,0,.15);border:1px solid rgba(0,0,0,.08)">
      ${(itemsPag||[]).map(itemScrapbookPaginaHTML).join('')}
    </div>
    <p class="small muted" style="text-align:center;margin-top:8px">Mantén presionado y arrastra. Doble toque para traer al frente.</p>
  `;
  document.querySelectorAll('#scrapVistaTabs button').forEach(b=>b.onclick=()=>{ scrapVista=b.dataset.v; renderRecuerdos(); });
  document.getElementById('scrapPaginaSel').onchange = (e)=>{ scrapPaginaActual = e.target.value; renderRecuerdos(); };
  inicializarDragScrap();
}
function itemScrapbookPaginaHTML(it){
  let contenido;
  if(it.tipo==='nota') contenido = `<div style="background:#fff8d6;padding:8px;border-radius:4px;box-shadow:0 4px 8px rgba(0,0,0,.15);width:120px;font-size:12px;white-space:pre-wrap">${esc(it.texto||'')}</div>`;
  else if(it.tipo==='sticker') contenido = `<div style="font-size:30px">${esc(it.texto||'✨')}</div>`;
  else if(it.tipo==='washi') contenido = `<div style="width:70px;height:20px;background:repeating-linear-gradient(45deg,#eeb1cd,#eeb1cd 6px,#f0dba0 6px,#f0dba0 12px);border-radius:2px;opacity:.9"></div>`;
  else if(it.tipo==='flor') contenido = `<div style="font-size:26px">🌸</div>`;
  else if(it.tipo==='carta') contenido = `<div style="background:linear-gradient(160deg,#fff,#fdf2f6);padding:10px;border-radius:6px;box-shadow:0 4px 8px rgba(0,0,0,.15);width:100px;text-align:center;font-size:18px">💌<div class="small" style="font-size:10px">${esc((it.texto||'').slice(0,30))}</div></div>`;
  else contenido = it.img_url ? `<img src="${it.img_url}" style="width:110px;border-radius:4px;box-shadow:0 4px 8px rgba(0,0,0,.2);display:block">` : '';
  return `<div class="scrap-item" data-id="${it.id}" style="position:absolute;left:${it.pos_x}%;top:${it.pos_y}%;transform:translate(-50%,-50%) rotate(${it.rotacion}deg);z-index:${it.z_index};cursor:grab">
    ${contenido}
    <span onclick="event.stopPropagation();quitarScrapbook('${it.id}')" style="position:absolute;top:-8px;right:-8px;background:#fff;border-radius:50%;width:20px;height:20px;text-align:center;font-size:11px;box-shadow:0 2px 5px rgba(0,0,0,.2);cursor:pointer">✕</span>
  </div>`;
}
async function crearPaginaScrapbook(){
  const nombre = prompt('Nombre de la nueva página', 'Página '+(Math.floor(Math.random()*900)+2));
  if(!nombre) return;
  scrapPaginaActual = nombre.trim();
  renderRecuerdos();
}
async function cambiarPapelScrapbook(id){
  await sb.from('scrapbook_paginas_config').upsert({couple_id:SESSION.coupleId, pagina:scrapPaginaActual, papel:id}, {onConflict:'couple_id,pagina'});
  renderRecuerdos();
}
async function agregarNotaScrap(){
  const texto = prompt('Escribe la nota');
  if(!texto||!texto.trim()) return;
  await sb.from('scrapbook').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'nota', texto:texto.trim(), pagina:scrapPaginaActual, pos_x:30+Math.random()*40, pos_y:30+Math.random()*40, rotacion:(Math.random()*10-5)});
  renderRecuerdos();
}
async function agregarStickerScrap(){
  const emoji = prompt('Escribe un emoji o palabra para el sticker', '✨');
  if(!emoji) return;
  await sb.from('scrapbook').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'sticker', texto:emoji, pagina:scrapPaginaActual, pos_x:30+Math.random()*40, pos_y:30+Math.random()*40, rotacion:(Math.random()*20-10)});
  renderRecuerdos();
}
async function agregarDecoScrap(tipo){
  await sb.from('scrapbook').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, pagina:scrapPaginaActual, pos_x:20+Math.random()*60, pos_y:20+Math.random()*60, rotacion:(Math.random()*16-8)});
  renderRecuerdos();
}
async function abrirSelectorScrap(tipo){
  let query;
  if(tipo==='foto') query = sb.from('album').select('id,img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','foto').order('created_at',{ascending:false}).limit(24);
  else if(tipo==='dibujo') query = sb.from('album').select('id,img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','dibujo').order('created_at',{ascending:false}).limit(24);
  else if(tipo==='postal') query = sb.from('album').select('id,img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','tarjeta_romantica').order('created_at',{ascending:false}).limit(24);
  else if(tipo==='carta') query = sb.from('cartas').select('id,titulo,cuerpo').eq('couple_id',SESSION.coupleId).order('created_at',{ascending:false}).limit(24);
  const { data } = await query;
  const overlay = document.createElement('div');
  overlay.id = 'scrapSelectorOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(30,20,30,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;padding:18px;position:relative">
      <button onclick="document.getElementById('scrapSelectorOverlay').remove()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <h3>Elige qué pegar</h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
        ${(data&&data.length) ? data.map(d=>`
          <div onclick="agregarAlScrapPagina('${tipo}','${d.id}')" style="cursor:pointer;width:90px">
            ${d.img_url ? `<img src="${d.img_url}" style="width:90px;height:90px;object-fit:cover;border-radius:8px">` : `<div style="width:90px;height:90px;border-radius:8px;background:linear-gradient(135deg,var(--rosa),var(--lila));display:flex;align-items:center;justify-content:center;font-size:22px">💌</div>`}
          </div>`).join('') : `<div class="empty small">Aún no tienen nada de este tipo.</div>`}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
async function agregarAlScrapPagina(tipo, referenciaId){
  let img_url = null, texto = '';
  if(tipo==='carta'){
    const { data } = await sb.from('cartas').select('titulo,cuerpo').eq('id', referenciaId).maybeSingle();
    texto = (data&&(data.titulo||data.cuerpo))||'';
  } else {
    const { data } = await sb.from('album').select('img_url,texto').eq('id', referenciaId).maybeSingle();
    img_url = data&&data.img_url; texto = (data&&data.texto)||'';
  }
  await sb.from('scrapbook').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, img_url, texto, pagina:scrapPaginaActual, pos_x:30+Math.random()*40, pos_y:30+Math.random()*40, rotacion:(Math.random()*14-7)});
  document.getElementById('scrapSelectorOverlay').remove();
  renderRecuerdos();
}
let scrapArrastrando = null, scrapZmax = 10;
function inicializarDragScrap(){
  const tablero = document.getElementById('scrapTablero');
  if(!tablero) return;
  const items = tablero.querySelectorAll('.scrap-item');
  items.forEach(el=>{ scrapZmax = Math.max(scrapZmax, Number(el.style.zIndex)||1); });
  const posDesdeEvento = (e)=>{ const r=tablero.getBoundingClientRect(); const p = e.touches?e.touches[0]:e; return { x:(p.clientX-r.left)/r.width*100, y:(p.clientY-r.top)/r.height*100 }; };
  items.forEach(el=>{
    const onStart = ()=>{ scrapArrastrando = el; el.style.cursor='grabbing'; };
    const onEnd = async ()=>{
      if(!scrapArrastrando) return;
      scrapArrastrando = null; el.style.cursor='grab';
      const left = parseFloat(el.style.left); const top = parseFloat(el.style.top);
      await sb.from('scrapbook').update({pos_x:Math.max(3,Math.min(97,left)), pos_y:Math.max(3,Math.min(97,top))}).eq('id', el.dataset.id);
    };
    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, {passive:true});
    window.addEventListener('mouseup', onEnd);
    el.addEventListener('touchend', onEnd);
    el.addEventListener('dblclick', async ()=>{ scrapZmax++; el.style.zIndex = scrapZmax; await sb.from('scrapbook').update({z_index:scrapZmax}).eq('id', el.dataset.id); });
  });
  const onMove = (e)=>{
    if(!scrapArrastrando) return;
    e.preventDefault();
    const pos = posDesdeEvento(e);
    scrapArrastrando.style.left = pos.x+'%';
    scrapArrastrando.style.top = pos.y+'%';
  };
  tablero.addEventListener('mousemove', onMove);
  tablero.addEventListener('touchmove', onMove, {passive:false});
}
