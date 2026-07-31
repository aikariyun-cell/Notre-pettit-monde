/* ================= 📖 LIBRO DE RECETAS ================= */
let recetarioFiltro = 'todas';
async function renderRecetario(){
  const main = document.getElementById('main');
  const { data } = await sb.from('recetas').select('*').eq('couple_id',SESSION.coupleId).order('created_at',{ascending:false});
  const items = data||[];
  const lista = recetarioFiltro==='todas' ? items : items.filter(r=>r.estado===recetarioFiltro);
  main.innerHTML = `
    <div class="card">
      <h2>📖 Libro de recetas</h2>
      <div class="field"><label>Nombre de la receta</label><input id="recTitulo" placeholder="Pasta al pesto"></div>
      <div class="grid2">
        <div class="field"><label>Estado</label><select id="recEstado"><option value="pendiente">📌 Pendiente</option><option value="favorita">⭐ Favorita</option><option value="preparada">✅ Ya la hicimos</option></select></div>
        <div class="field"><label>Tiempo</label><input id="recTiempo" placeholder="30 min"></div>
      </div>
      <div class="field"><label>Ingredientes</label><textarea id="recIngredientes" rows="3" placeholder="Uno por línea"></textarea></div>
      <div class="field"><label>Pasos (opcional)</label><textarea id="recPasos" rows="3"></textarea></div>
      <div class="field"><label>Foto (opcional)</label><input type="file" accept="image/*" id="recFoto"></div>
      <button class="btn btn-gold btn-block" onclick="agregarReceta()">Guardar receta</button>
    </div>
    <div class="subtabs" id="recetarioFiltros">
      <button data-f="todas" class="${recetarioFiltro==='todas'?'active':''}">Todas</button>
      <button data-f="favorita" class="${recetarioFiltro==='favorita'?'active':''}">⭐ Favoritas</button>
      <button data-f="pendiente" class="${recetarioFiltro==='pendiente'?'active':''}">📌 Pendientes</button>
      <button data-f="preparada" class="${recetarioFiltro==='preparada'?'active':''}">✅ Preparadas</button>
    </div>
    ${lista.length ? lista.map(r=>`
      <div class="card">
        ${r.img_url?`<img src="${r.img_url}" style="width:100%;border-radius:12px;max-height:180px;object-fit:cover;margin-bottom:8px">`:''}
        <div style="display:flex;justify-content:space-between">
          <b>${r.estado==='favorita'?'⭐':r.estado==='preparada'?'✅':'📌'} ${esc(r.titulo)}</b>
          <span class="tag-del" onclick="quitarReceta('${r.id}')">✕</span>
        </div>
        <div class="small muted">${r.tiempo?`⏱️ ${esc(r.tiempo)}`:''}</div>
        <div class="row" style="margin-top:6px">${[1,2,3,4,5].map(n=>`<span onclick="calificarReceta('${r.id}',${n})" style="cursor:pointer;font-size:16px">${n<=(r.calificacion||0)?'⭐':'☆'}</span>`).join('')}</div>
        ${r.ingredientes?`<details style="margin-top:6px"><summary class="small">Ingredientes</summary><p class="small" style="white-space:pre-wrap">${esc(r.ingredientes)}</p></details>`:''}
        ${r.pasos?`<details style="margin-top:4px"><summary class="small">Pasos</summary><p class="small" style="white-space:pre-wrap">${esc(r.pasos)}</p></details>`:''}
        <div class="row" style="gap:6px;margin-top:8px">
          ${r.estado!=='favorita'?`<button class="btn btn-sm btn-outline" onclick="cambiarEstadoReceta('${r.id}','favorita')">⭐ Favorita</button>`:''}
          ${r.estado!=='preparada'?`<button class="btn btn-sm btn-outline" onclick="cambiarEstadoReceta('${r.id}','preparada')">✅ Ya la hicimos</button>`:''}
        </div>
      </div>`).join('') : '<div class="empty small">Sin recetas todavía.</div>'}
  `;
  document.querySelectorAll('#recetarioFiltros button').forEach(b=>b.onclick=()=>{ recetarioFiltro=b.dataset.f; renderRecetario(); });
}
async function agregarReceta(){
  const titulo = document.getElementById('recTitulo').value.trim();
  const estado = document.getElementById('recEstado').value;
  const tiempo = document.getElementById('recTiempo').value.trim();
  const ingredientes = document.getElementById('recIngredientes').value.trim();
  const pasos = document.getElementById('recPasos').value.trim();
  const fotoEl = document.getElementById('recFoto');
  if(!titulo){ toast('Escribe el nombre de la receta'); return; }
  let img_url = null;
  if(fotoEl.files[0]){
    const dataUrl = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(fotoEl.files[0]); });
    img_url = await subirImagen(dataUrl, 'recetas', 'foto');
  }
  await sb.from('recetas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, estado, tiempo, ingredientes, pasos, img_url});
  toast('Receta guardada 📖'); renderRecetario();
}
async function calificarReceta(id, n){ await sb.from('recetas').update({calificacion:n}).eq('id', id); renderRecetario(); }
async function cambiarEstadoReceta(id, estado){ await sb.from('recetas').update({estado}).eq('id', id); renderRecetario(); }
async function quitarReceta(id){ await sb.from('recetas').delete().eq('id', id); renderRecetario(); }
