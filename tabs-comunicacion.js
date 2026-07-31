/* ================= COLECCIONES (cubre la lista larga de Extras) ================= */
const COLECCIONES = [
  {id:'diccionario', icon:'📖', label:'Diccionario de palabras y frases internas', campoTexto:'Significado / origen de la palabra'},
  {id:'primeras_veces', icon:'🌟', label:'Álbum de primeras veces', campoTexto:'¿Qué pasó?', fecha:true},
  {id:'suenos_metas', icon:'🌙', label:'Diario de sueños y metas', campoTexto:'Cuéntalo con detalle'},
  {id:'recetario', icon:'🍳', label:'Biblioteca de recetas por cocinar juntos', campoTexto:'Ingredientes / pasos', url:true},
  {id:'citas', icon:'💬', label:'Biblioteca de citas favoritas', campoTexto:'Cita completa'},
  {id:'tradiciones', icon:'🎐', label:'Tradiciones de la pareja', campoTexto:'¿En qué consiste?'},
  {id:'gifs_stickers', icon:'😂', label:'GIFs y stickers favoritos', campoTexto:'Descripción', url:true},
  {id:'conversaciones', icon:'💭', label:'Conversaciones memorables', campoTexto:'Fragmento de la conversación'},
  {id:'certificados', icon:'📜', label:'Certificados conmemorativos', campoTexto:'Motivo del certificado', fecha:true},
  {id:'mascotas', icon:'🐾', label:'Álbum de mascotas reales', campoTexto:'Sobre esta mascota'},
  {id:'regalos_recibidos', icon:'🎁', label:'Biblioteca de regalos recibidos', campoTexto:'Detalles del regalo', fecha:true},
  {id:'objetivos_cumplidos', icon:'🏆', label:'Cápsula de objetivos cumplidos', campoTexto:'¿Cómo lo lograron?', fecha:true, marcable:true},
  {id:'mapa_suenos', icon:'🗺️', label:'Mapa de sueños', campoTexto:'¿Por qué quieren ir/lograrlo?', marcable:true},
  {id:'arbol_genealogico', icon:'🌳', label:'Árbol genealógico básico', campoTexto:'Parentesco / notas'},
  {id:'poemas', icon:'🖋️', label:'Poemas y frases favoritas', campoTexto:'Texto completo'},
  {id:'restaurantes', icon:'🍽️', label:'Restaurantes y cafeterías por visitar', campoTexto:'¿Por qué quieren ir?', marcable:true},
  {id:'hobbies', icon:'🎨', label:'Hobbies compartidos', campoTexto:'Descripción'},
  {id:'desafios', icon:'🔥', label:'Desafíos personalizados', campoTexto:'Descripción del desafío', marcable:true},
  {id:'agradecimientos', icon:'🙏', label:'Muro de agradecimientos', campoTexto:'¿Por qué le agradeces hoy?'},
];
let coleccionActiva = null;
async function renderColecciones(){
  const main = document.getElementById('main');
  if(coleccionActiva) return renderColeccionDetalle(coleccionActiva, main);
  const { data } = await sb.from('colecciones_items').select('coleccion').eq('couple_id', SESSION.coupleId);
  const conteo = {};
  (data||[]).forEach(r=> conteo[r.coleccion] = (conteo[r.coleccion]||0)+1);
  main.innerHTML = `
    <div class="card"><h2>💕 Colecciones</h2><p class="muted small">Pequeños archivos para guardar todo lo que construyen juntos.</p></div>
    <div class="av-options">
      ${COLECCIONES.map(c=>`<div class="av-opt" onclick="coleccionActiva='${c.id}';renderColecciones()"><span class="ao-icon">${c.icon}</span><span>${c.label}${conteo[c.id]?` (${conteo[c.id]})`:''}</span></div>`).join('')}
    </div>`;
}
async function renderColeccionDetalle(colId, main){
  const cfg = COLECCIONES.find(c=>c.id===colId);
  if(!cfg){ coleccionActiva=null; return renderColecciones(); }
  const { data } = await sb.from('colecciones_items').select('*').eq('couple_id', SESSION.coupleId).eq('coleccion', colId).order('orden').order('created_at',{ascending:false});
  const items = data||[];
  main.innerHTML = `
    <button class="btn btn-sm" onclick="coleccionActiva=null;renderColecciones()">← Volver a colecciones</button>
    <div class="hero" style="text-align:center;margin-top:10px"><h2>${cfg.icon} ${cfg.label}</h2></div>
    <div class="card">
      <div class="field"><label>Título</label><input id="colTitulo" placeholder="Título breve"></div>
      <div class="field"><label>${cfg.campoTexto||'Detalles'}</label><textarea id="colTexto" rows="3"></textarea></div>
      ${cfg.fecha?`<div class="field"><label>Fecha</label><input type="date" id="colFecha"></div>`:''}
      ${cfg.url?`<div class="field"><label>Enlace (opcional)</label><input id="colUrl" placeholder="https://..."></div>`:''}
      <button class="btn btn-gold btn-block" onclick="agregarColeccionItem('${colId}')">Guardar en la colección</button>
    </div>
    <div id="colLista">${items.length? items.map(i=>`
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <b>${cfg.marcable&&i.meta?.hecho?'✅ ':''}${esc(i.titulo)}</b>
          <div style="display:flex;gap:8px;align-items:center">
            <span onclick="toggleFavColeccion('${i.id}', ${!i.favorito})" style="cursor:pointer">${i.favorito?'⭐':'☆'}</span>
            ${cfg.marcable?`<span onclick="toggleHechoColeccion('${i.id}', ${!(i.meta&&i.meta.hecho)})" style="cursor:pointer" title="Marcar como logrado">${(i.meta&&i.meta.hecho)?'↩️':'✔️'}</span>`:''}
            ${i.autor_id===SESSION.user.id ? `<span onclick="editarColeccionItem('${i.id}')" style="cursor:pointer" title="Editar">✏️</span><span class="tag-del" onclick="quitarColeccionItem('${i.id}')">✕</span>` : `<span class="small muted" title="Solo quien lo agregó puede editarlo o borrarlo">🔒</span>`}
          </div>
        </div>
        ${i.texto?`<p class="small" style="white-space:pre-wrap;margin-top:6px">${esc(i.texto)}</p>`:''}
        ${i.url?`<a href="${esc(i.url)}" target="_blank" class="small">${esc(i.url)}</a>`:''}
        ${i.meta&&i.meta.fecha?`<div class="small muted" style="margin-top:4px">${new Date(i.meta.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div>`:''}
      </div>`).join('') : '<div class="empty small">Aún no hay nada guardado aquí.</div>'}</div>
  `;
}
async function editarColeccionItem(id){
  const { data: i } = await sb.from('colecciones_items').select('*').eq('id', id).maybeSingle();
  if(!i) return;
  const nuevoTitulo = prompt('Editar título', i.titulo);
  if(nuevoTitulo===null) return;
  const nuevoTexto = prompt('Editar detalles', i.texto||'');
  if(nuevoTexto===null) return;
  await sb.from('colecciones_items').update({titulo:nuevoTitulo.trim()||i.titulo, texto:nuevoTexto}).eq('id', id);
  toast('Actualizado 💕'); renderColecciones();
}
async function agregarColeccionItem(colId){
  const titulo = document.getElementById('colTitulo').value.trim();
  const texto = document.getElementById('colTexto').value.trim();
  const fechaEl = document.getElementById('colFecha');
  const urlEl = document.getElementById('colUrl');
  if(!titulo){ toast('Escribe un título'); return; }
  const meta = {};
  if(fechaEl && fechaEl.value) meta.fecha = fechaEl.value;
  await sb.from('colecciones_items').insert({
    couple_id:SESSION.coupleId, autor_id:SESSION.user?.id||null, coleccion:colId,
    titulo, texto, url: urlEl?urlEl.value.trim():null, meta
  });
  toast('Guardado en la colección 💕'); renderColecciones();
}
async function toggleFavColeccion(id, favorito){ await sb.from('colecciones_items').update({favorito}).eq('id', id); renderColecciones(); }
async function toggleHechoColeccion(id, hecho){
  const { data } = await sb.from('colecciones_items').select('meta').eq('id', id).maybeSingle();
  const meta = Object.assign({}, data?.meta||{}, {hecho});
  await sb.from('colecciones_items').update({meta}).eq('id', id);
  renderColecciones();
}
async function quitarColeccionItem(id){ await sb.from('colecciones_items').delete().eq('id', id); renderColecciones(); }
