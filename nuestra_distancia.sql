/* ================= MURO DE MOMENTOS (tablero libre) ================= */
async function renderMuro(){
  const main = document.getElementById('main');
  const { data } = await sb.from('muro_momentos').select('*').eq('couple_id', SESSION.coupleId).order('z_index',{ascending:true});
  const items = data||[];
  main.innerHTML = `
    <div class="card">
      <h2>💕 Muro de momentos</h2>
      <p class="muted small">Arrastra fotos, cartas, dibujos, postales y notas y acomódenlas como quieran.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorMuro('foto')">📷 Foto</button>
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorMuro('dibujo')">🎨 Dibujo</button>
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorMuro('postal')">💌 Postal</button>
        <button class="btn btn-sm btn-gold" onclick="abrirSelectorMuro('carta')">✉️ Carta</button>
        <button class="btn btn-sm btn-primary" onclick="agregarNotaMuro()">🗒️ Nota libre</button>
      </div>
    </div>
    <div id="muroTablero" style="position:relative;width:100%;height:560px;background:repeating-linear-gradient(45deg,var(--superficie),var(--superficie) 20px,var(--fondo) 20px,var(--fondo) 40px);border-radius:18px;overflow:hidden;touch-action:none;border:1px solid var(--linea)">
      ${items.map(m=>itemMuroHTML(m)).join('')}
    </div>
    <p class="small muted" style="text-align:center;margin-top:8px">Mantén presionado y arrastra para mover. Doble toque para traer al frente.</p>
  `;
  inicializarDragMuro();
}
function itemMuroHTML(m){
  const contenido = m.tipo==='nota'
    ? `<div style="background:#fff8d6;padding:10px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,.15);width:140px;font-size:13px;white-space:pre-wrap">${esc(m.texto||'')}</div>`
    : m.tipo==='carta'
    ? `<div style="background:linear-gradient(160deg,#fff,#fdf2f6);padding:12px;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,.15);width:120px;text-align:center;font-size:22px">💌<div class="small" style="font-size:11px;margin-top:4px">${esc((m.texto||'').slice(0,40))}</div></div>`
    : m.img_url
    ? `<img src="${m.img_url}" style="width:130px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,.2);display:block">`
    : `<div style="width:120px;height:80px;background:linear-gradient(135deg,var(--rosa),var(--lila));border-radius:6px"></div>`;
  return `<div class="muro-item" data-id="${m.id}" style="position:absolute;left:${m.pos_x}%;top:${m.pos_y}%;transform:translate(-50%,-50%) rotate(${m.rotacion}deg);z-index:${m.z_index};cursor:grab">
    ${contenido}
    ${m.autor_id===SESSION.user.id ? `<span onclick="event.stopPropagation();quitarDelMuro('${m.id}')" style="position:absolute;top:-8px;right:-8px;background:#fff;border-radius:50%;width:22px;height:22px;text-align:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer">✕</span>` : ''}
  </div>`;
}
async function agregarNotaMuro(){
  const texto = prompt('¿Qué quieres escribir en la nota?');
  if(!texto || !texto.trim()) return;
  await sb.from('muro_momentos').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'nota', texto:texto.trim(), pos_x:30+Math.random()*40, pos_y:30+Math.random()*40, rotacion:(Math.random()*10-5)});
  toast('Nota añadida al muro 🗒️'); renderMuro();
}
async function abrirSelectorMuro(tipo){
  let query;
  if(tipo==='foto') query = sb.from('album').select('id,img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','foto').order('created_at',{ascending:false}).limit(24);
  else if(tipo==='dibujo') query = sb.from('album').select('id,img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','dibujo').order('created_at',{ascending:false}).limit(24);
  else if(tipo==='postal') query = sb.from('album').select('id,img_url,texto,plantilla').eq('couple_id',SESSION.coupleId).eq('tipo','tarjeta_romantica').order('created_at',{ascending:false}).limit(24);
  else if(tipo==='carta') query = sb.from('cartas').select('id,titulo,cuerpo').eq('couple_id',SESSION.coupleId).order('created_at',{ascending:false}).limit(24);
  const { data } = await query;
  const overlay = document.createElement('div');
  overlay.id = 'muroSelectorOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(30,20,30,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;padding:18px;position:relative">
      <button onclick="document.getElementById('muroSelectorOverlay').remove()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <h3>Elige qué añadir al muro</h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
        ${(data&&data.length) ? data.map(d=>`
          <div onclick="agregarAlMuro('${tipo}','${d.id}')" style="cursor:pointer;width:90px">
            ${d.img_url ? `<img src="${d.img_url}" style="width:90px;height:90px;object-fit:cover;border-radius:8px">` : `<div style="width:90px;height:90px;border-radius:8px;background:linear-gradient(135deg,var(--rosa),var(--lila));display:flex;align-items:center;justify-content:center;font-size:22px">💌</div>`}
            <div class="small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.texto||d.titulo||'')}</div>
          </div>`).join('') : `<div class="empty small">Aún no tienen nada de este tipo.</div>`}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
async function agregarAlMuro(tipo, referenciaId){
  let img_url = null, texto = '';
  if(tipo==='carta'){
    const { data } = await sb.from('cartas').select('titulo,cuerpo').eq('id', referenciaId).maybeSingle();
    texto = (data&&(data.titulo||data.cuerpo))||'';
  } else {
    const { data } = await sb.from('album').select('img_url,texto').eq('id', referenciaId).maybeSingle();
    img_url = data&&data.img_url; texto = (data&&data.texto)||'';
  }
  await sb.from('muro_momentos').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, referencia_id:referenciaId, img_url, texto, pos_x:30+Math.random()*40, pos_y:30+Math.random()*40, rotacion:(Math.random()*14-7)});
  document.getElementById('muroSelectorOverlay').remove();
  toast('Añadido al muro 💕'); renderMuro();
}
async function quitarDelMuro(id){ await sb.from('muro_momentos').delete().eq('id', id); renderMuro(); }

let muroArrastrando = null, muroZmax = 10;
function inicializarDragMuro(){
  const tablero = document.getElementById('muroTablero');
  if(!tablero) return;
  const items = tablero.querySelectorAll('.muro-item');
  items.forEach(el=>{ muroZmax = Math.max(muroZmax, Number(el.style.zIndex)||1); });

  const posDesdeEvento = (e)=>{ const r=tablero.getBoundingClientRect(); const p = e.touches?e.touches[0]:e; return { x:(p.clientX-r.left)/r.width*100, y:(p.clientY-r.top)/r.height*100 }; };

  items.forEach(el=>{
    let dobleTap = false;
    const onStart = (e)=>{ muroArrastrando = el; el.style.cursor='grabbing'; };
    const onEnd = async ()=>{
      if(!muroArrastrando) return;
      muroArrastrando = null; el.style.cursor='grab';
      const id = el.dataset.id;
      const left = parseFloat(el.style.left); const top = parseFloat(el.style.top);
      await sb.from('muro_momentos').update({pos_x:Math.max(5,Math.min(95,left)), pos_y:Math.max(5,Math.min(95,top))}).eq('id', id);
    };
    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, {passive:true});
    window.addEventListener('mouseup', onEnd);
    el.addEventListener('touchend', onEnd);
    el.addEventListener('dblclick', async ()=>{
      muroZmax++; el.style.zIndex = muroZmax;
      await sb.from('muro_momentos').update({z_index:muroZmax}).eq('id', el.dataset.id);
    });
  });
  const onMove = (e)=>{
    if(!muroArrastrando) return;
    e.preventDefault();
    const pos = posDesdeEvento(e);
    muroArrastrando.style.left = pos.x+'%';
    muroArrastrando.style.top = pos.y+'%';
  };
  tablero.addEventListener('mousemove', onMove);
  tablero.addEventListener('touchmove', onMove, {passive:false});
}
