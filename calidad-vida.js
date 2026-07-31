/* ================= ORGANIZACIÓN (Finanzas · Compras · Eventos · Checklists) ================= */
let orgSub = 'finanzas';
async function renderOrganizacion(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs" id="orgSubtabs">
      <button data-r="finanzas" class="${orgSub==='finanzas'?'active':''}">💰 Finanzas</button>
      <button data-r="compras" class="${orgSub==='compras'?'active':''}">🛒 Compras</button>
      <button data-r="eventos" class="${orgSub==='eventos'?'active':''}">🎂 Eventos</button>
      <button data-r="checklists" class="${orgSub==='checklists'?'active':''}">📋 Checklists</button>
    </div>
    <div id="orgBody"></div>`;
  document.querySelectorAll('#orgSubtabs button').forEach(b=>b.onclick=()=>{ orgSub=b.dataset.r; renderOrganizacion(); });
  const body = document.getElementById('orgBody');
  if(orgSub==='finanzas') return renderFinanzas(body);
  if(orgSub==='compras') return renderCompras(body);
  if(orgSub==='eventos') return renderEventos(body);
  return renderChecklists(body);
}

/* ---------- Finanzas de pareja ---------- */
const FIN_CATEGORIAS = ['comida','casa','ocio','transporte','salud','regalos','viajes','otro'];
async function renderFinanzas(body){
  const [{data:gastos}, {data:metas}, {data:presu}] = await Promise.all([
    sb.from('finanzas_gastos').select('*').eq('couple_id', SESSION.coupleId).order('fecha',{ascending:false}),
    sb.from('finanzas_metas').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false}),
    sb.from('finanzas_presupuesto').select('*').eq('couple_id', SESSION.coupleId).maybeSingle(),
  ]);
  const items = gastos||[];
  const totalGeneral = items.reduce((s,g)=>s+Number(g.monto||0),0);
  const pagP1 = items.filter(g=>g.quien_pago==='P1').reduce((s,g)=>s+Number(g.monto||0),0);
  const pagP2 = items.filter(g=>g.quien_pago==='P2').reduce((s,g)=>s+Number(g.monto||0),0);
  const ambos = items.filter(g=>g.quien_pago==='ambos').reduce((s,g)=>s+Number(g.monto||0),0);
  // división simple 50/50 sobre todo el gasto total
  const mitad = totalGeneral/2;
  const debeP1 = mitad - pagP1 - (ambos/2);
  const yo = SESSION.slot, otro = otroSlot();
  const miDeuda = yo==='P1' ? debeP1 : -debeP1;
  const now = new Date();
  const gastadoMes = items.filter(g=>{ const d=new Date(g.fecha); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }).reduce((s,g)=>s+Number(g.monto||0),0);
  const presupuestoMensual = presu?.mensual || 0;
  body.innerHTML = `
    <div class="hero" style="text-align:center">
      <h2>💰 Finanzas de pareja</h2>
      <p style="font-size:30px;font-weight:800;color:var(--rosa-int)">$${totalGeneral.toFixed(2)}</p>
      <p class="small muted">gastado en total como pareja</p>
      ${Math.abs(miDeuda)>0.01 ? `<p class="small" style="margin-top:6px">${miDeuda>0? `Tu pareja te debe $${miDeuda.toFixed(2)}` : `Le debes $${(-miDeuda).toFixed(2)} a tu pareja`} (división 50/50)</p>` : `<p class="small muted" style="margin-top:6px">Están a mano ✨</p>`}
    </div>
    <div class="card">
      <h3>Presupuesto mensual</h3>
      <div class="grid2">
        <div class="field"><label>Meta mensual</label><input type="number" min="0" step="0.01" id="finPresu" value="${presupuestoMensual||''}" placeholder="0.00"></div>
        <div class="field"><label>Gastado este mes</label><input value="$${gastadoMes.toFixed(2)}" disabled></div>
      </div>
      ${presupuestoMensual>0 ? `<div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, gastadoMes/presupuestoMensual*100)}%; background:${gastadoMes>presupuestoMensual?'var(--rosa-int)':'var(--ok)'}"></div></div>` : ''}
      <button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="guardarPresupuesto()">Guardar presupuesto</button>
    </div>
    <div class="card">
      <h3>Registrar gasto</h3>
      <div class="grid2">
        <div class="field"><label>Descripción</label><input id="finDesc" placeholder="Cena, super, uber..."></div>
        <div class="field"><label>Monto</label><input type="number" min="0" step="0.01" id="finMonto" placeholder="0.00"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Categoría</label><select id="finCat">${FIN_CATEGORIAS.map(c=>`<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('')}</select></div>
        <div class="field"><label>¿Quién pagó?</label><select id="finQuien"><option value="ambos">Ambos</option><option value="${yo}">Yo</option><option value="${otro}">Mi pareja</option></select></div>
      </div>
      <div class="field"><label>Fecha</label><input type="date" id="finFecha" value="${now.toISOString().slice(0,10)}"></div>
      <button class="btn btn-gold btn-block" onclick="agregarGasto()">Agregar gasto</button>
    </div>
    <div class="section-title">Historial de gastos</div>
    <div id="finLista">${items.length? items.map(g=>`
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div><b>${esc(g.descripcion)}</b><div class="small muted">${g.categoria} · ${g.quien_pago==='ambos'?'Ambos':(g.quien_pago===yo?'Tú':'Tu pareja')} · ${new Date(g.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</div></div>
        <div style="display:flex;align-items:center;gap:10px"><b style="color:var(--rosa-int)">$${Number(g.monto).toFixed(2)}</b><span class="tag-del" onclick="quitarGasto('${g.id}')">✕</span></div>
      </div>`).join('') : '<div class="empty small">Aún no hay gastos registrados.</div>'}</div>
    <div class="section-title">Metas de ahorro</div>
    <div class="card">
      <div class="grid2">
        <div class="field"><label>Meta</label><input id="metaTitulo" placeholder="Viaje a la playa"></div>
        <div class="field"><label>Objetivo</label><input type="number" min="0" step="0.01" id="metaObjetivo" placeholder="0.00"></div>
      </div>
      <div class="field"><label>Fecha límite (opcional)</label><input type="date" id="metaFecha"></div>
      <button class="btn btn-sm btn-primary" onclick="agregarMetaAhorro()">Crear meta de ahorro</button>
    </div>
    ${(metas||[]).map(m=>{
      const pct = m.monto_objetivo>0 ? Math.min(100, m.monto_actual/m.monto_objetivo*100) : 0;
      return `<div class="card">
        <div style="display:flex;justify-content:space-between"><b>🎯 ${esc(m.titulo)}</b><span class="tag-del" onclick="quitarMetaAhorro('${m.id}')">✕</span></div>
        <div class="small muted">$${Number(m.monto_actual).toFixed(2)} de $${Number(m.monto_objetivo).toFixed(2)}${m.fecha_limite?` · antes de ${new Date(m.fecha_limite+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}`:''}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="row" style="gap:8px;margin-top:8px">
          <input type="number" min="0" step="0.01" id="aporte-${m.id}" placeholder="Aportar $" style="flex:1">
          <button class="btn btn-sm btn-gold" onclick="aportarMeta('${m.id}')">Aportar</button>
        </div>
      </div>`;
    }).join('') || ''}
  `;
}
async function guardarPresupuesto(){
  const mensual = Number(document.getElementById('finPresu').value)||0;
  await sb.from('finanzas_presupuesto').upsert({couple_id:SESSION.coupleId, mensual, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
  toast('Presupuesto guardado 💰'); renderFinanzas(document.getElementById('orgBody'));
}
async function agregarGasto(){
  const descripcion = document.getElementById('finDesc').value.trim();
  const monto = Number(document.getElementById('finMonto').value);
  const categoria = document.getElementById('finCat').value;
  const quien_pago = document.getElementById('finQuien').value;
  const fecha = document.getElementById('finFecha').value;
  if(!descripcion || !monto || monto<=0){ toast('Completa la descripción y el monto'); return; }
  await sb.from('finanzas_gastos').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user?.id||null, descripcion, monto, categoria, quien_pago, fecha});
  toast('Gasto agregado 💸'); renderFinanzas(document.getElementById('orgBody'));
}
async function quitarGasto(id){ await sb.from('finanzas_gastos').delete().eq('id', id); renderFinanzas(document.getElementById('orgBody')); }
async function agregarMetaAhorro(){
  const titulo = document.getElementById('metaTitulo').value.trim();
  const monto_objetivo = Number(document.getElementById('metaObjetivo').value)||0;
  const fecha_limite = document.getElementById('metaFecha').value || null;
  if(!titulo || monto_objetivo<=0){ toast('Completa el nombre y el objetivo'); return; }
  await sb.from('finanzas_metas').insert({couple_id:SESSION.coupleId, titulo, monto_objetivo, fecha_limite});
  toast('Meta de ahorro creada 🎯'); renderFinanzas(document.getElementById('orgBody'));
}
async function aportarMeta(id){
  const input = document.getElementById('aporte-'+id);
  const monto = Number(input.value);
  if(!monto || monto<=0) return;
  const { data } = await sb.from('finanzas_metas').select('monto_actual').eq('id', id).maybeSingle();
  await sb.from('finanzas_metas').update({monto_actual:(data?.monto_actual||0)+monto}).eq('id', id);
  toast('Aporte guardado 💗'); renderFinanzas(document.getElementById('orgBody'));
}
async function quitarMetaAhorro(id){ await sb.from('finanzas_metas').delete().eq('id', id); renderFinanzas(document.getElementById('orgBody')); }

/* ---------- Lista de compras ---------- */
const COMPRAS_CATEGORIAS = ['super','hogar','farmacia','regalos','ropa','otro'];
let comprasFiltro = 'pendientes';
async function renderCompras(body){
  const { data } = await sb.from('compras_items').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  const items = data||[];
  const pendientes = items.filter(i=>!i.comprado);
  const comprados = items.filter(i=>i.comprado);
  const lista = comprasFiltro==='pendientes' ? pendientes : comprasFiltro==='favoritos' ? items.filter(i=>i.favorito) : comprados;
  body.innerHTML = `
    <div class="card">
      <h2>🛒 Lista de compras</h2>
      <div class="grid2">
        <div class="field"><label>Producto</label><input id="compNombre" placeholder="Leche, detergente..."></div>
        <div class="field"><label>Cantidad</label><input id="compCantidad" placeholder="2, 1kg..."></div>
      </div>
      <div class="field"><label>Categoría</label><select id="compCat">${COMPRAS_CATEGORIAS.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <button class="btn btn-gold btn-block" onclick="agregarCompra()">Añadir a la lista</button>
    </div>
    <div class="subtabs" id="comprasFiltros">
      <button data-f="pendientes" class="${comprasFiltro==='pendientes'?'active':''}">Pendientes (${pendientes.length})</button>
      <button data-f="favoritos" class="${comprasFiltro==='favoritos'?'active':''}">⭐ Favoritos</button>
      <button data-f="historial" class="${comprasFiltro==='historial'?'active':''}">Historial (${comprados.length})</button>
    </div>
    <div id="comprasLista">${lista.length? lista.map(i=>`
      <div class="card" style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" ${i.comprado?'checked':''} onchange="toggleCompra('${i.id}', this.checked)">
        <div style="flex:1"><b style="${i.comprado?'text-decoration:line-through;opacity:.6':''}">${esc(i.nombre)}</b>${i.cantidad?` <span class="small muted">· ${esc(i.cantidad)}</span>`:''}<div class="small muted">${i.categoria}</div></div>
        <span onclick="toggleFavCompra('${i.id}', ${!i.favorito})" style="cursor:pointer;font-size:18px">${i.favorito?'⭐':'☆'}</span>
        <span class="tag-del" onclick="quitarCompra('${i.id}')">✕</span>
      </div>`).join('') : '<div class="empty small">Nada por aquí todavía.</div>'}</div>
  `;
  document.querySelectorAll('#comprasFiltros button').forEach(b=>b.onclick=()=>{ comprasFiltro=b.dataset.f; renderCompras(body); });
}
async function agregarCompra(){
  const nombre = document.getElementById('compNombre').value.trim();
  const cantidad = document.getElementById('compCantidad').value.trim();
  const categoria = document.getElementById('compCat').value;
  if(!nombre){ toast('Escribe el nombre del producto'); return; }
  await sb.from('compras_items').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user?.id||null, nombre, cantidad, categoria});
  toast('Añadido a la lista 🛒'); renderCompras(document.getElementById('orgBody'));
}
async function toggleCompra(id, comprado){ await sb.from('compras_items').update({comprado, comprado_at: comprado? new Date().toISOString(): null}).eq('id', id); renderCompras(document.getElementById('orgBody')); }
async function toggleFavCompra(id, favorito){ await sb.from('compras_items').update({favorito}).eq('id', id); renderCompras(document.getElementById('orgBody')); }
async function quitarCompra(id){ await sb.from('compras_items').delete().eq('id', id); renderCompras(document.getElementById('orgBody')); }

/* ---------- Organización de eventos ---------- */
let eventoActivo = null;
async function renderEventos(body){
  if(eventoActivo) return renderEventoDetalle(eventoActivo, body);
  const { data } = await sb.from('eventos').select('*').eq('couple_id', SESSION.coupleId).order('fecha',{ascending:true});
  const items = data||[];
  body.innerHTML = `
    <div class="card">
      <h2>🎂 Organización de eventos</h2>
      <p class="muted small">Planeen cumpleaños, aniversarios o cualquier celebración juntos.</p>
      <div class="grid2">
        <div class="field"><label>Título</label><input id="evTitulo" placeholder="Cumpleaños sorpresa"></div>
        <div class="field"><label>Fecha</label><input type="date" id="evFecha"></div>
      </div>
      <div class="field"><label>Lugar (opcional)</label><input id="evLugar"></div>
      <div class="field"><label>Presupuesto (opcional)</label><input type="number" min="0" step="0.01" id="evPresu" placeholder="0.00"></div>
      <button class="btn btn-gold btn-block" onclick="crearEvento()">Crear evento</button>
    </div>
    <div class="section-title">Sus eventos</div>
    ${items.length? items.map(e=>{
      const d = e.fecha ? new Date(e.fecha+'T00:00:00') : null;
      return `<div class="card" style="cursor:pointer" onclick="eventoActivo='${e.id}';renderOrganizacion()">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><b>🎉 ${esc(e.titulo)}</b><div class="small muted">${d?d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):'Sin fecha'}${e.lugar?` · ${esc(e.lugar)}`:''}</div></div>
          <span class="tag-del" onclick="event.stopPropagation();quitarEvento2('${e.id}')">✕</span>
        </div>
      </div>`;
    }).join('') : '<div class="empty small">Aún no han creado ningún evento.</div>'}
  `;
}
async function crearEvento(){
  const titulo = document.getElementById('evTitulo').value.trim();
  const fecha = document.getElementById('evFecha').value || null;
  const lugar = document.getElementById('evLugar').value.trim();
  const presupuesto = Number(document.getElementById('evPresu').value)||0;
  if(!titulo){ toast('Escribe un título para el evento'); return; }
  await sb.from('eventos').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user?.id||null, titulo, fecha, lugar, presupuesto});
  toast('Evento creado 🎂'); renderOrganizacion();
}
async function quitarEvento2(id){ await sb.from('eventos').delete().eq('id', id); renderOrganizacion(); }
async function renderEventoDetalle(id, body){
  const [{data:ev},{data:invitados},{data:tareas},{data:archivos}] = await Promise.all([
    sb.from('eventos').select('*').eq('id', id).maybeSingle(),
    sb.from('eventos_invitados').select('*').eq('evento_id', id).order('created_at'),
    sb.from('eventos_tareas').select('*').eq('evento_id', id).order('created_at'),
    sb.from('eventos_archivos').select('*').eq('evento_id', id).order('created_at'),
  ]);
  if(!ev){ eventoActivo=null; return renderEventos(body); }
  const gastado = ev.gastado||0, presu = ev.presupuesto||0;
  body.innerHTML = `
    <button class="btn btn-sm" onclick="eventoActivo=null;renderOrganizacion()">← Volver a eventos</button>
    <div class="hero" style="text-align:center;margin-top:10px"><h2>🎉 ${esc(ev.titulo)}</h2>
      <p class="small muted">${ev.fecha? new Date(ev.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : 'Sin fecha definida'}${ev.lugar?` · ${esc(ev.lugar)}`:''}</p>
    </div>
    <div class="card">
      <h3>Presupuesto</h3>
      <div class="grid2">
        <div class="field"><label>Presupuesto total</label><input type="number" id="evPresuEdit" value="${presu}"></div>
        <div class="field"><label>Gastado</label><input type="number" id="evGastadoEdit" value="${gastado}"></div>
      </div>
      ${presu>0?`<div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,gastado/presu*100)}%; background:${gastado>presu?'var(--rosa-int)':'var(--ok)'}"></div></div>`:''}
      <button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="guardarPresuEvento('${id}')">Guardar</button>
    </div>
    <div class="card">
      <h3>Invitados</h3>
      <div class="row" style="gap:8px"><input id="evInvNombre" placeholder="Nombre del invitado" style="flex:1"><button class="btn btn-sm btn-gold" onclick="agregarInvitado('${id}')">Añadir</button></div>
      ${(invitados||[]).map(i=>`<div class="row" style="justify-content:space-between;padding:6px 0"><label class="row" style="gap:8px"><input type="checkbox" ${i.confirmado?'checked':''} onchange="toggleInvitado('${i.id}', this.checked, '${id}')"> ${esc(i.nombre)}</label><span class="tag-del" onclick="quitarInvitado('${i.id}','${id}')">✕</span></div>`).join('') || '<div class="empty small">Sin invitados aún.</div>'}
    </div>
    <div class="card">
      <h3>Lista de tareas</h3>
      <div class="row" style="gap:8px"><input id="evTareaTexto" placeholder="Reservar el lugar..." style="flex:1"><button class="btn btn-sm btn-gold" onclick="agregarTareaEvento('${id}')">Añadir</button></div>
      ${(tareas||[]).map(t=>`<div class="row" style="justify-content:space-between;padding:6px 0"><label class="row" style="gap:8px"><input type="checkbox" ${t.hecho?'checked':''} onchange="toggleTareaEvento('${t.id}', this.checked, '${id}')"> <span style="${t.hecho?'text-decoration:line-through;opacity:.6':''}">${esc(t.texto)}</span></label><span class="tag-del" onclick="quitarTareaEvento('${t.id}','${id}')">✕</span></div>`).join('') || '<div class="empty small">Sin tareas aún.</div>'}
    </div>
    <div class="card">
      <h3>Notas</h3>
      <textarea id="evNotas" rows="4" placeholder="Ideas, decoración, menú...">${esc(ev.notas||'')}</textarea>
      <button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="guardarNotasEvento('${id}')">Guardar notas</button>
    </div>
    <div class="card">
      <h3>Archivos (enlaces)</h3>
      <div class="row" style="gap:8px"><input id="evArchNombre" placeholder="Nombre" style="flex:1"><input id="evArchUrl" placeholder="https://..." style="flex:2"></div>
      <button class="btn btn-sm btn-gold" style="margin-top:6px" onclick="agregarArchivoEvento('${id}')">Añadir enlace</button>
      ${(archivos||[]).map(a=>`<div class="row" style="justify-content:space-between;padding:6px 0"><a href="${esc(a.url)}" target="_blank">${esc(a.nombre)}</a><span class="tag-del" onclick="quitarArchivoEvento('${a.id}','${id}')">✕</span></div>`).join('')}
    </div>
  `;
}
async function guardarPresuEvento(id){
  const presupuesto = Number(document.getElementById('evPresuEdit').value)||0;
  const gastado = Number(document.getElementById('evGastadoEdit').value)||0;
  await sb.from('eventos').update({presupuesto, gastado}).eq('id', id);
  toast('Presupuesto actualizado'); renderOrganizacion();
}
async function guardarNotasEvento(id){
  const notas = document.getElementById('evNotas').value;
  await sb.from('eventos').update({notas}).eq('id', id);
  toast('Notas guardadas 📝');
}
async function agregarInvitado(id){
  const nombre = document.getElementById('evInvNombre').value.trim();
  if(!nombre) return;
  await sb.from('eventos_invitados').insert({evento_id:id, nombre});
  renderOrganizacion();
}
async function toggleInvitado(idInv, confirmado, id){ await sb.from('eventos_invitados').update({confirmado}).eq('id', idInv); renderOrganizacion(); }
async function quitarInvitado(idInv, id){ await sb.from('eventos_invitados').delete().eq('id', idInv); renderOrganizacion(); }
async function agregarTareaEvento(id){
  const texto = document.getElementById('evTareaTexto').value.trim();
  if(!texto) return;
  await sb.from('eventos_tareas').insert({evento_id:id, texto});
  renderOrganizacion();
}
async function toggleTareaEvento(idT, hecho, id){ await sb.from('eventos_tareas').update({hecho}).eq('id', idT); renderOrganizacion(); }
async function quitarTareaEvento(idT, id){ await sb.from('eventos_tareas').delete().eq('id', idT); renderOrganizacion(); }
async function agregarArchivoEvento(id){
  const nombre = document.getElementById('evArchNombre').value.trim();
  const url = document.getElementById('evArchUrl').value.trim();
  if(!nombre || !url) return;
  await sb.from('eventos_archivos').insert({evento_id:id, nombre, url});
  renderOrganizacion();
}
async function quitarArchivoEvento(idA, id){ await sb.from('eventos_archivos').delete().eq('id', idA); renderOrganizacion(); }

/* ---------- Checklists compartidas (hogar, compras, eventos, regalos, personalizadas) ---------- */
const CHECKLIST_CATEGORIAS = [['hogar','🏠 Hogar'],['compras','🛒 Compras'],['eventos','🎂 Eventos'],['regalos','🎁 Regalos'],['personalizada','✨ Personalizada']];
async function renderChecklists(body){
  const { data: checklists } = await sb.from('checklists').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  const listas = checklists||[];
  const itemsPorLista = {};
  await Promise.all(listas.map(async l=>{
    const { data } = await sb.from('checklist_items').select('*').eq('checklist_id', l.id).order('orden');
    itemsPorLista[l.id] = data||[];
  }));
  body.innerHTML = `
    <div class="card">
      <h2>📋 Checklists compartidas</h2>
      <div class="grid2">
        <div class="field"><label>Nombre</label><input id="checkNombre" placeholder="Tareas del finde"></div>
        <div class="field"><label>Categoría</label><select id="checkCat">${CHECKLIST_CATEGORIAS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
      </div>
      <button class="btn btn-gold btn-block" onclick="crearChecklist()">Crear checklist</button>
    </div>
    ${listas.map(l=>{
      const its = itemsPorLista[l.id]||[];
      const hechos = its.filter(i=>i.hecho).length;
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>${(CHECKLIST_CATEGORIAS.find(c=>c[0]===l.categoria)||['','✨'])[1].split(' ')[0]} ${esc(l.nombre)}</b>
          <span class="tag-del" onclick="quitarChecklist('${l.id}')">✕</span>
        </div>
        <div class="small muted">${hechos}/${its.length} completado${its.length!==1?'s':''}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${its.length? hechos/its.length*100:0}%"></div></div>
        <div style="margin-top:8px">${its.map(i=>`<label class="row" style="gap:8px;padding:4px 0"><input type="checkbox" ${i.hecho?'checked':''} onchange="toggleChecklistItem('${i.id}', this.checked)"> <span style="flex:1;${i.hecho?'text-decoration:line-through;opacity:.6':''}">${esc(i.texto)}</span><span class="tag-del" onclick="quitarChecklistItem('${i.id}')">✕</span></label>`).join('')}</div>
        <div class="row" style="gap:8px;margin-top:6px"><input id="itemNuevo-${l.id}" placeholder="Nuevo elemento..." style="flex:1"><button class="btn btn-sm btn-primary" onclick="agregarChecklistItem('${l.id}')">+</button></div>
      </div>`;
    }).join('') || '<div class="empty small">Aún no tienen checklists. ¡Creen la primera!</div>'}
  `;
}
async function crearChecklist(){
  const nombre = document.getElementById('checkNombre').value.trim();
  const categoria = document.getElementById('checkCat').value;
  if(!nombre){ toast('Ponle un nombre a la checklist'); return; }
  await sb.from('checklists').insert({couple_id:SESSION.coupleId, nombre, categoria});
  toast('Checklist creada 📋'); renderOrganizacion();
}
async function quitarChecklist(id){ await sb.from('checklists').delete().eq('id', id); renderOrganizacion(); }
async function agregarChecklistItem(checklistId){
  const input = document.getElementById('itemNuevo-'+checklistId);
  const texto = input.value.trim();
  if(!texto) return;
  await sb.from('checklist_items').insert({checklist_id:checklistId, texto});
  renderOrganizacion();
}
async function toggleChecklistItem(id, hecho){ await sb.from('checklist_items').update({hecho}).eq('id', id); renderOrganizacion(); }
async function quitarChecklistItem(id){ await sb.from('checklist_items').delete().eq('id', id); renderOrganizacion(); }
