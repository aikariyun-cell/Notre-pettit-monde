/* ================= 🎨 CONSTRUCTOR DE POSTALES AVANZADO ================= */
const POSTAL_FONDOS = [
  {id:'rosa', bg:'linear-gradient(135deg,#ffe4ef,#ffd0e0)'},
  {id:'lila', bg:'linear-gradient(135deg,#e6d8fb,#d4bdf5)'},
  {id:'dorado', bg:'linear-gradient(135deg,#fff2d6,#ffe2a0)'},
  {id:'menta', bg:'linear-gradient(135deg,#dcf3e6,#c8e8d6)'},
  {id:'noche', bg:'linear-gradient(135deg,#2c2a4a,#5b4b8a)'},
  {id:'atardecer', bg:'linear-gradient(135deg,#ffb37b,#ff7bac)'},
];
const POSTAL_STICKERS_DISPONIBLES = ['💗','🌸','✨','🎀','🕊️','🌙','🌷','💫','🍯','🦋','☁️','🔥'];
let postalCapas = [];
let postalFondoActivo = POSTAL_FONDOS[0];
let postalCapaSeleccionada = null;

async function renderConstructorPostales(){
  const main = document.getElementById('main');
  postalCapas = [];
  postalFondoActivo = POSTAL_FONDOS[0];
  main.innerHTML = `
    <div class="card">
      <h2>🎨 Constructor de postales</h2>
      <p class="muted small">Fondo, texto y pegatinas en capas. Arrastra cada elemento donde quieras.</p>
      <div class="field"><label>Fondo</label>
        <div class="row" style="gap:6px;flex-wrap:wrap">${POSTAL_FONDOS.map(f=>`<div onclick="elegirFondoPostal('${f.id}')" style="width:36px;height:36px;border-radius:8px;background:${f.bg};cursor:pointer;border:2px solid ${postalFondoActivo.id===f.id?'#333':'rgba(0,0,0,.15)'}"></div>`).join('')}</div>
      </div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="agregarCapaTexto()">🔤 Añadir texto</button>
        <button class="btn btn-sm btn-primary" onclick="abrirSelectorStickerPostal()">✨ Añadir pegatina</button>
        ${postalCapaSeleccionada!==null ? `<button class="btn btn-sm btn-outline" onclick="quitarCapaSeleccionada()">🗑️ Quitar seleccionado</button>` : ''}
      </div>
    </div>
    <div id="postalLienzo" style="position:relative;width:100%;aspect-ratio:3/4;border-radius:16px;overflow:hidden;background:${postalFondoActivo.bg};touch-action:none;box-shadow:0 8px 20px rgba(0,0,0,.2)"></div>
    <button class="btn btn-gold btn-block" style="margin-top:12px" onclick="guardarPostalAvanzada()">💾 Guardar en el álbum</button>
  `;
  dibujarCapasPostal();
}
function elegirFondoPostal(id){
  postalFondoActivo = POSTAL_FONDOS.find(f=>f.id===id);
  document.getElementById('postalLienzo').style.background = postalFondoActivo.bg;
}
function agregarCapaTexto(){
  const texto = prompt('Escribe el texto de la postal', '💗');
  if(!texto) return;
  postalCapas.push({id:'c'+Date.now(), tipo:'texto', texto, x:50, y:50, tam:22, color: postalFondoActivo.id==='noche'?'#fff':'#4a3550'});
  dibujarCapasPostal();
}
async function abrirSelectorStickerPostal(){
  const overlay = document.createElement('div');
  overlay.id = 'postalStickerOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:130;background:rgba(30,20,30,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:340px;width:100%;padding:20px;position:relative">
      <button onclick="document.getElementById('postalStickerOverlay').remove()" style="position:absolute;top:10px;right:10px;border:none;background:rgba(0,0,0,.08);width:30px;height:30px;border-radius:50%">✕</button>
      <h3>Elige una pegatina</h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-size:28px">
        ${POSTAL_STICKERS_DISPONIBLES.map(s=>`<span onclick="agregarCapaSticker('${s}')" style="cursor:pointer">${s}</span>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
function agregarCapaSticker(emoji){
  postalCapas.push({id:'c'+Date.now(), tipo:'sticker', texto:emoji, x:50+Math.random()*10-5, y:50+Math.random()*10-5, tam:34});
  document.getElementById('postalStickerOverlay')?.remove();
  dibujarCapasPostal();
}
function quitarCapaSeleccionada(){
  postalCapas = postalCapas.filter(c=>c.id!==postalCapaSeleccionada);
  postalCapaSeleccionada = null;
  dibujarCapasPostal();
}
function dibujarCapasPostal(){
  const lienzo = document.getElementById('postalLienzo');
  if(!lienzo) return;
  lienzo.innerHTML = postalCapas.map(c=>`
    <div class="postal-capa" data-id="${c.id}" style="position:absolute;left:${c.x}%;top:${c.y}%;transform:translate(-50%,-50%);cursor:grab;${postalCapaSeleccionada===c.id?'outline:2px dashed #333':''};${c.tipo==='texto'?`font-family:'Cormorant Garamond',serif;font-size:${c.tam}px;color:${c.color};text-align:center;max-width:80%`:`font-size:${c.tam}px`}">${esc(c.texto)}</div>
  `).join('');
  inicializarDragPostal();
}
let postalArrastrando = null;
function inicializarDragPostal(){
  const lienzo = document.getElementById('postalLienzo');
  if(!lienzo) return;
  const posDesdeEvento = (e)=>{ const r=lienzo.getBoundingClientRect(); const p = e.touches?e.touches[0]:e; return { x:(p.clientX-r.left)/r.width*100, y:(p.clientY-r.top)/r.height*100 }; };
  lienzo.querySelectorAll('.postal-capa').forEach(el=>{
    const onStart = (e)=>{ postalArrastrando = el; postalCapaSeleccionada = el.dataset.id; el.style.cursor='grabbing'; dibujarCapasPostal(); };
    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, {passive:true});
  });
  const onMove = (e)=>{
    if(!postalArrastrando) return;
    e.preventDefault();
    const pos = posDesdeEvento(e);
    postalArrastrando.style.left = pos.x+'%';
    postalArrastrando.style.top = pos.y+'%';
    const capa = postalCapas.find(c=>c.id===postalArrastrando.dataset.id);
    if(capa){ capa.x = pos.x; capa.y = pos.y; }
  };
  const onEnd = ()=>{ postalArrastrando = null; };
  lienzo.addEventListener('mousemove', onMove);
  lienzo.addEventListener('touchmove', onMove, {passive:false});
  window.addEventListener('mouseup', onEnd);
  lienzo.addEventListener('touchend', onEnd);
}
async function guardarPostalAvanzada(){
  const ANCHO = 720, ALTO = 960;
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO; canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  const gradColores = {
    rosa:['#ffe4ef','#ffd0e0'], lila:['#e6d8fb','#d4bdf5'], dorado:['#fff2d6','#ffe2a0'],
    menta:['#dcf3e6','#c8e8d6'], noche:['#2c2a4a','#5b4b8a'], atardecer:['#ffb37b','#ff7bac'],
  };
  const [c1,c2] = gradColores[postalFondoActivo.id] || gradColores.rosa;
  const grad = ctx.createLinearGradient(0,0,ANCHO,ALTO);
  grad.addColorStop(0,c1); grad.addColorStop(1,c2);
  ctx.fillStyle = grad; ctx.fillRect(0,0,ANCHO,ALTO);
  postalCapas.forEach(c=>{
    const px = (c.x/100)*ANCHO, py = (c.y/100)*ALTO;
    if(c.tipo==='texto'){
      ctx.font = `${c.tam*2}px Georgia`;
      ctx.fillStyle = c.color;
      ctx.textAlign = 'center';
      ctx.fillText(c.texto, px, py, ANCHO*0.85);
    } else {
      ctx.font = `${c.tam*2}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(c.texto, px, py);
    }
  });
  const dataUrl = canvas.toDataURL('image/png');
  const img_url = await subirImagen(dataUrl, 'album', 'postal');
  await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'tarjeta_romantica', img_url, texto:'Postal creada con el constructor avanzado'});
  toast('Postal guardada en el álbum 💌');
  switchTab('album');
}
