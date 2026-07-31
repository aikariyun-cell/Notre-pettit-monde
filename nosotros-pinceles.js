/* ================= 🌸 NUESTRO UNIVERSO (visualización) ================= */
function hashPos(id){
  let h = 0;
  for(let i=0;i<id.length;i++){ h = (h*31 + id.charCodeAt(i)) & 0xffffffff; }
  const x = Math.abs(h % 9000)/100 + 4;
  const y = Math.abs((h>>3) % 8000)/100 + 6;
  return { x: Math.min(94,x), y: Math.min(88,y) };
}
async function renderUniverso(){
  const main = document.getElementById('main');
  main.innerHTML = `<div class="card"><h2>🌌 Cargando su universo...</h2></div>`;
  const [{data:recuerdos}, {data:hitos}, {data:cartas}, {data:pareja}, {data:album}] = await Promise.all([
    sb.from('banco_recuerdos').select('id,texto,favorito').eq('couple_id',SESSION.coupleId),
    sb.from('calendario').select('id,titulo,fecha,tipo').eq('couple_id',SESSION.coupleId).eq('tipo','hito'),
    sb.from('cartas').select('id,titulo').eq('couple_id',SESSION.coupleId),
    sb.from('pareja').select('metas').eq('couple_id',SESSION.coupleId).maybeSingle(),
    sb.from('album').select('id,img_url,tipo').eq('couple_id',SESSION.coupleId).in('tipo',['dibujo','tarjeta_romantica']).eq('eliminado', false).limit(30),
  ]);
  const estrellas = (recuerdos||[]).map(r=>({...r, brillo: r.favorito?1:0.6}));
  const metasCumplidas = ((pareja&&pareja.metas)||[]).filter(m=>m.hecho);

  const elementos = [];
  estrellas.forEach(e=> elementos.push({tipo:'estrella', id:e.id, texto:e.texto, brillo:e.brillo}));
  (hitos||[]).forEach(h=> elementos.push({tipo:'luna', id:h.id, texto:h.titulo, fecha:h.fecha}));
  (cartas||[]).forEach(c=> elementos.push({tipo:'constelacion', id:c.id, texto:c.titulo||'Una carta'}));
  metasCumplidas.forEach((m,i)=> elementos.push({tipo:'estrella_meta', id:'meta'+i, texto:m.texto||m.titulo||'Meta cumplida'}));
  (album||[]).forEach(a=> elementos.push({tipo:'planeta', id:a.id, img:a.img_url}));

  main.innerHTML = `
    <div class="card" style="text-align:center">
      <h2>🌌 Nuestro Universo</h2>
      <p class="small muted">Cada recuerdo importante es una estrella. Cada aniversario, una luna. Sus cartas son constelaciones. Toca cualquier cosa para verla.</p>
    </div>
    <div id="universoCielo" style="position:relative;width:100%;height:520px;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at 50% 0%, #2a2550, #0f0c24 70%);">
      ${elementos.length ? elementos.map(el=>elementoUniversoHTML(el)).join('') : ''}
      ${!elementos.length ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#c9b7e6;text-align:center;padding:20px">Su universo aún está naciendo... agreguen recuerdos, cartas y fechas para verlo crecer ✨</div>' : ''}
    </div>
    <p class="small muted" style="text-align:center;margin-top:8px">⭐ ${estrellas.length} recuerdos · 🌙 ${(hitos||[]).length} fechas · 🌌 ${(cartas||[]).length} cartas · ✨ ${metasCumplidas.length} metas · 💌 ${(album||[]).length} dibujos y postales</p>
  `;
}
function elementoUniversoHTML(el){
  const pos = hashPos(String(el.id)+el.tipo);
  if(el.tipo==='estrella'){
    return `<div onclick='verElementoUniverso(${JSON.stringify(el).replace(/'/g,"&apos;")})' style="position:absolute;left:${pos.x}%;top:${pos.y}%;cursor:pointer;font-size:${10+el.brillo*8}px;animation:twinkle ${2+Math.random()*3}s ease-in-out infinite;filter:drop-shadow(0 0 4px #fff8d6)">⭐</div>`;
  }
  if(el.tipo==='estrella_meta'){
    return `<div onclick='verElementoUniverso(${JSON.stringify(el).replace(/'/g,"&apos;")})' style="position:absolute;left:${pos.x}%;top:${pos.y}%;cursor:pointer;font-size:16px;animation:twinkle 2.5s ease-in-out infinite;filter:drop-shadow(0 0 6px #ffe28a)">✨</div>`;
  }
  if(el.tipo==='luna'){
    return `<div onclick='verElementoUniverso(${JSON.stringify(el).replace(/'/g,"&apos;")})' style="position:absolute;left:${pos.x}%;top:${pos.y}%;cursor:pointer;font-size:22px;filter:drop-shadow(0 0 8px #e6d9ff)">🌙</div>`;
  }
  if(el.tipo==='constelacion'){
    const p2 = hashPos(String(el.id)+'b'); const p3 = hashPos(String(el.id)+'c');
    const dx1=(p2.x-pos.x), dy1=(p2.y-pos.y), dx2=(p3.x-p2.x), dy2=(p3.y-p2.y);
    return `<div onclick='verElementoUniverso(${JSON.stringify(el).replace(/'/g,"&apos;")})' style="position:absolute;left:${pos.x}%;top:${pos.y}%;cursor:pointer;width:1px;height:1px">
      <svg width="120" height="80" style="overflow:visible;position:absolute">
        <line x1="0" y1="0" x2="${dx1*4}" y2="${dy1*4}" stroke="#9b8ad6" stroke-width="1" opacity=".6"/>
        <line x1="${dx1*4}" y1="${dy1*4}" x2="${(dx1+dx2)*4}" y2="${(dy1+dy2)*4}" stroke="#9b8ad6" stroke-width="1" opacity=".6"/>
      </svg>
      <span style="position:absolute;font-size:10px">💌</span>
      <span style="position:absolute;left:${dx1*4}px;top:${dy1*4}px;font-size:6px">✦</span>
      <span style="position:absolute;left:${(dx1+dx2)*4}px;top:${(dy1+dy2)*4}px;font-size:6px">✦</span>
    </div>`;
  }
  if(el.tipo==='planeta'){
    return `<div onclick='verElementoUniverso(${JSON.stringify(el).replace(/'/g,"&apos;")})' style="position:absolute;left:${pos.x}%;top:${pos.y}%;cursor:pointer;width:26px;height:26px;border-radius:50%;overflow:hidden;box-shadow:0 0 10px rgba(200,180,255,.6);border:1px solid rgba(255,255,255,.3)">
      <img src="${el.img}" style="width:100%;height:100%;object-fit:cover">
    </div>`;
  }
  return '';
}
function verElementoUniverso(el){
  const overlay = document.createElement('div');
  overlay.id = 'universoDetalleOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(10,8,20,.85);display:flex;align-items:center;justify-content:center;padding:20px;';
  let contenido = '';
  if(el.tipo==='estrella' || el.tipo==='estrella_meta') contenido = `<div style="font-size:40px;text-align:center">${el.tipo==='estrella_meta'?'✨':'⭐'}</div><p style="text-align:center;margin-top:10px">${esc(el.texto||'')}</p>`;
  else if(el.tipo==='luna') contenido = `<div style="font-size:40px;text-align:center">🌙</div><p style="text-align:center;margin-top:10px"><b>${esc(el.texto||'')}</b><br>${el.fecha?new Date(el.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):''}</p>`;
  else if(el.tipo==='constelacion') contenido = `<div style="font-size:40px;text-align:center">💌</div><p style="text-align:center;margin-top:10px">${esc(el.texto||'')}</p><button class="btn btn-sm btn-block" style="margin-top:10px" onclick="document.getElementById('universoDetalleOverlay').remove();switchTab('cartas')">Ver en Cartas</button>`;
  else if(el.tipo==='planeta') contenido = `<img src="${el.img}" style="width:100%;border-radius:14px">`;
  overlay.innerHTML = `<div style="background:var(--crema);border-radius:22px;max-width:340px;width:100%;padding:20px;position:relative">
    <button onclick="document.getElementById('universoDetalleOverlay').remove()" style="position:absolute;top:10px;right:10px;border:none;background:rgba(0,0,0,.08);width:30px;height:30px;border-radius:50%">✕</button>
    ${contenido}
  </div>`;
  document.body.appendChild(overlay);
}
