/* ================= MULTIMEDIA (Cápsulas de voz · Video de recuerdos) ================= */
let multimediaSub = 'capsulas';
async function renderMultimedia(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs" id="multimediaSubtabs">
      <button data-r="capsulas" class="${multimediaSub==='capsulas'?'active':''}">🎙️ Cápsulas de voz</button>
      <button data-r="video" class="${multimediaSub==='video'?'active':''}">🎥 Video de recuerdos</button>
      <button data-r="historias" class="${multimediaSub==='historias'?'active':''}">🎞️ Historias</button>
    </div>
    <div id="multimediaBody"></div>`;
  document.querySelectorAll('#multimediaSubtabs button').forEach(b=>b.onclick=()=>{ multimediaSub=b.dataset.r; renderMultimedia(); });
  const body = document.getElementById('multimediaBody');
  if(multimediaSub==='capsulas') return renderCapsulasVoz(body);
  if(multimediaSub==='historias') return renderHistorias(body);
  return renderVideoRecuerdos(body);
}

/* ---------- Cápsulas de voz (mensajes futuros, cumpleaños, aniversario, sorpresa) ---------- */
const CAPSULA_CATS = [['sorpresa','🎀 Sorpresa'],['futuro','⏳ Mensaje futuro'],['cumpleanos','🎂 Cumpleaños'],['aniversario','💍 Aniversario']];
let grabadora = null, audioChunksCapsula = [], audioBlobCapsula = null;
async function renderCapsulasVoz(body){
  const { data } = await sb.from('caja_sorpresa').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  const items = data||[];
  const hoy = new Date();
  body.innerHTML = `
    <div class="card">
      <h2>🎙️ Cápsulas de voz</h2>
      <p class="muted small">Graba o escribe un mensaje que se desbloqueará en la fecha que elijas.</p>
      <div class="cat-chip-row" style="overflow-x:auto">${CAPSULA_CATS.map(([v,l])=>`<button class="cat-chip" onclick="document.getElementById('capCat').value='${v}'">${l}</button>`).join('')}</div>
      <div class="field"><label>Categoría</label><select id="capCat">${CAPSULA_CATS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
      <div class="field"><label>Título</label><input id="capTitulo" placeholder="Un mensaje para ti..."></div>
      <div class="field"><label>Mensaje escrito (opcional)</label><textarea id="capMensaje" rows="3"></textarea></div>
      <div class="field">
        <label>Mensaje de voz (opcional)</label>
        <div class="row" style="gap:8px">
          <button class="btn btn-sm" id="btnGrabar" onclick="toggleGrabacionCapsula()">🎙️ Grabar</button>
          <span id="capAudioPreview" class="small muted">Sin grabación</span>
        </div>
      </div>
      <div class="field"><label>Fecha de desbloqueo</label><input type="date" id="capFecha"></div>
      <button class="btn btn-primary btn-block" id="btnCrearCapsula" onclick="crearCapsulaVoz()">Crear cápsula 🎙️</button>
    </div>
    <div class="section-title">Sus cápsulas</div>
    ${items.length? items.map(c=>{
      const bloqueada = c.fecha_desbloqueo && new Date(c.fecha_desbloqueo) > hoy;
      const catLabel = (CAPSULA_CATS.find(x=>x[0]===c.categoria)||['','🎀'])[1];
      if(bloqueada){
        const dias = Math.ceil((new Date(c.fecha_desbloqueo)-hoy)/86400000);
        return `<div class="card locked"><b>🔒 ${catLabel} · ${esc(c.titulo)}</b><div class="small muted">Se desbloquea en ${dias} día${dias!==1?'s':''}</div></div>`;
      }
      if(!c.abierta){
        return `<div class="card"><b>${catLabel} ${esc(c.titulo)}</b><div class="small muted">De ${c.autor_id===SESSION.user?.id?'ti':'tu pareja'} · lista para abrir</div><button class="btn btn-sm btn-gold" style="margin-top:8px" onclick="abrirCapsulaVoz('${c.id}')">Abrir</button></div>`;
      }
      return `<div class="card"><b>${catLabel} ${esc(c.titulo)}</b>${c.mensaje?`<p style="white-space:pre-wrap;margin-top:6px">${esc(c.mensaje)}</p>`:''}${c.audio_url?`<audio src="${c.audio_url}" controls style="width:100%;margin-top:8px"></audio>`:''}${c.foto_url?`<img src="${c.foto_url}" style="width:100%;border-radius:12px;margin-top:8px">`:''}</div>`;
    }).join('') : '<div class="empty small">Aún no hay cápsulas de voz.</div>'}
  `;
}
async function toggleGrabacionCapsula(){
  const btn = document.getElementById('btnGrabar');
  const prev = document.getElementById('capAudioPreview');
  if(!navigator.mediaDevices || !window.MediaRecorder){ toast('Tu navegador no soporta grabación de audio'); return; }
  if(grabadora && grabadora.state==='recording'){
    grabadora.stop();
    return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    audioChunksCapsula = [];
    grabadora = new MediaRecorder(stream);
    grabadora.ondataavailable = e=> audioChunksCapsula.push(e.data);
    grabadora.onstop = ()=>{
      audioBlobCapsula = new Blob(audioChunksCapsula, {type:'audio/webm'});
      prev.innerHTML = `✅ Grabación lista (${Math.round(audioBlobCapsula.size/1024)} KB)`;
      btn.innerHTML = '🎙️ Grabar de nuevo';
      stream.getTracks().forEach(t=>t.stop());
    };
    grabadora.start();
    btn.innerHTML = '<span class="rec-dot"></span>Detener';
    prev.textContent = 'Grabando...';
  }catch(e){ console.error(e); toast('No se pudo acceder al micrófono'); }
}
async function crearCapsulaVoz(){
  const titulo = document.getElementById('capTitulo').value.trim();
  const mensaje = document.getElementById('capMensaje').value.trim();
  const categoria = document.getElementById('capCat').value;
  const fecha_desbloqueo = document.getElementById('capFecha').value || null;
  if(!titulo){ toast('Escribe un título'); return; }
  const btn = document.getElementById('btnCrearCapsula'); btn.innerHTML='<span class="spinner"></span>'; btn.disabled=true;
  let audio_url = null;
  if(audioBlobCapsula){
    audio_url = await subirBlobDirecto(audioBlobCapsula, 'capsulas', 'voz', 'webm', 'audio/webm');
  }
  const { error } = await sb.from('caja_sorpresa').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user?.id||null, titulo, mensaje, audio_url, categoria, fecha_desbloqueo});
  if(error){ console.error(error); toast('No se pudo crear la cápsula'); btn.disabled=false; return; }
  audioBlobCapsula = null;
  toast('Cápsula de voz creada 🎙️'); renderMultimedia();
}
async function abrirCapsulaVoz(id){ await sb.from('caja_sorpresa').update({abierta:true}).eq('id', id); renderMultimedia(); }

/* ---------- Video de recuerdos (slideshow mensual / anual / de aniversario) ---------- */
let videoRango = 'mes';
let slideshowState = { idx:0, timer:null, fotos:[] };
async function renderVideoRecuerdos(body){
  const { data } = await sb.from('album').select('*').eq('couple_id', SESSION.coupleId).in('tipo',['foto']).order('created_at',{ascending:true});
  const todas = data||[];
  const now = new Date();
  let fotos = [];
  if(videoRango==='mes'){
    fotos = todas.filter(a=>{ const d=new Date(a.created_at); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); });
  } else if(videoRango==='anio'){
    fotos = todas.filter(a=>{ const d=new Date(a.created_at); return d.getFullYear()===now.getFullYear(); });
  } else {
    fotos = todas.filter(a=>a.favorito);
  }
  body.innerHTML = `
    <div class="card">
      <h2>🎥 Video de recuerdos</h2>
      <p class="muted small">Un slideshow automático con sus fotos, ideal para revivir el mes, el año o sus momentos favoritos (de aniversario).</p>
      <div class="subtabs" id="videoRangoTabs">
        <button data-v="mes" class="${videoRango==='mes'?'active':''}">📅 Este mes</button>
        <button data-v="anio" class="${videoRango==='anio'?'active':''}">🗓️ Este año</button>
        <button data-v="favoritos" class="${videoRango==='favoritos'?'active':''}">💗 Aniversario / favoritos</button>
      </div>
    </div>
    ${fotos.length? `
      <div class="slideshow-frame" id="slideshowFrame">
        <img id="slideshowImg" src="${fotos[0].img_url}">
      </div>
      <div class="row" style="justify-content:center;gap:10px;margin-top:12px">
        <button class="btn btn-sm" onclick="slideshowAnterior()">⏮️</button>
        <button class="btn btn-sm btn-gold" id="btnPlaySlideshow" onclick="toggleSlideshow()">▶️ Reproducir</button>
        <button class="btn btn-sm" onclick="slideshowSiguiente()">⏭️</button>
        <button class="btn btn-sm" onclick="compartirSlideshow()">📤 Compartir</button>
      </div>
      <p class="small muted" style="text-align:center;margin-top:6px">${fotos.length} foto${fotos.length!==1?'s':''} en este video de recuerdos</p>
    ` : '<div class="empty small">No hay fotos suficientes para este período todavía.</div>'}
  `;
  document.querySelectorAll('#videoRangoTabs button').forEach(b=>b.onclick=()=>{ detenerSlideshow(); videoRango=b.dataset.v; renderVideoRecuerdos(body); });
  slideshowState = { idx:0, timer:null, fotos };
}
function detenerSlideshow(){
  if(slideshowState.timer){ clearInterval(slideshowState.timer); slideshowState.timer=null; }
  const btn = document.getElementById('btnPlaySlideshow'); if(btn) btn.innerHTML='▶️ Reproducir';
}
function mostrarSlide(i){
  const img = document.getElementById('slideshowImg');
  if(!img || !slideshowState.fotos.length) return;
  slideshowState.idx = ((i % slideshowState.fotos.length) + slideshowState.fotos.length) % slideshowState.fotos.length;
  img.src = slideshowState.fotos[slideshowState.idx].img_url;
}
function slideshowSiguiente(){ mostrarSlide(slideshowState.idx+1); }
function slideshowAnterior(){ mostrarSlide(slideshowState.idx-1); }
function toggleSlideshow(){
  const btn = document.getElementById('btnPlaySlideshow');
  if(slideshowState.timer){ detenerSlideshow(); return; }
  slideshowState.timer = setInterval(()=> mostrarSlide(slideshowState.idx+1), 2200);
  btn.innerHTML = '⏸️ Pausar';
}
async function compartirSlideshow(){
  const foto = slideshowState.fotos[slideshowState.idx];
  if(!foto) return;
  if(navigator.share){
    try{ await navigator.share({title:'Nuestro video de recuerdos', text:'Un recuerdo de Notre petit monde 💗', url: foto.img_url}); }catch(e){}
  } else {
    window.open(foto.img_url, '_blank');
  }
}

/* ---------- Historias privadas (tipo Instagram, temporales 24h) ---------- */
let historiasFiltro = 'activas';
async function renderHistorias(body){
  const ahora = new Date().toISOString();
  let query = sb.from('historias').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  if(historiasFiltro==='activas') query = query.gt('expira_en', ahora);
  else if(historiasFiltro==='destacadas') query = query.eq('destacada', true);
  const { data } = await query;
  const items = data||[];
  body.innerHTML = `
    <div class="card">
      <h2>🎞️ Historias privadas</h2>
      <p class="muted small">Comparte fotos, videos, texto o música. Se archivan solas después de 24 horas, a menos que las destaquen.</p>
      <div class="field"><label>Tipo</label>
        <select id="histTipo" onchange="cambiarTipoHistoria()">
          <option value="texto">📝 Texto</option>
          <option value="foto">📷 Foto</option>
          <option value="video">🎬 Video</option>
          <option value="musica">🎵 Música (enlace)</option>
        </select>
      </div>
      <div id="histCampoExtra"></div>
      <div class="field"><label>Texto / descripción</label><textarea id="histTexto" rows="2" placeholder="¿Qué está pasando?"></textarea></div>
      <button class="btn btn-gold btn-block" id="btnPublicarHistoria" onclick="publicarHistoria()">Publicar historia</button>
    </div>
    <div class="subtabs" id="historiasFiltros">
      <button data-f="activas" class="${historiasFiltro==='activas'?'active':''}">🕐 Activas (24h)</button>
      <button data-f="destacadas" class="${historiasFiltro==='destacadas'?'active':''}">⭐ Destacadas</button>
      <button data-f="todas" class="${historiasFiltro==='todas'?'active':''}">🗂️ Archivo</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px">
      ${items.length? items.map(h=>`
        <div class="card" style="width:130px;cursor:pointer;text-align:center" onclick="verHistoria('${h.id}')">
          ${h.tipo==='foto'&&h.img_url? `<img src="${h.img_url}" style="width:100%;height:100px;object-fit:cover;border-radius:10px">` :
            h.tipo==='video'&&h.img_url? `<video src="${h.img_url}" style="width:100%;height:100px;object-fit:cover;border-radius:10px"></video>` :
            `<div style="width:100%;height:100px;border-radius:10px;background:linear-gradient(135deg,var(--rosa),var(--lila));display:flex;align-items:center;justify-content:center;font-size:26px">${h.tipo==='musica'?'🎵':'📝'}</div>`}
          <div class="small" style="margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.contenido||'Historia')}</div>
          ${h.destacada?'<div class="small">⭐</div>':''}
        </div>`).join('') : '<div class="empty small">No hay historias en esta vista.</div>'}
    </div>
  `;
  document.querySelectorAll('#historiasFiltros button').forEach(b=>b.onclick=()=>{ historiasFiltro=b.dataset.f; renderHistorias(body); });
  cambiarTipoHistoria();
}
function cambiarTipoHistoria(){
  const tipo = document.getElementById('histTipo')?.value || 'texto';
  const extra = document.getElementById('histCampoExtra');
  if(!extra) return;
  if(tipo==='foto') extra.innerHTML = `<div class="field"><label>Foto</label><input type="file" accept="image/*" id="histArchivo"></div>`;
  else if(tipo==='video') extra.innerHTML = `<div class="field"><label>Video</label><input type="file" accept="video/*" id="histArchivo"></div>`;
  else if(tipo==='musica') extra.innerHTML = `<div class="field"><label>Enlace de la canción</label><input id="histUrl" placeholder="https://open.spotify.com/..."></div>`;
  else extra.innerHTML = '';
}
async function publicarHistoria(){
  const tipo = document.getElementById('histTipo').value;
  const contenido = document.getElementById('histTexto').value.trim();
  const btn = document.getElementById('btnPublicarHistoria');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  let img_url = null;
  try{
    if((tipo==='foto'||tipo==='video')){
      const fileEl = document.getElementById('histArchivo');
      const file = fileEl && fileEl.files[0];
      if(file){
        const dataUrl = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
        img_url = tipo==='foto' ? await subirImagen(dataUrl, 'historias', 'foto') : await subirBlobDirecto(file, 'historias', 'video', file.name.split('.').pop()||'mp4', file.type);
      }
    } else if(tipo==='musica'){
      img_url = document.getElementById('histUrl').value.trim() || null;
    }
    await sb.from('historias').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, contenido, img_url});
    toast('Historia publicada 🎞️');
    renderMultimedia();
  }catch(e){ console.error(e); toast('No se pudo publicar la historia'); btn.disabled=false; btn.innerHTML='Publicar historia'; }
}
async function verHistoria(id){
  const [{data:h},{data:reacciones}] = await Promise.all([
    sb.from('historias').select('*').eq('id', id).maybeSingle(),
    sb.from('historias_reacciones').select('*').eq('historia_id', id),
  ]);
  if(!h) return;
  const EMOJIS = ['❤️','😂','😮','😢','👏','🔥'];
  const overlay = document.createElement('div');
  overlay.id = 'historiaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(20,10,20,.9);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:420px;width:100%;max-height:92vh;overflow-y:auto;padding:16px;position:relative">
      <button onclick="document.getElementById('historiaOverlay').remove()" style="position:absolute;top:10px;right:10px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px;z-index:2">✕</button>
      ${h.tipo==='foto'&&h.img_url? `<img src="${h.img_url}" style="width:100%;border-radius:14px">` :
        h.tipo==='video'&&h.img_url? `<video src="${h.img_url}" controls style="width:100%;border-radius:14px"></video>` :
        h.tipo==='musica'? `<div style="padding:30px;text-align:center;background:linear-gradient(135deg,var(--rosa),var(--lila));border-radius:14px"><div style="font-size:40px">🎵</div>${h.img_url?`<a href="${esc(h.img_url)}" target="_blank" class="small">Escuchar canción</a>`:''}</div>` :
        `<div style="padding:30px;text-align:center;background:linear-gradient(135deg,var(--rosa),var(--lila));border-radius:14px;font-family:'Cormorant Garamond',serif;font-size:20px">📝</div>`}
      ${h.contenido?`<p style="margin-top:12px;white-space:pre-wrap">${esc(h.contenido)}</p>`:''}
      <div class="small muted" style="margin-top:6px">${new Date(h.created_at).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
      <div class="cat-chip-row" style="margin-top:10px">${EMOJIS.map(e=>`<button class="cat-chip" onclick="reaccionarHistoria('${id}','${e}')">${e} ${(reacciones||[]).filter(r=>r.emoji===e).length||''}</button>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:10px">
        ${h.autor_id===SESSION.user.id ? `
          <button class="btn btn-sm ${h.destacada?'btn-gold':''}" onclick="toggleDestacarHistoria('${id}', ${!h.destacada})">${h.destacada?'⭐ Destacada':'☆ Destacar'}</button>
          <button class="btn btn-sm" onclick="borrarHistoria('${id}')">🗑️ Eliminar</button>
        ` : `<span class="small muted">🔒 Solo quien la publicó puede destacarla o borrarla</span>`}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
async function reaccionarHistoria(historiaId, emoji){
  await sb.from('historias_reacciones').insert({historia_id:historiaId, autor_id:SESSION.user.id, emoji});
  toast(emoji+' enviado'); document.getElementById('historiaOverlay').remove(); verHistoria(historiaId);
}
async function toggleDestacarHistoria(id, destacada){ await sb.from('historias').update({destacada}).eq('id', id); document.getElementById('historiaOverlay').remove(); renderMultimedia(); }
async function borrarHistoria(id){ await sb.from('historias').delete().eq('id', id); document.getElementById('historiaOverlay').remove(); renderMultimedia(); }
