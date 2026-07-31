/* ================= 🍿 PLANIFICADOR DE CITAS ================= */
const PLAN_CATEGORIAS = [
  ['restaurante','🍽️ Restaurante'],['cafeteria','☕ Cafetería'],['picnic','🧺 Picnic'],
  ['cine','🎬 Cine'],['museo','🖼️ Museo'],['parque','🌳 Parque'],['viaje','✈️ Viaje'],['personalizado','✨ Personalizado'],
];
let planificadorFiltro = 'pendientes';
async function renderPlanificador(){
  const main = document.getElementById('main');
  const { data } = await sb.from('planes').select('*').eq('couple_id',SESSION.coupleId).order('fecha',{ascending:true, nullsFirst:false});
  const items = data||[];
  const lista = planificadorFiltro==='pendientes' ? items.filter(p=>!p.hecho) : items.filter(p=>p.hecho);
  main.innerHTML = `
    <div class="card">
      <h2>🍿 Planificador de citas</h2>
      <div class="cat-chip-row" style="overflow-x:auto">${PLAN_CATEGORIAS.map(([v,l])=>`<button class="cat-chip" onclick="document.getElementById('planCategoria').value='${v}'">${l}</button>`).join('')}</div>
      <div class="field"><label>Categoría</label><select id="planCategoria">${PLAN_CATEGORIAS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
      <div class="field"><label>Título del plan</label><input id="planTitulo" placeholder="Cena en el restaurante nuevo"></div>
      <div class="grid2">
        <div class="field"><label>Fecha (opcional)</label><input type="date" id="planFecha"></div>
        <div class="field"><label>Lugar (opcional)</label><input id="planLugar"></div>
      </div>
      <div class="field"><label>Notas</label><textarea id="planNotas" rows="2"></textarea></div>
      <button class="btn btn-gold btn-block" onclick="agregarPlan()">Añadir plan</button>
    </div>
    <div class="subtabs" id="planFiltros">
      <button data-f="pendientes" class="${planificadorFiltro==='pendientes'?'active':''}">Por hacer</button>
      <button data-f="hechos" class="${planificadorFiltro==='hechos'?'active':''}">Cumplidos</button>
    </div>
    ${lista.length ? lista.map(p=>{
      const cat = PLAN_CATEGORIAS.find(c=>c[0]===p.categoria) || ['','✨'];
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><b>${cat[1].split(' ')[0]} ${esc(p.titulo)}</b><div class="small muted">${cat[1].split(' ').slice(1).join(' ')}${p.fecha?` · ${new Date(p.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}`:''}${p.lugar?` · ${esc(p.lugar)}`:''}</div></div>
          <span class="tag-del" onclick="quitarPlan('${p.id}')">✕</span>
        </div>
        ${p.notas?`<p class="small" style="margin-top:6px">${esc(p.notas)}</p>`:''}
        <button class="btn btn-sm ${p.hecho?'btn-outline':'btn-gold'}" style="margin-top:8px" onclick="toggleHechoPlan('${p.id}', ${!p.hecho})">${p.hecho?'↩️ Marcar pendiente':'✔️ Ya lo hicimos'}</button>
      </div>`;
    }).join('') : '<div class="empty small">Sin planes por aquí todavía.</div>'}
  `;
  document.querySelectorAll('#planFiltros button').forEach(b=>b.onclick=()=>{ planificadorFiltro=b.dataset.f; renderPlanificador(); });
}
async function agregarPlan(){
  const categoria = document.getElementById('planCategoria').value;
  const titulo = document.getElementById('planTitulo').value.trim();
  const fecha = document.getElementById('planFecha').value || null;
  const lugar = document.getElementById('planLugar').value.trim();
  const notas = document.getElementById('planNotas').value.trim();
  if(!titulo){ toast('Escribe un título para el plan'); return; }
  await sb.from('planes').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, categoria, titulo, fecha, lugar, notas});
  toast('Plan añadido 🍿'); renderPlanificador();
}
async function toggleHechoPlan(id, hecho){ await sb.from('planes').update({hecho}).eq('id', id); renderPlanificador(); }
async function quitarPlan(id){ await sb.from('planes').delete().eq('id', id); renderPlanificador(); }
