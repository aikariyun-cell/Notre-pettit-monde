/* ================= NOTAS RÁPIDAS (personales, compartidas, fijadas, recordatorios) ================= */
let notasSub = 'compartidas';
async function renderNotas(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs" id="notasSubtabs">
      <button data-r="compartidas" class="${notasSub==='compartidas'?'active':''}">💬 Compartidas</button>
      <button data-r="personales" class="${notasSub==='personales'?'active':''}">🔒 Personales</button>
      <button data-r="fijadas" class="${notasSub==='fijadas'?'active':''}">📌 Fijadas</button>
      <button data-r="recordatorios" class="${notasSub==='recordatorios'?'active':''}">⏰ Recordatorios</button>
    </div>
    <div id="notasBody"></div>`;
  document.querySelectorAll('#notasSubtabs button').forEach(b=>b.onclick=()=>{ notasSub=b.dataset.r; renderNotas(); });
  renderNotasBody(document.getElementById('notasBody'));
}
async function renderNotasBody(body){
  let query = sb.from('notas_rapidas').select('*').eq('couple_id', SESSION.coupleId).order('fijada',{ascending:false}).order('created_at',{ascending:false});
  if(notasSub==='personales') query = query.eq('tipo','personal').eq('autor_id', SESSION.user.id);
  else if(notasSub==='compartidas') query = query.eq('tipo','compartida');
  const { data } = await query;
  let items = data||[];
  if(notasSub==='fijadas') items = items.filter(n=>n.fijada);
  if(notasSub==='recordatorios') items = items.filter(n=>n.recordatorio_at).sort((a,b)=> new Date(a.recordatorio_at)-new Date(b.recordatorio_at));
  const ahora = new Date();
  body.innerHTML = `
    ${notasSub!=='fijadas' && notasSub!=='recordatorios' ? `
    <div class="card">
      <div class="field"><textarea id="notaTexto" rows="2" placeholder="${notasSub==='personales'?'Una nota solo para ti...':'Escribe una nota para compartir...'}"></textarea></div>
      <div class="field"><label>Recordatorio (opcional)</label><input type="datetime-local" id="notaRecordatorio"></div>
      <button class="btn btn-gold btn-block" onclick="crearNotaRapida()">Guardar nota</button>
    </div>` : ''}
    ${items.length ? items.map(n=>{
      const vencida = n.recordatorio_at && new Date(n.recordatorio_at) <= ahora && !n.hecho;
      return `<div class="card" style="${vencida?'border-color:var(--rosa-int)':''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <p style="white-space:pre-wrap;flex:1;margin:0">${esc(n.texto)}</p>
          <div style="display:flex;gap:8px">
            ${n.autor_id===SESSION.user.id ? `
              <span onclick="toggleFijarNota('${n.id}', ${!n.fijada})" style="cursor:pointer" title="Fijar">${n.fijada?'📌':'📍'}</span>
              <span onclick="editarNotaRapida('${n.id}')" style="cursor:pointer" title="Editar">✏️</span>
              <span class="tag-del" onclick="quitarNotaRapida('${n.id}')">✕</span>
            ` : `<span class="small muted" title="Solo quien la escribió puede editarla o borrarla">🔒</span>`}
          </div>
        </div>
        <div class="small muted" style="margin-top:6px">${n.tipo==='personal'?'🔒 Personal':'💬 Compartida'} · ${new Date(n.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
          ${n.recordatorio_at?` · ⏰ ${new Date(n.recordatorio_at).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}${vencida?' <b style="color:var(--rosa-int)">¡Vencido!</b>':''}`:''}
        </div>
        ${n.recordatorio_at ? `<label class="row" style="gap:8px;margin-top:6px"><input type="checkbox" ${n.hecho?'checked':''} onchange="toggleHechoNota('${n.id}', this.checked)"> <span class="small">Completado</span></label>` : ''}
      </div>`;
    }).join('') : '<div class="empty small">Nada por aquí todavía.</div>'}
  `;
}
async function crearNotaRapida(){
  const texto = document.getElementById('notaTexto').value.trim();
  const recordatorioEl = document.getElementById('notaRecordatorio');
  if(!texto){ toast('Escribe algo primero'); return; }
  const tipo = notasSub==='personales' ? 'personal' : 'compartida';
  const recordatorio_at = recordatorioEl && recordatorioEl.value ? new Date(recordatorioEl.value).toISOString() : null;
  await sb.from('notas_rapidas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, texto, recordatorio_at});
  toast('Nota guardada 📝'); renderNotas();
}
async function toggleFijarNota(id, fijada){ await sb.from('notas_rapidas').update({fijada}).eq('id', id); renderNotas(); }
async function toggleHechoNota(id, hecho){ await sb.from('notas_rapidas').update({hecho}).eq('id', id); renderNotas(); }
async function quitarNotaRapida(id){ await sb.from('notas_rapidas').delete().eq('id', id); renderNotas(); }
async function editarNotaRapida(id){
  const { data: n } = await sb.from('notas_rapidas').select('texto').eq('id', id).maybeSingle();
  if(!n) return;
  const nuevoTexto = prompt('Editar nota', n.texto);
  if(nuevoTexto===null || !nuevoTexto.trim()) return;
  await sb.from('notas_rapidas').update({texto:nuevoTexto.trim()}).eq('id', id);
  toast('Nota actualizada 📝'); renderNotas();
}
