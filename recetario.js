/* ================= DECISIONES + RULETA + PERFIL DE LA RELACIÓN + CAJA DE REGALOS ================= */
let paseSub = 'decisiones';
async function renderPareja(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs" id="parejaSubtabs">
      <button data-r="decisiones" class="${paseSub==='decisiones'?'active':''}">❤️ Decisiones</button>
      <button data-r="ruleta" class="${paseSub==='ruleta'?'active':''}">🎡 Ruleta</button>
      <button data-r="perfil" class="${paseSub==='perfil'?'active':''}">🌟 Perfil</button>
    </div>
    <div id="parejaBody"></div>`;
  document.querySelectorAll('#parejaSubtabs button').forEach(b=>b.onclick=()=>{ paseSub=b.dataset.r; renderPareja(); });
  const body = document.getElementById('parejaBody');
  if(paseSub==='ruleta') return renderRuleta(body);
  if(paseSub==='perfil') return renderPerfilRelacion(body);
  return renderDecisiones(body);
}

/* ---------- Decisiones (sorteo) ---------- */
const DECISIONES_CATS = [
  {id:'restaurante', label:'🍽️ Restaurante'},
  {id:'pelicula', label:'🎬 Película'},
  {id:'serie', label:'📺 Serie'},
  {id:'juego', label:'🎮 Juego'},
  {id:'actividad', label:'🎯 Actividad'},
  {id:'comida', label:'🍕 Comida'},
];
async function renderDecisiones(body){
  body.innerHTML = `
    <div class="card">
      <h2>❤️ Decisiones</h2>
      <p class="muted small">¿No saben qué elegir? Escriban las opciones y dejen que la app decida.</p>
      <div class="cat-chip-row" style="overflow-x:auto">${DECISIONES_CATS.map(c=>`<button class="cat-chip" onclick="document.getElementById('decisionTitulo').value='${c.label.split(' ').slice(1).join(' ')}'">${c.label}</button>`).join('')}</div>
      <div class="field"><label>¿Qué van a decidir?</label><input id="decisionTitulo" placeholder="Restaurante, película..."></div>
      <div class="field"><label>Opciones (una por línea)</label><textarea id="decisionOpciones" rows="5" placeholder="Opción 1&#10;Opción 2&#10;Opción 3"></textarea></div>
      <button class="btn btn-gold btn-block" onclick="sortearDecision()">🎲 Decidir por nosotros</button>
    </div>
    <div id="decisionResultado"></div>
  `;
}
function sortearDecision(){
  const titulo = document.getElementById('decisionTitulo').value.trim() || 'Su decisión';
  const opciones = document.getElementById('decisionOpciones').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(opciones.length<2){ toast('Escribe al menos 2 opciones'); return; }
  const cont = document.getElementById('decisionResultado');
  cont.innerHTML = `<div class="card" style="text-align:center"><div id="decisionAnim" style="font-size:22px;font-weight:700;padding:20px">🎲 Decidiendo...</div></div>`;
  let i = 0;
  const anim = document.getElementById('decisionAnim');
  const interval = setInterval(()=>{
    anim.textContent = opciones[Math.floor(Math.random()*opciones.length)];
    i++;
    if(i>18){
      clearInterval(interval);
      const ganadora = opciones[Math.floor(Math.random()*opciones.length)];
      cont.innerHTML = `<div class="hero" style="text-align:center"><p class="small muted">${esc(titulo)}</p><h2 style="margin-top:6px">🎉 ${esc(ganadora)}</h2></div>`;
    }
  }, 90);
}

/* ---------- Ruleta personalizada ---------- */
let ruletaOpcionesActuales = [];
async function renderRuleta(body){
  const { data: guardadas } = await sb.from('ruletas').select('*').eq('couple_id',SESSION.coupleId).order('created_at',{ascending:false});
  body.innerHTML = `
    <div class="card">
      <h2>🎡 Ruleta</h2>
      <p class="muted small">Ej: "¿Qué cenamos?", "¿Qué película vemos?"</p>
      <div class="field"><label>Título de la ruleta</label><input id="ruletaTitulo" placeholder="¿Qué hacemos hoy?"></div>
      <div class="field"><label>Opciones (una por línea)</label><textarea id="ruletaOpcionesTxt" rows="5" placeholder="Opción 1&#10;Opción 2&#10;Opción 3"></textarea></div>
      <div class="row" style="gap:8px">
        <button class="btn btn-sm btn-primary" onclick="prepararRuleta()">Preparar ruleta</button>
        <button class="btn btn-sm btn-outline" onclick="guardarRuletaPreset()">💾 Guardar</button>
      </div>
    </div>
    ${guardadas&&guardadas.length ? `<div class="section-title">Ruletas guardadas</div>${guardadas.map(r=>`
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <span onclick="cargarRuletaPreset('${r.id}')" style="cursor:pointer;flex:1"><b>${esc(r.titulo)}</b><div class="small muted">${(r.opciones||[]).length} opciones</div></span>
        <span class="tag-del" onclick="borrarRuletaPreset('${r.id}')">✕</span>
      </div>`).join('')}` : ''}
    <div id="ruletaContenedor"></div>
  `;
}
function prepararRuleta(){
  ruletaOpcionesActuales = document.getElementById('ruletaOpcionesTxt').value.split('\n').map(s=>s.trim()).filter(Boolean);
  dibujarRuleta();
}
async function cargarRuletaPreset(id){
  const { data } = await sb.from('ruletas').select('*').eq('id', id).maybeSingle();
  if(!data) return;
  document.getElementById('ruletaTitulo').value = data.titulo;
  document.getElementById('ruletaOpcionesTxt').value = (data.opciones||[]).join('\n');
  ruletaOpcionesActuales = data.opciones||[];
  dibujarRuleta();
}
async function guardarRuletaPreset(){
  const titulo = document.getElementById('ruletaTitulo').value.trim();
  const opciones = document.getElementById('ruletaOpcionesTxt').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!titulo || opciones.length<2){ toast('Ponle título y al menos 2 opciones'); return; }
  await sb.from('ruletas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, opciones});
  toast('Ruleta guardada 🎡'); renderPareja();
}
async function borrarRuletaPreset(id){ await sb.from('ruletas').delete().eq('id', id); renderPareja(); }
function dibujarRuleta(){
  const cont = document.getElementById('ruletaContenedor');
  if(!cont) return;
  if(ruletaOpcionesActuales.length<2){ cont.innerHTML = '<div class="empty small">Agrega al menos 2 opciones.</div>'; return; }
  const colores = ['#eeb1cd','#c9a6f0','#f0c98a','#8fbfb0','#e8a0b4','#a6c9f0'];
  const n = ruletaOpcionesActuales.length;
  const slice = 360/n;
  const gradient = ruletaOpcionesActuales.map((_,i)=>`${colores[i%colores.length]} ${i*slice}deg ${(i+1)*slice}deg`).join(',');
  cont.innerHTML = `
    <div class="card" style="text-align:center">
      <div style="position:relative;width:240px;height:240px;margin:0 auto">
        <div id="ruletaDisco" style="width:240px;height:240px;border-radius:50%;background:conic-gradient(${gradient});transition:transform 4s cubic-bezier(.17,.67,.16,.99);border:6px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.2)"></div>
        <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:28px">🔻</div>
      </div>
      <button class="btn btn-gold" style="margin-top:16px" onclick="girarRuletaDecision()">Girar 🎡</button>
      <div id="ruletaResultado" style="margin-top:12px;font-size:20px;font-weight:700"></div>
    </div>`;
}
function girarRuletaDecision(){
  const disco = document.getElementById('ruletaDisco');
  const n = ruletaOpcionesActuales.length;
  const slice = 360/n;
  const idxGanador = Math.floor(Math.random()*n);
  const vueltas = 5*360;
  const anguloFinal = vueltas + (360 - (idxGanador*slice + slice/2));
  disco.style.transform = `rotate(${anguloFinal}deg)`;
  document.getElementById('ruletaResultado').textContent = '';
  setTimeout(()=>{
    document.getElementById('ruletaResultado').textContent = '🎉 ' + ruletaOpcionesActuales[idxGanador];
  }, 4100);
}

/* ---------- Perfil de la relación (compartido) ---------- */
async function renderPerfilRelacion(body){
  const p = await getPareja();
  body.innerHTML = `
    <div class="hero" style="text-align:center">
      ${p.foto_principal?`<img src="${p.foto_principal}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;border:3px solid #fff">`:''}
      <h2>${esc(p.nombre_pareja || 'Su pareja')}</h2>
      <p class="small muted" style="white-space:pre-wrap">${esc(p.biografia||'Aún no han escrito su biografía.')}</p>
    </div>
    <div class="card">
      <div class="field"><label>Nombre de la pareja</label><input id="prNombre" value="${esc(p.nombre_pareja||'')}" placeholder="Ej. Los Fernández, Marco & Ana..."></div>
      <div class="field"><label>Biografía</label><textarea id="prBio" rows="3" placeholder="Cuéntenle al mundo quiénes son...">${esc(p.biografia||'')}</textarea></div>
      <div class="field"><label>Foto principal</label><input type="file" accept="image/*" id="prFoto"></div>
      <div class="field"><label>Color favorito de la pareja</label><input type="color" id="prColor" value="${p.color_favorito||'#e97ea6'}" style="height:38px"></div>
      <button class="btn btn-gold btn-block" onclick="guardarPerfilRelacion()">Guardar perfil</button>
    </div>
    <div class="card">
      <div class="grid2">
        <div><div class="small muted">Fecha de inicio</div><b>${p.inicio?new Date(p.inicio+'T00:00:00').toLocaleDateString('es-ES'):'—'}</b></div>
        <div><div class="small muted">Canción de la pareja</div><b>${esc(p.cancion||'—')}</b></div>
      </div>
      <div style="margin-top:10px"><div class="small muted">Metas actuales</div>
        ${(p.metas||[]).filter(m=>!m.hecho).slice(0,5).map(m=>`<div class="small" style="padding:2px 0">☐ ${esc(m.texto||m.titulo||'')}</div>`).join('') || '<div class="small muted">Sin metas pendientes.</div>'}
      </div>
    </div>
  `;
}
async function guardarPerfilRelacion(){
  const nombre_pareja = document.getElementById('prNombre').value.trim();
  const biografia = document.getElementById('prBio').value.trim();
  const color_favorito = document.getElementById('prColor').value;
  const fotoEl = document.getElementById('prFoto');
  const campos = { nombre_pareja, biografia, color_favorito };
  if(fotoEl.files[0]){
    const dataUrl = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(fotoEl.files[0]); });
    campos.foto_principal = await subirImagen(dataUrl, 'pareja', 'perfil');
  }
  await saveParejaCampos(campos);
  toast('Perfil de la relación actualizado 🌟');
  renderPareja();
}

/* ---------- Caja de regalos (ahora accesible desde Regalos) ---------- */
function refrescarCajaRegalos(){
  if(typeof activeTab!=='undefined' && activeTab==='regalos' && typeof renderRegalos==='function') return renderRegalos();
  if(typeof renderPareja==='function') return renderPareja();
}
async function renderCajaRegalos(body){
  const { data } = await sb.from('caja_regalos').select('*').eq('couple_id',SESSION.coupleId).order('fecha',{ascending:false});
  const items = data||[];
  body.innerHTML = `
    <div class="card">
      <h2>🎁 Caja de regalos</h2>
      <div class="field"><label>Título</label><input id="regTitulo" placeholder="Perfume, un libro, un viaje..."></div>
      <div class="grid2">
        <div class="field"><label>Dirección</label><select id="regDireccion"><option value="dado">Yo lo di</option><option value="recibido">Lo recibí</option></select></div>
        <div class="field"><label>Fecha</label><input type="date" id="regFecha"></div>
      </div>
      <div class="field"><label>Valor sentimental</label><input type="range" min="1" max="5" id="regValor" value="3"></div>
      <div class="field"><label>Notas</label><textarea id="regNotas" rows="2"></textarea></div>
      <div class="field"><label>Foto (opcional)</label><input type="file" accept="image/*" id="regFoto"></div>
      <button class="btn btn-gold btn-block" onclick="agregarRegaloCaja()">Guardar</button>
    </div>
    ${items.length ? items.map(r=>`
      <div class="card">
        <div style="display:flex;justify-content:space-between">
          <b>${r.direccion==='dado'?'🎀 Le di:':'🎁 Recibí:'} ${esc(r.titulo)}</b>
          ${r.autor_id===SESSION.user.id?`<span class="tag-del" onclick="quitarRegaloCaja('${r.id}')">✕</span>`:''}
        </div>
        <div class="small muted">${r.fecha?new Date(r.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):''} · ${'💗'.repeat(r.valor_sentimental||1)}</div>
        ${r.img_url?`<img src="${r.img_url}" style="width:100%;border-radius:12px;margin-top:8px;max-height:200px;object-fit:cover">`:''}
        ${r.notas?`<p class="small" style="margin-top:6px">${esc(r.notas)}</p>`:''}
      </div>`).join('') : '<div class="empty small">Aún no han guardado regalos.</div>'}
  `;
}
async function agregarRegaloCaja(){
  const titulo = document.getElementById('regTitulo').value.trim();
  const direccion = document.getElementById('regDireccion').value;
  const fecha = document.getElementById('regFecha').value || null;
  const valor_sentimental = Number(document.getElementById('regValor').value);
  const notas = document.getElementById('regNotas').value.trim();
  const fotoEl = document.getElementById('regFoto');
  if(!titulo){ toast('Escribe el nombre del regalo'); return; }
  let img_url = null;
  if(fotoEl.files[0]){
    const dataUrl = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(fotoEl.files[0]); });
    img_url = await subirImagen(dataUrl, 'regalos', 'foto');
  }
  await sb.from('caja_regalos').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, direccion, fecha, valor_sentimental, notas, img_url});
  toast('Guardado en la caja de regalos 🎁'); refrescarCajaRegalos();
}
async function quitarRegaloCaja(id){ await sb.from('caja_regalos').delete().eq('id', id); refrescarCajaRegalos(); }
