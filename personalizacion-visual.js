/* ================= 📸 CÁMARA INTEGRADA ================= */
const CAMARA_FILTROS = [
  {id:'ninguno', label:'Normal', css:''},
  {id:'sepia', label:'Sepia', css:'sepia(.6)'},
  {id:'bn', label:'Blanco y negro', css:'grayscale(1)'},
  {id:'calido', label:'Cálido', css:'saturate(1.4) hue-rotate(-8deg) brightness(1.05)'},
  {id:'frio', label:'Frío', css:'saturate(1.1) hue-rotate(10deg) brightness(.98)'},
  {id:'vintage', label:'Vintage', css:'sepia(.3) contrast(1.1) brightness(.95)'},
];
const CAMARA_MARCOS = [
  {id:'ninguno', label:'Sin marco'},
  {id:'polaroid', label:'Polaroid'},
  {id:'corazon', label:'Bordes de corazón'},
  {id:'dorado', label:'Marco dorado'},
];
let camaraStream = null, camaraFiltroActivo = 'ninguno', camaraMarcoActivo = 'ninguno', camaraFotoTomada = null;

async function abrirCamara(){
  const overlay = document.createElement('div');
  overlay.id = 'camaraOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:130;background:#000;display:flex;flex-direction:column;';
  overlay.innerHTML = `
    <div style="position:relative;flex:1;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#000">
      <video id="camaraVideo" autoplay playsinline style="width:100%;height:100%;object-fit:cover;filter:none"></video>
      <canvas id="camaraCanvas" style="display:none"></canvas>
      <img id="camaraPreview" style="display:none;width:100%;height:100%;object-fit:contain">
      <div id="camaraCuentaRegresiva" style="position:absolute;font-size:80px;color:#fff;display:none;text-shadow:0 0 20px rgba(0,0,0,.6)"></div>
      <button onclick="cerrarCamara()" style="position:absolute;top:14px;right:14px;border:none;background:rgba(255,255,255,.2);color:#fff;width:36px;height:36px;border-radius:50%;font-size:18px">✕</button>
      <div id="camaraFechaUbicacion" style="position:absolute;bottom:12px;left:12px;color:#fff;font-family:'Cormorant Garamond',serif;font-size:14px;text-shadow:0 1px 4px rgba(0,0,0,.6)"></div>
    </div>
    <div style="background:#111;padding:14px;color:#fff">
      <div id="camaraControlesVivo">
        <div class="cat-chip-row" style="overflow-x:auto">${CAMARA_FILTROS.map(f=>`<button class="cat-chip ${camaraFiltroActivo===f.id?'active':''}" onclick="elegirFiltroCamara('${f.id}')">${f.label}</button>`).join('')}</div>
        <div class="field" style="margin-top:6px"><input id="camaraUbicacionTxt" placeholder="Ubicación (opcional, escrita a mano)" style="width:100%;color:#333"></div>
        <div class="row" style="justify-content:center;gap:14px;margin-top:10px">
          <button class="btn btn-sm" onclick="tomarFotoConTemporizador(3)">⏱️ 3s</button>
          <button class="btn btn-gold" style="width:64px;height:64px;border-radius:50%;font-size:26px" onclick="tomarFotoCamara()">📸</button>
          <button class="btn btn-sm" onclick="voltearCamara()">🔄</button>
        </div>
      </div>
      <div id="camaraControlesPreview" style="display:none">
        <div class="cat-chip-row" style="overflow-x:auto">${CAMARA_MARCOS.map(m=>`<button class="cat-chip ${camaraMarcoActivo===m.id?'active':''}" onclick="elegirMarcoCamara('${m.id}')">${m.label}</button>`).join('')}</div>
        <div class="row" style="justify-content:center;gap:10px;margin-top:10px">
          <button class="btn btn-sm btn-outline" onclick="repetirFotoCamara()">↩️ Repetir</button>
          <button class="btn btn-gold" onclick="guardarFotoCamara()">💾 Guardar en el álbum</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  actualizarFechaUbicacionCamara();
  try{
    camaraStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
    document.getElementById('camaraVideo').srcObject = camaraStream;
  }catch(e){
    console.error(e);
    toast('No se pudo acceder a la cámara. Revisa los permisos.');
    cerrarCamara();
  }
}
function actualizarFechaUbicacionCamara(){
  const el = document.getElementById('camaraFechaUbicacion');
  if(!el) return;
  const fecha = new Date().toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
  const ubic = document.getElementById('camaraUbicacionTxt')?.value || '';
  el.textContent = ubic ? `${fecha} · ${ubic}` : fecha;
}
function elegirFiltroCamara(id){
  camaraFiltroActivo = id;
  const f = CAMARA_FILTROS.find(x=>x.id===id);
  document.getElementById('camaraVideo').style.filter = f.css;
  document.querySelectorAll('#camaraControlesVivo .cat-chip').forEach(b=>b.classList.remove('active'));
  const idx = CAMARA_FILTROS.findIndex(x=>x.id===id);
  document.querySelectorAll('#camaraControlesVivo .cat-chip')[idx]?.classList.add('active');
}
async function voltearCamara(){
  if(!camaraStream) return;
  const track = camaraStream.getVideoTracks()[0];
  const modoActual = track.getSettings().facingMode;
  camaraStream.getTracks().forEach(t=>t.stop());
  try{
    camaraStream = await navigator.mediaDevices.getUserMedia({video:{facingMode: modoActual==='environment'?'user':'environment'}, audio:false});
    document.getElementById('camaraVideo').srcObject = camaraStream;
  }catch(e){ toast('No se pudo cambiar de cámara'); }
}
async function tomarFotoConTemporizador(segundos){
  const el = document.getElementById('camaraCuentaRegresiva');
  el.style.display = 'block';
  for(let s=segundos; s>0; s--){
    el.textContent = s;
    await new Promise(r=>setTimeout(r, 1000));
  }
  el.style.display = 'none';
  tomarFotoCamara();
}
function tomarFotoCamara(){
  const video = document.getElementById('camaraVideo');
  const canvas = document.getElementById('camaraCanvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  const f = CAMARA_FILTROS.find(x=>x.id===camaraFiltroActivo);
  ctx.filter = f.css || 'none';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  actualizarFechaUbicacionCamara();
  const textoFechaUbic = document.getElementById('camaraFechaUbicacion').textContent;
  ctx.filter = 'none';
  ctx.font = Math.round(canvas.width*0.025)+'px Georgia';
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
  ctx.fillText(textoFechaUbic, 20, canvas.height-20);
  camaraFotoTomada = canvas.toDataURL('image/jpeg', 0.92);
  document.getElementById('camaraPreview').src = camaraFotoTomada;
  document.getElementById('camaraPreview').style.display = 'block';
  document.getElementById('camaraVideo').style.display = 'none';
  document.getElementById('camaraControlesVivo').style.display = 'none';
  document.getElementById('camaraControlesPreview').style.display = 'block';
}
function elegirMarcoCamara(id){
  camaraMarcoActivo = id;
  document.querySelectorAll('#camaraControlesPreview .cat-chip').forEach(b=>b.classList.remove('active'));
  const idx = CAMARA_MARCOS.findIndex(x=>x.id===id);
  document.querySelectorAll('#camaraControlesPreview .cat-chip')[idx]?.classList.add('active');
  const preview = document.getElementById('camaraPreview');
  const bordes = {ninguno:'none', polaroid:'18px solid #fff', corazon:'6px solid #e97ea6', dorado:'10px solid #e0b45f'};
  preview.style.border = bordes[id] || 'none';
  preview.style.borderRadius = id==='corazon' ? '50% / 40%' : (id==='polaroid'?'2px':'8px');
}
function repetirFotoCamara(){
  camaraFotoTomada = null;
  document.getElementById('camaraPreview').style.display = 'none';
  document.getElementById('camaraVideo').style.display = 'block';
  document.getElementById('camaraControlesVivo').style.display = 'block';
  document.getElementById('camaraControlesPreview').style.display = 'none';
}
async function guardarFotoCamara(){
  if(!camaraFotoTomada) return;
  const img_url = await subirImagen(camaraFotoTomada, 'album', 'foto');
  await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'foto', img_url, texto:document.getElementById('camaraUbicacionTxt')?.value||''});
  toast('Foto guardada en el álbum 📸');
  cerrarCamara();
  if(typeof renderAlbum==='function' && activeTab==='album') renderAlbum();
}
function cerrarCamara(){
  if(camaraStream){ camaraStream.getTracks().forEach(t=>t.stop()); camaraStream = null; }
  const o = document.getElementById('camaraOverlay'); if(o) o.remove();
  camaraFotoTomada = null; camaraFiltroActivo = 'ninguno'; camaraMarcoActivo = 'ninguno';
}
