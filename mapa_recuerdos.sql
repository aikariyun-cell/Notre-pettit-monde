/* ================= EMOCIONES (registro diario con intensidad y motivo) ================= */
const EMOCIONES_EMOJIS = ['🥰','😊','😌','😐','😢','😤','😴','🥺','😰','🤒'];
const EMOCIONES_MOTIVOS = ['Pareja','Trabajo','Familia','Salud','Amistades','Dinero','Sueño','Otro'];
let emocionSeleccionada = null;

async function renderEmociones(){
  const main = document.getElementById('main');
  const hoy = new Date().toISOString().slice(0,10);
  const { data: deHoy } = await sb.from('emociones_diarias').select('*').eq('couple_id',SESSION.coupleId).eq('autor_id',SESSION.user.id).eq('fecha', hoy).maybeSingle();
  const { data: historial } = await sb.from('emociones_diarias').select('*').eq('couple_id',SESSION.coupleId).order('fecha',{ascending:false}).limit(30);
  // Solo tomamos el valor guardado la primera vez que se abre la pantalla hoy;
  // si ya hay una selección en memoria (el usuario tocó un emoji), la respetamos
  // en vez de pisarla con lo que hay en la base de datos en cada refresco.
  if(emocionSeleccionada === null) emocionSeleccionada = (deHoy && deHoy.emoji) || '😊';
  main.innerHTML = `
    <div class="hero" style="text-align:center">
      <h2>😊 ¿Cómo te sientes hoy?</h2>
      <p class="small muted">${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</p>
    </div>
    <div class="card">
      <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap;font-size:26px" id="emocionEmojis">
        ${EMOCIONES_EMOJIS.map(e=>`<span data-e="${e}" style="cursor:pointer;padding:6px;border-radius:12px;${e===emocionSeleccionada?'background:var(--superficie);outline:2px solid var(--rosa-int)':''}">${e}</span>`).join('')}
      </div>
      <div class="field" style="margin-top:14px"><label>Intensidad</label>
        <input type="range" min="1" max="5" id="emocionIntensidad" value="${(deHoy&&deHoy.intensidad)||3}">
        <div class="small muted" style="text-align:center">Suave · Moderado · Intenso</div>
      </div>
      <div class="field"><label>Motivo</label>
        <select id="emocionMotivo">${EMOCIONES_MOTIVOS.map(m=>`<option ${(deHoy&&deHoy.motivo)===m?'selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Nota (opcional)</label><textarea id="emocionNota" rows="2" placeholder="¿Qué pasó hoy?">${esc((deHoy&&deHoy.nota)||'')}</textarea></div>
      <button class="btn btn-gold btn-block" onclick="guardarEmocionDia()">Guardar</button>
    </div>
    <div class="section-title">Historial</div>
    ${(historial&&historial.length) ? historial.map(h=>`
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div><span style="font-size:22px">${h.emoji}</span> <b>${esc(h.motivo||'')}</b>
          <div class="small muted">${new Date(h.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})} · Intensidad ${h.intensidad}/5 ${h.autor_id===SESSION.user.id?'· Tú':'· Tu pareja'}</div>
          ${h.nota?`<p class="small" style="margin-top:4px">${esc(h.nota)}</p>`:''}
        </div>
        ${h.autor_id===SESSION.user.id ? `<span class="tag-del" onclick="borrarEmocion('${h.id}')">✕</span>` : ''}
      </div>`).join('') : '<div class="empty small">Aún no hay registros.</div>'}
  `;
  document.querySelectorAll('#emocionEmojis span').forEach(s=>s.onclick=()=>{
    emocionSeleccionada = s.dataset.e;
    document.querySelectorAll('#emocionEmojis span').forEach(el=>{
      el.style.background = el.dataset.e===emocionSeleccionada ? 'var(--superficie)' : '';
      el.style.outline = el.dataset.e===emocionSeleccionada ? '2px solid var(--rosa-int)' : '';
    });
  });
}
async function guardarEmocionDia(){
  const hoy = new Date().toISOString().slice(0,10);
  const intensidad = Number(document.getElementById('emocionIntensidad').value);
  const motivo = document.getElementById('emocionMotivo').value;
  const nota = document.getElementById('emocionNota').value.trim();
  const { data: existente } = await sb.from('emociones_diarias').select('id').eq('couple_id',SESSION.coupleId).eq('autor_id',SESSION.user.id).eq('fecha', hoy).maybeSingle();
  if(existente){
    await sb.from('emociones_diarias').update({emoji:emocionSeleccionada, intensidad, motivo, nota}).eq('id', existente.id);
  } else {
    await sb.from('emociones_diarias').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, fecha:hoy, emoji:emocionSeleccionada, intensidad, motivo, nota});
  }
  toast('Emoción guardada 💗');
  emocionSeleccionada = null;
  renderEmociones();
}
async function borrarEmocion(id){
  await sb.from('emociones_diarias').delete().eq('id', id).eq('autor_id', SESSION.user.id);
  emocionSeleccionada = null;
  toast('Registro eliminado');
  renderEmociones();
}
