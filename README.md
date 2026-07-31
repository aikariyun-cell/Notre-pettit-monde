/* ================= 🎞️ PELÍCULA DE LA RELACIÓN ================= */
let peliculaEscenas = [];
let peliculaIdx = 0;
let peliculaTimer = null;
let peliculaAudioEl = null;

async function renderPelicula(){
  const main = document.getElementById('main');
  const { data: pistas } = await sb.from('musica_playlist').select('*').eq('couple_id',SESSION.coupleId).order('favorita',{ascending:false});
  main.innerHTML = `
    <div class="card">
      <h2>🎞️ Película de la relación</h2>
      <p class="muted small">Sin inteligencia artificial: simplemente unimos sus fotos, videos, cartas y dibujos favoritos en una secuencia, con música de fondo si quieren.</p>
      <div class="field"><label>Incluir</label>
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <label class="row" style="gap:6px"><input type="checkbox" id="pelFotos" checked> Fotos favoritas</label>
          <label class="row" style="gap:6px"><input type="checkbox" id="pelVideos" checked> Videos</label>
          <label class="row" style="gap:6px"><input type="checkbox" id="pelCartas" checked> Cartas importantes</label>
          <label class="row" style="gap:6px"><input type="checkbox" id="pelDibujos" checked> Dibujos</label>
        </div>
      </div>
      <div class="field"><label>Música de fondo (opcional)</label>
        <select id="pelMusica">
          <option value="">Sin música</option>
          ${(pistas||[]).filter(p=>p.url).map(p=>`<option value="${esc(p.url)}">${esc(p.titulo||'Pista')}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-gold btn-block" onclick="prepararPelicula()">🎬 Preparar película</button>
    </div>
    <div id="peliculaContenedor"></div>
  `;
}
async function prepararPelicula(){
  const incluirFotos = document.getElementById('pelFotos').checked;
  const incluirVideos = document.getElementById('pelVideos').checked;
  const incluirCartas = document.getElementById('pelCartas').checked;
  const incluirDibujos = document.getElementById('pelDibujos').checked;
  const musicaUrl = document.getElementById('pelMusica').value;

  const escenas = [{tipo:'titulo', texto:'Nuestra historia'}];
  if(incluirFotos){
    const { data } = await sb.from('album').select('img_url,texto,created_at').eq('couple_id',SESSION.coupleId).eq('tipo','foto').eq('favorito', true).eq('eliminado', false).order('created_at');
    (data||[]).forEach(f=> escenas.push({tipo:'foto', img:f.img_url, texto:f.texto}));
  }
  if(incluirVideos){
    const { data } = await sb.from('album').select('img_url,texto').eq('couple_id',SESSION.coupleId).eq('tipo','video').eq('eliminado', false).limit(10);
    (data||[]).forEach(v=> escenas.push({tipo:'video', video:v.img_url, texto:v.texto}));
  }
  if(incluirCartas){
    const { data } = await sb.from('cartas').select('titulo,cuerpo').eq('couple_id',SESSION.coupleId).eq('importante', true).eq('eliminada', false).limit(10);
    (data||[]).forEach(c=> escenas.push({tipo:'carta', texto:c.titulo, cuerpo:c.cuerpo}));
  }
  if(incluirDibujos){
    const { data } = await sb.from('album').select('img_url').eq('couple_id',SESSION.coupleId).eq('tipo','dibujo').eq('eliminado', false).limit(10);
    (data||[]).forEach(d=> escenas.push({tipo:'foto', img:d.img_url}));
  }
  escenas.push({tipo:'titulo', texto:'Fin ✨ Continuará...'});
  peliculaEscenas = escenas;
  peliculaIdx = 0;
  if(musicaUrl){ peliculaAudioEl = new Audio(musicaUrl); peliculaAudioEl.loop = true; }
  dibujarPelicula();
}
function dibujarPelicula(){
  const cont = document.getElementById('peliculaContenedor');
  if(!cont || !peliculaEscenas.length) return;
  cont.innerHTML = `
    <div class="slideshow-frame" id="peliculaPantalla" style="aspect-ratio:9/12"></div>
    <div class="row" style="justify-content:center;gap:10px;margin-top:12px">
      <button class="btn btn-sm" onclick="peliculaAnterior()">⏮️</button>
      <button class="btn btn-sm btn-gold" id="btnPlayPelicula" onclick="togglePelicula()">▶️ Reproducir</button>
      <button class="btn btn-sm" onclick="peliculaSiguiente()">⏭️</button>
    </div>
    <p class="small muted" style="text-align:center;margin-top:6px">Escena <span id="peliculaContador">1</span> de ${peliculaEscenas.length}</p>
  `;
  mostrarEscenaPelicula(0);
}
function mostrarEscenaPelicula(i){
  peliculaIdx = ((i%peliculaEscenas.length)+peliculaEscenas.length)%peliculaEscenas.length;
  const escena = peliculaEscenas[peliculaIdx];
  const pantalla = document.getElementById('peliculaPantalla');
  const contador = document.getElementById('peliculaContador');
  if(contador) contador.textContent = peliculaIdx+1;
  if(!pantalla) return;
  if(escena.tipo==='titulo'){
    pantalla.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2c2a4a,#5b4b8a);color:#fff;text-align:center;padding:20px;font-family:'Cormorant Garamond',serif;font-size:26px">${esc(escena.texto)}</div>`;
  } else if(escena.tipo==='foto'){
    pantalla.innerHTML = `<img src="${escena.img}" style="width:100%;height:100%;object-fit:cover">${escena.texto?`<div style="position:absolute;bottom:0;background:rgba(0,0,0,.5);color:#fff;width:100%;padding:8px;font-size:13px">${esc(escena.texto)}</div>`:''}`;
  } else if(escena.tipo==='video'){
    pantalla.innerHTML = `<video src="${escena.video}" autoplay muted loop style="width:100%;height:100%;object-fit:cover"></video>`;
  } else if(escena.tipo==='carta'){
    pantalla.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(160deg,#fff,#fdf2f6);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center"><div style="font-size:36px">💌</div><b style="margin-top:10px">${esc(escena.texto||'')}</b><p class="small" style="margin-top:8px;white-space:pre-wrap">${esc((escena.cuerpo||'').slice(0,200))}</p></div>`;
  }
}
function peliculaSiguiente(){ mostrarEscenaPelicula(peliculaIdx+1); }
function peliculaAnterior(){ mostrarEscenaPelicula(peliculaIdx-1); }
function togglePelicula(){
  const btn = document.getElementById('btnPlayPelicula');
  if(peliculaTimer){
    clearInterval(peliculaTimer); peliculaTimer=null; btn.innerHTML='▶️ Reproducir';
    if(peliculaAudioEl) peliculaAudioEl.pause();
    return;
  }
  peliculaTimer = setInterval(()=> mostrarEscenaPelicula(peliculaIdx+1), 3200);
  btn.innerHTML = '⏸️ Pausar';
  if(peliculaAudioEl) peliculaAudioEl.play().catch(()=>{});
}
