async function renderInicio(){
  const main = document.getElementById('main');
  const miPerfil = CACHE.perfiles[SESSION.slot] || {};
  const suPerfil = CACHE.perfiles[otroSlot()] || {};
  const { data: pareja } = await sb.from('pareja').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
  const { data: extras } = await sb.from('extras').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
  const { data: cal } = await sb.from('calendario').select('*').eq('couple_id', SESSION.coupleId).order('fecha',{ascending:true});
  const p = pareja || {}; const ex = extras || {};

  const now = new Date();
  const hora = now.getHours();
  const saludo = hora<6?'Buenas madrugadas':hora<12?'Buenos días':hora<19?'Buenas tardes':'Buenas noches';
  const nombreCorto = (miPerfil.apodo||miPerfil.nombre||'').split(' ')[0]||'';

  let diasJuntos='—', cuentaAniv=null;
  if(p.inicio){ const d0=new Date(p.inicio+'T00:00:00'); diasJuntos=Math.max(0,Math.floor((now-d0)/86400000)); }
  if(p.aniversario){
    const [,mm,dd] = p.aniversario.split('-');
    let next = new Date(now.getFullYear(), parseInt(mm)-1, parseInt(dd));
    if(next<now) next=new Date(now.getFullYear()+1, parseInt(mm)-1, parseInt(dd));
    cuentaAniv = Math.ceil((next-now)/86400000);
  }
  const proximos = (cal||[]).filter(e=> new Date(e.fecha) >= new Date(now.toDateString())).slice(0,3);
  const frasesTodas = Object.values(FRASES).flat();
  const fraseDia = frasesTodas[now.getDate() % frasesTodas.length];

  let emergHtml='';
  if(ex.emergencia && !ex.emergencia.leido && ex.emergencia.de !== SESSION.slot){
    emergHtml = `<div class="emergency-banner"><div><b>${esc(suPerfil.apodo||suPerfil.nombre||'Tu pareja')}</b> te envió: <br><span class="script" style="font-size:15px">${esc(ex.emergencia.msg)}</span></div>
      <button class="btn btn-sm btn-gold" onclick="marcarEmergenciaLeida()">Entendido</button></div>`;
  }
  const notas = (ex.notas||[]).filter(n=>n.para===SESSION.slot && !n.leido).slice(-1);
  let notaHtml='';
  if(notas.length){
    notaHtml = `<div class="card" style="background:linear-gradient(135deg,rgba(240,219,176,.35),rgba(246,207,224,.35))">
      <h3>💛 Un mensaje para ti</h3><p class="script" style="font-size:16px">${esc(notas[0].texto)}</p>
      <button class="btn btn-sm btn-outline" onclick="marcarNotaLeida('${notas[0].id}')">Ya lo vi</button></div>`;
  }

  main.innerHTML = `
    ${emergHtml}
    <div class="hero">
      ${PERSONALIZACION.nombreMundo ? `<div class="muted small" style="letter-spacing:.03em">${esc(PERSONALIZACION.nombreMundo)}</div>` : ''}
      <div class="greet">${saludo}, ${esc(nombreCorto)} 💕</div>
      <div class="time">${now.toLocaleDateString('es-ES',{weekday:'long', day:'numeric', month:'long'})} · ${now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</div>
      <div class="days"><b>${diasJuntos}</b><span class="muted">días juntos</span></div>
      ${cuentaAniv!==null?`<div class="muted" style="margin-top:4px">🎉 Faltan ${cuentaAniv} días para su aniversario</div>`:''}
      <div class="quote">"${esc(fraseDia)}"</div>
    </div>
    ${notaHtml}
    ${widgetActivo('animo') ? `<div class="card">
      <h2>¿Cómo se sienten hoy?</h2>
      <div class="grid2">
        <div><div class="small muted">Tú</div><div class="mood-row" id="moodMine"></div></div>
        <div><div class="small muted" style="cursor:pointer" onclick="verPerfilPareja()">${esc(suPerfil.apodo||suPerfil.nombre||'Pareja')} 👀</div>
          <div id="moodTheirs" style="font-size:26px;padding-top:6px">${(ex.mood && ex.mood[otroSlot()] && ex.mood[otroSlot()].dia===now.toDateString()) ? ex.mood[otroSlot()].emoji : '—'}</div></div>
      </div>
    </div>` : ''}
    ${widgetActivo('calendario') ? `<div class="card">
      <h2>Próximo en el calendario</h2>
      ${proximos.length? proximos.map(e=>`<div class="cal-item"><div class="cal-date"><b>${new Date(e.fecha).getDate()}</b><span>${new Date(e.fecha).toLocaleDateString('es-ES',{month:'short'})}</span></div><div><b>${esc(e.titulo)}</b><div class="small muted">${e.estado||''}</div></div></div>`).join('')
      : `<div class="empty small">Aún no hay eventos. Agrega uno en Calendario ✨</div>`}
    </div>` : ''}
    ${widgetActivo('accesos') ? `<div class="card">
      <h2>Accesos rápidos</h2>
      <div class="grid2">
        <button class="btn btn-outline" onclick="switchTab('cartas')">💌 Escribir carta</button>
        <button class="btn btn-outline" onclick="switchTab('chat')">💬 Ir al chat</button>
        <button class="btn btn-outline" onclick="switchTab('extras')">✨ Botón de emergencia</button>
      </div>
    </div>` : ''}`;
  const moods=['🥰','😊','😌','😴','😢','😤','🤒','🥺'];
  const mineMood = (ex.mood && ex.mood[SESSION.slot] && ex.mood[SESSION.slot].dia===now.toDateString()) ? ex.mood[SESSION.slot].emoji : null;
  const moodMineEl = document.getElementById('moodMine');
  if(moodMineEl){
    moodMineEl.innerHTML = moods.map(m=>`<button class="mood-btn ${m===mineMood?'active':''}" data-m="${m}">${m}</button>`).join('');
    moodMineEl.querySelectorAll('button').forEach(b=>b.onclick=async()=>{
      const mood = ex.mood || {};
      mood[SESSION.slot] = {emoji:b.dataset.m, dia:new Date().toDateString()};
      await upsertExtras({mood});
      toast('Ánimo guardado 💗'); renderInicio();
    });
  }
}
async function upsertExtras(campos){
  const payload = Object.assign({couple_id:SESSION.coupleId, updated_at:new Date().toISOString()}, campos);
  await sb.from('extras').upsert(payload, {onConflict:'couple_id'});
}
async function marcarEmergenciaLeida(){
  const { data } = await sb.from('extras').select('emergencia').eq('couple_id',SESSION.coupleId).maybeSingle();
  const em = (data && data.emergencia) || {}; em.leido = true;
  await upsertExtras({emergencia:em}); renderInicio();
}
async function marcarNotaLeida(id){
  const { data } = await sb.from('extras').select('notas').eq('couple_id',SESSION.coupleId).maybeSingle();
  const notas = (data && data.notas) || [];
  notas.forEach(n=>{ if(n.id===id) n.leido=true; });
  await upsertExtras({notas}); renderInicio();
}

/* ================= CONÓCEME ================= */
let conocemeView = null;
async function getConoceme(slot){
  const userId = MEMBERS[slot];
  if(!userId) return {favoritos:{},gustos:[],disgustos:[],deseos:[],fechas:[]};
  const { data } = await sb.from('conoceme').select('*').eq('user_id', userId).maybeSingle();
  return data || {favoritos:{},gustos:[],disgustos:[],deseos:[],fechas:[]};
}
async function saveMiConoceme(campos){
  const base = await getConoceme(SESSION.slot);
  const payload = Object.assign({user_id:SESSION.user.id, couple_id:SESSION.coupleId}, base, campos, {updated_at:new Date().toISOString()});
  delete payload.id;
  await sb.from('conoceme').upsert(payload, {onConflict:'user_id'});
}
async function renderConoceme(){
  conocemeView = conocemeView || SESSION.slot;
  const main = document.getElementById('main');
  const perfilV = CACHE.perfiles[conocemeView] || {};
  const data = await getConoceme(conocemeView);
  const soyYo = conocemeView === SESSION.slot;
  main.innerHTML = `
    <div class="subtabs">
      <button data-v="${SESSION.slot}" class="${conocemeView===SESSION.slot?'active':''}">Tú</button>
      <button data-v="${otroSlot()}" class="${conocemeView===otroSlot()?'active':''}">${esc(perfilV.nombre && !soyYo ? perfilV.nombre : 'Pareja')}</button>
    </div>
    <div class="card">
      <h2>Favoritos de ${esc(perfilV.apodo||perfilV.nombre||'—')}</h2>
      <div class="acc open" id="accFav">
        <div class="acc-h"><span>Categorías favoritas</span><span class="chev">›</span></div>
        <div class="acc-b">
          <div class="fav-grid">
            ${FAVS_FIELDS.map(([k,label])=>`<div class="field"><label>${label}</label><input data-fav="${k}" ${soyYo?'':'disabled'} value="${esc((data.favoritos||{})[k]||'')}" placeholder="—"></div>`).join('')}
          </div>
          ${soyYo?`<button class="btn btn-gold btn-block" style="margin-top:12px" onclick="guardarFavoritos()">Guardar favoritos</button>`:''}
        </div>
      </div>
    </div>
    <div class="card">
      <h3>Le gusta</h3>
      <div id="gustosChips">${(data.gustos||[]).map((g,i)=>`<span class="chip">${esc(g)} ${soyYo?`<span class="tag-del" onclick="quitarLista('gustos',${i})">✕</span>`:''}</span>`).join('') || '<span class="muted small">Nada registrado aún</span>'}</div>
      ${soyYo?`<div class="row" style="margin-top:10px"><input id="nuevoGusto" placeholder="Ej: los atardeceres" style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea)"><button class="btn btn-gold btn-sm" onclick="agregarLista('gustos','nuevoGusto')">Añadir</button></div>`:''}
    </div>
    <div class="card">
      <h3>No le gusta</h3>
      <div id="disgustosChips">${(data.disgustos||[]).map((g,i)=>`<span class="chip">${esc(g)} ${soyYo?`<span class="tag-del" onclick="quitarLista('disgustos',${i})">✕</span>`:''}</span>`).join('') || '<span class="muted small">Nada registrado aún</span>'}</div>
      ${soyYo?`<div class="row" style="margin-top:10px"><input id="nuevoDisgusto" placeholder="Ej: el ruido fuerte" style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea)"><button class="btn btn-gold btn-sm" onclick="agregarLista('disgustos','nuevoDisgusto')">Añadir</button></div>`:''}
    </div>
    <div class="card">
      <h3>Lista de deseos</h3>
      ${(data.deseos||[]).map((d,i)=>`<div class="item-row"><span style="${d.hecho?'text-decoration:line-through;opacity:.5':''}">${esc(d.texto)}</span>${soyYo?`<span><button class="btn btn-sm btn-ghost" onclick="toggleDeseo(${i})">${d.hecho?'↺':'✓'}</button> <span class="tag-del" onclick="quitarLista('deseos',${i})">✕</span></span>`:''}</div>`).join('') || '<div class="muted small">Sin deseos aún</div>'}
      ${soyYo?`<div class="row" style="margin-top:10px"><input id="nuevoDeseo" placeholder="Algo que le gustaría" style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea)"><button class="btn btn-gold btn-sm" onclick="agregarDeseo()">Añadir</button></div>`:''}
    </div>
    <div class="card">
      <h3>Fechas importantes</h3>
      ${(data.fechas||[]).map((f,i)=>`<div class="item-row"><span><b>${new Date(f.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long'})}</b> — ${esc(f.texto)}</span>${soyYo?`<span class="tag-del" onclick="quitarLista('fechas',${i})">✕</span>`:''}</div>`).join('') || '<div class="muted small">Sin fechas registradas</div>'}
      ${soyYo?`<div class="row" style="margin-top:10px;flex-wrap:wrap"><input type="date" id="nuevaFechaF" style="padding:10px;border-radius:12px;border:1.5px solid var(--linea)"><input id="nuevaFechaT" placeholder="¿Qué se celebra?" style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea);min-width:120px"><button class="btn btn-gold btn-sm" onclick="agregarFecha()">Añadir</button></div>`:''}
    </div>`;
  main.querySelectorAll('.subtabs button').forEach(b=>b.onclick=()=>{ conocemeView=b.dataset.v; renderConoceme(); });
  const acc = document.getElementById('accFav');
  acc.querySelector('.acc-h').onclick=()=>acc.classList.toggle('open');
}
async function guardarFavoritos(){
  const favoritos = {};
  document.querySelectorAll('[data-fav]').forEach(inp=>{ favoritos[inp.dataset.fav]=inp.value.trim(); });
  await saveMiConoceme({favoritos});
  toast('Favoritos guardados 💗');
}
async function agregarLista(campo, inputId){
  const val = document.getElementById(inputId).value.trim(); if(!val) return;
  const data = await getConoceme(SESSION.slot);
  const arr = data[campo]||[]; arr.push(val);
  await saveMiConoceme({[campo]:arr}); renderConoceme();
}
async function agregarDeseo(){
  const val = document.getElementById('nuevoDeseo').value.trim(); if(!val) return;
  const data = await getConoceme(SESSION.slot);
  const arr = data.deseos||[]; arr.push({texto:val, hecho:false});
  await saveMiConoceme({deseos:arr}); renderConoceme();
}
async function toggleDeseo(i){
  const data = await getConoceme(SESSION.slot);
  data.deseos[i].hecho = !data.deseos[i].hecho;
  await saveMiConoceme({deseos:data.deseos}); renderConoceme();
}
async function agregarFecha(){
  const f = document.getElementById('nuevaFechaF').value;
  const t = document.getElementById('nuevaFechaT').value.trim();
  if(!f || !t) return;
  const data = await getConoceme(SESSION.slot);
  const arr = data.fechas||[]; arr.push({fecha:f, texto:t});
  await saveMiConoceme({fechas:arr}); renderConoceme();
}
async function quitarLista(campo, i){
  const data = await getConoceme(SESSION.slot);
  data[campo].splice(i,1);
  await saveMiConoceme({[campo]:data[campo]}); renderConoceme();
}

/* ================= NOSOTROS ================= */
async function getPareja(){
  const { data } = await sb.from('pareja').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
  return data || {};
}
async function saveParejaCampos(campos){
  const payload = Object.assign({couple_id:SESSION.coupleId, updated_at:new Date().toISOString()}, campos);
  await sb.from('pareja').upsert(payload, {onConflict:'couple_id'});
}
async function getGamificacion(){
  const { data } = await sb.from('gamificacion').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
  if(data) return data;
  const nueva = { couple_id:SESSION.coupleId };
  await sb.from('gamificacion').insert(nueva);
  const { data: creada } = await sb.from('gamificacion').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
  return creada || {actividades_totales:0, minijuegos_jugados:0, logros:[]};
}
/* ===== Insignias / logros (reemplaza al antiguo sistema de monedas/XP/nivel/racha) ===== */
const LOGROS = [
  {id:'primer_mensaje', ic:'💬', nombre:'Primeras palabras', desc:'Envíen su primer mensaje en el chat', check:c=>c.mensajes>=1},
  {id:'charlatanes', ic:'🗨️', nombre:'Charlatanes', desc:'Acumulen 100 mensajes en el chat', check:c=>c.mensajes>=100},
  {id:'primera_carta', ic:'💌', nombre:'Cartas de amor', desc:'Envíen su primera carta', check:c=>c.cartas>=1},
  {id:'mbti_completo', ic:'🧠', nombre:'Autoconocimiento', desc:'Completa el test MBTI', check:c=>c.mbti>=1},
  {id:'compatibilidad_10', ic:'🧩', nombre:'Compatibles', desc:'Respondan 10 preguntas del test de compatibilidad', check:c=>c.compat>=10},
  {id:'primer_juego', ic:'🎮', nombre:'A jugar', desc:'Ganen su primer juego juntos', check:c=>c.juegos>=1},
  {id:'cinco_juegos', ic:'🏆', nombre:'Competitivos', desc:'Ganen 5 juegos juntos', check:c=>c.juegos>=5},
  {id:'primer_checkin', ic:'🌱', nombre:'Check-in', desc:'Completen su primer check-in semanal', check:c=>c.checkins>=1},
  {id:'diez_conversaciones', ic:'💭', nombre:'Buenas charlas', desc:'Respondan 10 preguntas de conversación', check:c=>c.conversaciones>=10},
  {id:'album_10', ic:'📸', nombre:'Coleccionistas', desc:'Suban 10 recuerdos al álbum', check:c=>c.album>=10},
  {id:'diario_7', ic:'📔', nombre:'Constancia', desc:'Escriban 7 entradas de diario', check:c=>c.diario>=7},
  {id:'diez_recuerdos', ic:'🎞️', nombre:'Guardianes de recuerdos', desc:'Guarden 10 recuerdos especiales', check:c=>c.recuerdos>=10},
];
async function obtenerContadoresLogros(){
  const cid = SESSION.coupleId, uid = SESSION.user.id;
  const contar = async (tabla, propio) => {
    let q = sb.from(tabla).select('id', {count:'exact', head:true}).eq('couple_id', cid);
    if(propio) q = q.eq('autor_id', uid);
    const { count } = await q;
    return count||0;
  };
  const [mensajes, cartas, mbti, compat, checkins, conversaciones, album, diario, recuerdos] = await Promise.all([
    contar('chat_mensajes', false),
    contar('cartas', false),
    contar('mbti_tests', true),
    contar('compatibilidad_respuestas', true),
    contar('checkins_semanales', true),
    contar('conversaciones_respuestas', true),
    contar('album', false),
    contar('diario', true),
    contar('banco_recuerdos', false),
  ]);
  const g = await getGamificacion();
  return { mensajes, cartas, mbti, compat, checkins, conversaciones, album, diario, recuerdos, juegos: g.minijuegos_jugados||0 };
}
async function verificarLogros(mostrarCelebracion){
  try{
    if(isDemoMode()) return [];
    const g = await getGamificacion();
    const counts = await obtenerContadoresLogros();
    const actuales = new Set(g.logros||[]);
    const nuevos = LOGROS.filter(l=>!actuales.has(l.id) && l.check(counts));
    if(nuevos.length){
      const actualizados = [...actuales, ...nuevos.map(l=>l.id)];
      await sb.from('gamificacion').update({logros:actualizados, updated_at:new Date().toISOString()}).eq('couple_id', SESSION.coupleId);
      if(mostrarCelebracion) nuevos.forEach(l=> toast(`🏅 ¡Insignia desbloqueada! ${l.ic} ${l.nombre}`));
    }
    return nuevos;
  }catch(e){ console.error(e); return []; }
}
async function registrarActividad(){
  if(isDemoMode()) return;
  try{
    const g = await getGamificacion();
    await sb.from('gamificacion').update({actividades_totales:(g.actividades_totales||0)+1, updated_at:new Date().toISOString()}).eq('couple_id', SESSION.coupleId);
  }catch(e){ console.error(e); }
  await verificarLogros(true);
}
async function registrarJuegoGanado(){
  if(isDemoMode()) return;
  try{
    const g = await getGamificacion();
    await sb.from('gamificacion').update({minijuegos_jugados:(g.minijuegos_jugados||0)+1, actividades_totales:(g.actividades_totales||0)+1, updated_at:new Date().toISOString()}).eq('couple_id', SESSION.coupleId);
  }catch(e){ console.error(e); }
  await verificarLogros(true);
}
function pintarLogros(g){
  const desbloqueados = new Set(g.logros||[]);
  return `<div class="badges-grid">${LOGROS.map(l=>{
    const on = desbloqueados.has(l.id);
    return `<div class="badge-item ${on?'unlocked':'locked'}" title="${esc(l.desc)}">
      <div class="badge-ic">${l.ic}</div>
      <div class="badge-nombre">${esc(l.nombre)}</div>
      ${on?'<div class="badge-check">✓</div>':'<div class="badge-lock">🔒</div>'}
    </div>`;
  }).join('')}</div>`;
}
async function renderNosotros(){
  const main = document.getElementById('main');
  const p = await getPareja();
  const g = await getGamificacion();
  const desbloqueadas = (g.logros||[]).length;
  main.innerHTML = `
    <div class="card">
      <h2>🏅 Insignias</h2>
      <p class="small muted" style="margin-top:-4px">${desbloqueadas}/${LOGROS.length} desbloqueadas — se ganan respondiendo preguntas, guardando recuerdos y jugando juntos ✨</p>
      ${pintarLogros(g)}
    </div>
    <div class="card">
      <h2>Nuestra base de datos</h2>
      <div class="grid2">
        <div class="field"><label>Cómo comenzó (fecha)</label><input type="date" id="ns-inicio" value="${p.inicio||''}"></div>
        <div class="field"><label>Aniversario</label><input type="date" id="ns-aniv" value="${p.aniversario||''}"></div>
      </div>
      <div class="field"><label>Canción de la pareja</label><input id="ns-cancion" value="${esc(p.cancion||'')}"></div>
      <div class="field"><label>Frase favorita</label><input id="ns-frase" value="${esc(p.frase||'')}"></div>
      <button class="btn btn-gold btn-block" onclick="guardarPareja()">Guardar</button>
    </div>
    <div class="card">
      <h3>Contadores del cariño</h3>
      <div class="grid2" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="stat-box"><b>${p.besos||0}</b><span>Besos</span><button class="btn btn-sm btn-ghost" style="margin-top:6px" onclick="contador('besos',${p.besos||0})">+1</button><button class="btn btn-sm btn-outline" style="margin-top:6px;padding:6px 8px;font-size:11px" onclick="reiniciarContador('besos')">Reiniciar</button></div>
        <div class="stat-box"><b>${p.abrazos||0}</b><span>Abrazos</span><button class="btn btn-sm btn-ghost" style="margin-top:6px" onclick="contador('abrazos',${p.abrazos||0})">+1</button><button class="btn btn-sm btn-outline" style="margin-top:6px;padding:6px 8px;font-size:11px" onclick="reiniciarContador('abrazos')">Reiniciar</button></div>
        <div class="stat-box"><b>${p.citas||0}</b><span>Citas</span><button class="btn btn-sm btn-ghost" style="margin-top:6px" onclick="contador('citas',${p.citas||0})">+1</button><button class="btn btn-sm btn-outline" style="margin-top:6px;padding:6px 8px;font-size:11px" onclick="reiniciarContador('citas')">Reiniciar</button></div>
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="reiniciarTodosContadores()">Reiniciar los tres a la vez</button>
    </div>
    <div class="card">
      <h3>Metas en pareja</h3>
      ${(p.metas||[]).map((m,i)=>`<div class="item-row"><span style="${m.hecho?'text-decoration:line-through;opacity:.5':''}">${esc(m.texto)}</span><span><button class="btn btn-sm btn-ghost" onclick="toggleMeta(${i})">${m.hecho?'↺':'✓'}</button> <span class="tag-del" onclick="quitarMeta(${i})">✕</span></span></div>`).join('') || '<div class="muted small">Sin metas aún</div>'}
      <div class="row" style="margin-top:10px"><input id="nuevaMeta" placeholder="Una meta juntos" style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea)"><button class="btn btn-gold btn-sm" onclick="agregarMeta()">Añadir</button></div>
    </div>
    <div class="card">
      <h3>Lista de cosas por hacer juntos</h3>
      ${(p.bucket||[]).map((b,i)=>`<div class="item-row"><span style="${b.hecho?'text-decoration:line-through;opacity:.5':''}">${esc(b.texto)}</span><span><button class="btn btn-sm btn-ghost" onclick="toggleBucket(${i})">${b.hecho?'↺':'✓'}</button> <span class="tag-del" onclick="quitarBucket(${i})">✕</span></span></div>`).join('') || '<div class="muted small">Sin planes aún</div>'}
      <div class="row" style="margin-top:10px"><input id="nuevoBucket" placeholder="Algo que quieren vivir" style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea)"><button class="btn btn-gold btn-sm" onclick="agregarBucket()">Añadir</button></div>
    </div>
    <div class="card">
      <h3>Frasco de recuerdos</h3>
      ${(p.frasco||[]).slice().reverse().map(f=>`<div class="item-row"><span>${esc(f.texto)}<div class="small muted">${new Date(f.fecha).toLocaleDateString('es-ES')}</div></span></div>`).join('') || '<div class="muted small">Aún no hay recuerdos guardados</div>'}
      <div class="row" style="margin-top:10px"><input id="nuevoFrasco" placeholder="Un pequeño momento feliz..." style="flex:1;padding:10px 12px;border-radius:12px;border:1.5px solid var(--linea)"><button class="btn btn-gold btn-sm" onclick="agregarFrasco()">Guardar</button></div>
    </div>`;
}
async function guardarPareja(){
  await saveParejaCampos({
    inicio: document.getElementById('ns-inicio').value || null,
    aniversario: document.getElementById('ns-aniv').value || null,
    cancion: document.getElementById('ns-cancion').value.trim(),
    frase: document.getElementById('ns-frase').value.trim()
  });
  toast('Guardado 💞');
}
async function contador(campo, actual){ await saveParejaCampos({[campo]: actual+1}); renderNosotros(); }
async function reiniciarContador(campo){
  if(!confirm('¿Reiniciar este contador a 0?')) return;
  await saveParejaCampos({[campo]: 0});
  toast('Contador reiniciado');
  renderNosotros();
}
async function reiniciarTodosContadores(){
  if(!confirm('¿Reiniciar besos, abrazos y citas a 0?')) return;
  await saveParejaCampos({besos:0, abrazos:0, citas:0});
  toast('Contadores reiniciados');
  renderNosotros();
}
async function agregarMeta(){
  const v = document.getElementById('nuevaMeta').value.trim(); if(!v) return;
  const p = await getPareja(); const metas=p.metas||[]; metas.push({texto:v,hecho:false});
  await saveParejaCampos({metas}); renderNosotros();
}
async function toggleMeta(i){ const p=await getPareja(); p.metas[i].hecho=!p.metas[i].hecho; await saveParejaCampos({metas:p.metas}); renderNosotros(); }
async function quitarMeta(i){ const p=await getPareja(); p.metas.splice(i,1); await saveParejaCampos({metas:p.metas}); renderNosotros(); }
async function agregarBucket(){
  const v = document.getElementById('nuevoBucket').value.trim(); if(!v) return;
  const p = await getPareja(); const bucket=p.bucket||[]; bucket.push({texto:v,hecho:false});
  await saveParejaCampos({bucket}); renderNosotros();
}
async function toggleBucket(i){ const p=await getPareja(); p.bucket[i].hecho=!p.bucket[i].hecho; await saveParejaCampos({bucket:p.bucket}); renderNosotros(); }
async function quitarBucket(i){ const p=await getPareja(); p.bucket.splice(i,1); await saveParejaCampos({bucket:p.bucket}); renderNosotros(); }
async function agregarFrasco(){
  const v = document.getElementById('nuevoFrasco').value.trim(); if(!v) return;
  const p = await getPareja(); const frasco=p.frasco||[]; frasco.push({texto:v, fecha:new Date().toISOString()});
  await saveParejaCampos({frasco}); renderNosotros();
}

/* ================= CARTAS ================= */
const SOBRES = {
  clasico:  {label:'Clásico 💌', color:'linear-gradient(160deg,#fff,#fdf2f6)'},
  corazon:  {label:'Corazón 💕', color:'linear-gradient(160deg,#fff0f5,#ffd9e6)'},
  floral:   {label:'Floral 🌸', color:'linear-gradient(160deg,#f3fff0,#e3f7d8)'},
  estrellas:{label:'Estrellas ✨', color:'linear-gradient(160deg,#f0edff,#dcd0f2)'},
  dorado:   {label:'Dorado 🌟', color:'linear-gradient(160deg,#fffaf0,#ffe9bf)'},
};
let cartasVista = 'buzon'; // buzon | borradores
async function renderCartas(){
  const main = document.getElementById('main');
  const { data: cartas } = await sb.from('cartas').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:true});
  const now = new Date();
  const todas = cartas||[];
  const borradores = todas.filter(c=>c.borrador && c.autor_id===SESSION.user.id);
  const buzon = todas.filter(c=>!c.borrador);
  main.innerHTML = `
    <div class="card">
      <h2>Escribir una carta</h2>
      <div class="field"><label>Título</label><input id="ct-titulo" placeholder="Para ti..."></div>
      <div class="field"><label>Mensaje</label><textarea id="ct-cuerpo" rows="5" placeholder="Escribe con el corazón..."></textarea></div>
      <div class="field"><label>Sobre</label>
        <select id="ct-sobre">${Object.entries(SOBRES).map(([id,s])=>`<option value="${id}">${s.label}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Sello</label>
        <div class="cat-chip-row">${['💌','💗','🌸','⭐','🕊️','🌙'].map(s=>`<button type="button" class="cat-chip" onclick="document.getElementById('ct-sello').value='${s}'">${s}</button>`).join('')}</div>
        <input type="hidden" id="ct-sello" value="💌">
      </div>
      <div class="field"><label>Canción para acompañar (opcional)</label><input id="ct-cancion-titulo" placeholder="Nombre de la canción"></div>
      <div class="field"><input id="ct-cancion-url" placeholder="Enlace directo .mp3 o de YouTube/Spotify"></div>
      <div class="field"><label>Bloquear hasta (opcional)</label><input type="date" id="ct-fecha"><div class="sub">No se podrá abrir antes de esta fecha.</div></div>
      <div class="field"><label>Programar envío (opcional)</label><input type="datetime-local" id="ct-programada"><div class="sub">Tu pareja no la verá en el buzón hasta esa fecha y hora.</div></div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn btn-outline btn-block" onclick="enviarCarta(true)">Guardar como borrador</button>
        <button class="btn btn-primary btn-block" onclick="enviarCarta(false)">Sellar y enviar 💌</button>
      </div>
    </div>
    <div class="cat-chip-row" style="overflow-x:auto">
      <button class="cat-chip ${cartasVista==='buzon'?'active':''}" onclick="cartasVista='buzon';renderCartas()">💌 Buzón (${buzon.filter(c=>!c.archivada&&!c.eliminada).length})</button>
      <button class="cat-chip ${cartasVista==='enviados'?'active':''}" onclick="cartasVista='enviados';renderCartas()">📤 Enviados</button>
      <button class="cat-chip ${cartasVista==='importantes'?'active':''}" onclick="cartasVista='importantes';renderCartas()">⭐ Importantes</button>
      <button class="cat-chip ${cartasVista==='archivo'?'active':''}" onclick="cartasVista='archivo';renderCartas()">🗄️ Archivo</button>
      <button class="cat-chip ${cartasVista==='papelera'?'active':''}" onclick="cartasVista='papelera';renderCartas()">🗑️ Papelera</button>
      <button class="cat-chip ${cartasVista==='borradores'?'active':''}" onclick="cartasVista='borradores';renderCartas()">📝 Borradores (${borradores.length})</button>
    </div>
    <div id="listaCartas"></div>`;
  const lista = document.getElementById('listaCartas');
  const activas = buzon.filter(c=>!c.archivada && !c.eliminada);
  let items = cartasVista==='borradores' ? borradores
    : cartasVista==='enviados' ? activas.filter(c=>c.autor_id===SESSION.user.id)
    : cartasVista==='importantes' ? activas.filter(c=>c.importante)
    : cartasVista==='archivo' ? buzon.filter(c=>c.archivada && !c.eliminada)
    : cartasVista==='papelera' ? buzon.filter(c=>c.eliminada)
    : activas;
  if(!items.length){
    const msj = {borradores:'No tienes borradores guardados.', enviados:'Aún no has enviado cartas.', importantes:'No has marcado cartas como importantes.', archivo:'El archivo está vacío.', papelera:'La papelera está vacía.'}[cartasVista] || 'Aún no hay cartas. Escribe la primera.';
    lista.innerHTML = `<div class="empty"><span class="ic">💌</span>${msj}</div>`;
    return;
  }
  lista.innerHTML = items.slice().reverse().map(c=>{
    const sobre = SOBRES[c.sobre] || SOBRES.clasico;
    if(cartasVista==='borradores'){
      return `<div class="letter-card" style="background:${sobre.color}"><span class="envelope">📝</span><div class="letter-title">${esc(c.titulo)}</div><p class="small muted" style="white-space:pre-wrap">${esc((c.cuerpo||'').slice(0,120))}${(c.cuerpo||'').length>120?'…':''}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-sm btn-gold" onclick="enviarBorrador('${c.id}')">Enviar ahora 💌</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarCarta('${c.id}')">Eliminar</button>
        </div>
      </div>`;
    }
    const programadaFutura = c.programado_para && new Date(c.programado_para) > now;
    if(programadaFutura && c.autor_id===SESSION.user.id){
      return `<div class="letter-card" style="background:${sobre.color}"><span class="envelope">⏰${sobre.label.split(' ').pop()}</span><div class="letter-title">${esc(c.titulo)}</div><div class="small muted">Programada para llegar el ${new Date(c.programado_para).toLocaleString('es-ES')}</div></div>`;
    }
    const bloqueada = c.fecha_apertura && new Date(c.fecha_apertura) > now && !c.abierta;
    if(bloqueada){
      const dias = Math.ceil((new Date(c.fecha_apertura)-now)/86400000);
      return `<div class="letter-card locked" style="background:${sobre.color}"><span class="envelope">🔒💌</span><div class="letter-title">${esc(c.titulo)}</div><div class="small muted">Se abre en ${dias} día${dias!==1?'s':''} (${new Date(c.fecha_apertura).toLocaleDateString('es-ES')})</div></div>`;
    }
    if(!c.abierta){
      return `<div class="letter-card" style="background:${sobre.color}"><span class="envelope">${sobre.label.split(' ').pop()}</span><div class="letter-title">${esc(c.titulo)}</div><div class="small muted">De ${c.autor_id===SESSION.user.id?'ti':'tu pareja'} · toca para abrir</div><button class="btn btn-sm btn-gold" style="margin-top:8px" onclick="abrirCarta('${c.id}')">Abrir sobre</button></div>`;
    }
    if(cartasVista==='papelera'){
      return `<div class="letter-card" style="background:${sobre.color};opacity:.8"><div class="letter-title">${esc(c.titulo)}</div><div class="small muted">Eliminada</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-sm btn-outline" onclick="restaurarCarta('${c.id}')">↩️ Restaurar</button>
          ${c.autor_id===SESSION.user.id?`<button class="btn btn-sm btn-danger" onclick="eliminarCartaDefinitivo('${c.id}')">Eliminar para siempre</button>`:''}
        </div>
      </div>`;
    }
    return `<div class="letter-card envelope-open" style="background:${sobre.color}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="letter-title">${c.sello||'💌'} ${esc(c.titulo)}</div>
        <div style="display:flex;gap:6px">
          <span onclick="toggleImportanteCarta('${c.id}', ${!c.importante})" style="cursor:pointer">${c.importante?'⭐':'☆'}</span>
          <span onclick="toggleArchivarCarta('${c.id}', ${!c.archivada})" style="cursor:pointer" title="${c.archivada?'Desarchivar':'Archivar'}">${c.archivada?'📤':'🗄️'}</span>
          <span onclick="moverCartaPapelera('${c.id}')" style="cursor:pointer" title="Eliminar">🗑️</span>
        </div>
      </div>
      <p style="white-space:pre-wrap">${esc(c.cuerpo)}</p>
      ${c.cancion_url?`<div style="margin-top:8px">🎵 <b>${esc(c.cancion_titulo||'Canción')}</b><br>${embedMusica({plataforma: c.cancion_url.includes('youtu')?'youtube':(c.cancion_url.includes('spotify')?'spotify':'otro'), url:c.cancion_url})}</div>`:''}
      <div class="small muted" style="margin-top:6px">De ${c.autor_id===SESSION.user.id?'ti':'tu pareja'} · ${new Date(c.created_at).toLocaleDateString('es-ES')}</div></div>`;
  }).join('');
}
async function enviarCarta(comoBorrador){
  const titulo = document.getElementById('ct-titulo').value.trim();
  const cuerpo = document.getElementById('ct-cuerpo').value.trim();
  const sobre = document.getElementById('ct-sobre').value;
  const sello = document.getElementById('ct-sello').value || '💌';
  const cancion_titulo = document.getElementById('ct-cancion-titulo').value.trim() || null;
  const cancion_url = document.getElementById('ct-cancion-url').value.trim() || null;
  const fecha_apertura = document.getElementById('ct-fecha').value || null;
  const programadaInput = document.getElementById('ct-programada').value;
  const programado_para = programadaInput ? new Date(programadaInput).toISOString() : null;
  if(!titulo || !cuerpo){ toast('Completa el título y el mensaje'); return; }
  const { error } = await sb.from('cartas').insert({
    couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, cuerpo,
    fecha_apertura, programado_para, sobre, sello, cancion_titulo, cancion_url,
    borrador: !!comoBorrador, abierta:false, notificada:false
  });
  if(error){ toast('No se pudo guardar'); console.error(error); return; }
  toast(comoBorrador? 'Borrador guardado 📝' : 'Carta enviada 💌');
  cartasVista = comoBorrador ? 'borradores' : 'buzon';
  renderCartas();
  if(!comoBorrador) verificarLogros(true);
}
async function enviarBorrador(id){
  await sb.from('cartas').update({borrador:false, notificada:false}).eq('id', id);
  toast('Carta enviada 💌');
  cartasVista='buzon';
  renderCartas();
  verificarLogros(true);
}
async function eliminarCarta(id){
  if(!confirm('¿Eliminar este borrador?')) return;
  await sb.from('cartas').delete().eq('id', id);
  renderCartas();
}
async function toggleImportanteCarta(id, importante){ await sb.from('cartas').update({importante}).eq('id', id); renderCartas(); }
async function toggleArchivarCarta(id, archivada){ await sb.from('cartas').update({archivada}).eq('id', id); renderCartas(); }
async function moverCartaPapelera(id){ await sb.from('cartas').update({eliminada:true}).eq('id', id); toast('Movida a la papelera 🗑️'); renderCartas(); }
async function restaurarCarta(id){ await sb.from('cartas').update({eliminada:false}).eq('id', id); toast('Carta restaurada 💌'); renderCartas(); }
async function eliminarCartaDefinitivo(id){
  if(!confirm('Esto elimina la carta para siempre. ¿Continuar?')) return;
  await sb.from('cartas').delete().eq('id', id);
  renderCartas();
}
async function abrirCarta(id){
  await sb.from('cartas').update({abierta:true}).eq('id', id);
  if(typeof reproducirSonido==='function') reproducirSonido('cartas');
  renderCartas();
}

/* ================= CREAR (dibujos + escritura a mano) ================= */
const PLANTILLAS_TARJETA = {
  clasica:  {label:'Clásica', bg:'linear-gradient(135deg,#ffe4ef,#ffd0e0)'},
  corazones:{label:'Corazones', bg:'linear-gradient(135deg,#ffd6e0,#ffb8cf)'},
  lila:     {label:'Lila', bg:'linear-gradient(135deg,#e6d8fb,#d4bdf5)'},
  dorada:   {label:'Dorada', bg:'linear-gradient(135deg,#fff2d6,#ffe2a0)'},
  cumpleanos:{label:'🎂 Cumpleaños', bg:'linear-gradient(135deg,#ffe0f0,#ffd08a)', sello:'🎉'},
  navidad:  {label:'🎄 Navidad', bg:'linear-gradient(135deg,#d6f5e0,#ffb8b8)', sello:'🎄'},
  anoNuevo: {label:'🎆 Año Nuevo', bg:'linear-gradient(135deg,#2c2a4a,#5b4b8a)', sello:'🎆', textoClaro:true},
  sanValentin:{label:'💘 San Valentín', bg:'linear-gradient(135deg,#ffb3c6,#ff6f91)', sello:'💘'},
};
function renderCrear(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs"><button data-c="dibujo" class="active">Dibujo</button><button data-c="mano">Escritura a mano</button><button data-c="firma">Firma</button><button data-c="tarjeta">Tarjeta romántica</button></div>
    <div class="card" id="crearCanvasCard">
      <div class="tool-row" id="crearTools"></div>
      <div class="canvas-wrap"><canvas id="crearCanvas" height="320"></canvas></div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-outline" onclick="limpiarCanvas()">Borrar todo</button>
        <button class="btn btn-primary" style="flex:1" id="btnGuardarDibujo" onclick="guardarDibujo()">Guardar en el álbum 🖼️</button>
      </div>
    </div>
    <div class="card" id="presetsCard" style="display:none"><h3>Mensajes prediseñados</h3><div id="presetChips"></div></div>
    <div class="card" id="tarjetaCard" style="display:none">
      <h3>💌 Tarjeta romántica</h3>
      <div class="field"><label>Plantilla</label>
        <select id="tarjetaPlantilla">${Object.entries(PLANTILLAS_TARJETA).map(([id,p])=>`<option value="${id}">${p.label}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Mensaje</label><textarea id="tarjetaTexto" rows="3" placeholder="Escribe tu mensaje romántico..."></textarea></div>
      <div id="tarjetaPreview" style="border-radius:16px;padding:36px 20px;text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;min-height:160px;display:flex;align-items:center;justify-content:center"></div>
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="guardarTarjetaRomantica()">Guardar en el álbum 💌</button>
    </div>`;
  main.querySelectorAll('.subtabs button').forEach(b=>b.onclick=()=>{
    main.querySelectorAll('.subtabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const modo = b.dataset.c;
    document.getElementById('presetsCard').style.display = modo==='mano' ? 'block':'none';
    document.getElementById('crearCanvasCard').style.display = modo==='tarjeta' ? 'none':'block';
    document.getElementById('tarjetaCard').style.display = modo==='tarjeta' ? 'block':'none';
    document.getElementById('btnGuardarDibujo').textContent = modo==='firma' ? 'Guardar mi firma ✍️' : 'Guardar en el álbum 🖼️';
    crearModo = modo;
    if(modo==='tarjeta'){ pintarPreviewTarjeta(); }
    else initCanvas();
  });
  document.getElementById('presetChips').innerHTML = MENSAJES_MANO.map(m=>`<span class="chip" style="cursor:pointer" onclick="escribirPreset('${esc(m)}')">${m}</span>`).join('');
  document.getElementById('tarjetaPlantilla').addEventListener('change', pintarPreviewTarjeta);
  document.getElementById('tarjetaTexto').addEventListener('input', pintarPreviewTarjeta);
  crearModo = 'dibujo';
  initCanvas();
}
function pintarPreviewTarjeta(){
  const p = PLANTILLAS_TARJETA[document.getElementById('tarjetaPlantilla').value];
  const texto = document.getElementById('tarjetaTexto').value || 'Escribe tu mensaje romántico...';
  const prev = document.getElementById('tarjetaPreview');
  prev.style.background = p.bg;
  prev.style.color = '#4a3550';
  prev.textContent = texto;
}
async function guardarTarjetaRomantica(){
  const plantilla = document.getElementById('tarjetaPlantilla').value;
  const texto = document.getElementById('tarjetaTexto').value.trim();
  if(!texto){ toast('Escribe un mensaje para tu tarjeta'); return; }
  const { error } = await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'tarjeta_romantica', plantilla, texto});
  if(error){ toast('No se pudo guardar la tarjeta'); console.error(error); return; }
  toast('Tarjeta guardada 💌'); switchTab('album');
}
let crearModo = 'dibujo';
let ctx, drawing=false, brushColor='#4a3550', brushSize=4, lastX, lastY;
function initCanvas(){
  const canvas = document.getElementById('crearCanvas');
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth;
  ctx = canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.lineCap='round'; ctx.lineJoin='round';
  const colores = ['#4a3550','#e0729a','#a884e0','#7ab4d6','#d9a655','#5fae7c','#000000'];
  document.getElementById('crearTools').innerHTML = `
    ${colores.map(c=>`<button class="swatch ${c===brushColor?'active':''}" style="background:${c}" data-c="${c}"></button>`).join('')}
    <input type="range" min="2" max="24" value="${brushSize}" id="brushRange" style="width:90px">
    <button class="btn btn-sm btn-outline" data-erase="1">Borrador</button>`;
  document.querySelectorAll('#crearTools .swatch').forEach(s=>s.onclick=()=>{ brushColor=s.dataset.c; erasing=false; document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active')); s.classList.add('active'); });
  document.getElementById('brushRange').oninput=(e)=>brushSize=parseInt(e.target.value);
  document.querySelector('[data-erase]').onclick=()=>{erasing=true;};
  let erasing=false;
  function pos(e){ const r=canvas.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left, y:t.clientY-r.top}; }
  function start(e){ drawing=true; const p=pos(e); lastX=p.x; lastY=p.y; e.preventDefault(); }
  function move(e){ if(!drawing) return; const p=pos(e); ctx.strokeStyle=erasing?'#ffffff':brushColor; ctx.lineWidth=erasing?brushSize*3:brushSize; ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke(); lastX=p.x; lastY=p.y; e.preventDefault(); }
  function end(){ drawing=false; }
  canvas.onmousedown=start; canvas.onmousemove=move; canvas.onmouseup=end; canvas.onmouseleave=end;
  canvas.ontouchstart=start; canvas.ontouchmove=move; canvas.ontouchend=end;
}
function limpiarCanvas(){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); }
function escribirPreset(texto){
  limpiarCanvas(); ctx.fillStyle=brushColor; ctx.font="italic 34px 'Cormorant Garamond', serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(texto, ctx.canvas.width/2, ctx.canvas.height/2);
}
async function guardarDibujo(){
  const btn = document.getElementById('btnGuardarDibujo');
  btn.innerHTML='<span class="spinner"></span>'; btn.disabled=true;
  const dataUrl = ctx.canvas.toDataURL('image/jpeg', 0.75);
  const url = await subirImagen(dataUrl, 'album', crearModo==='firma' ? 'firma' : 'dibujo');
  if(!url){ toast('No se pudo guardar'); btn.disabled=false; btn.textContent='Guardar en el álbum 🖼️'; return; }
  if(crearModo==='firma'){
    const { error } = await sb.from('profiles').update({firma_url:url}).eq('user_id', SESSION.user.id);
    if(error){ toast('No se pudo guardar la firma'); console.error(error); btn.disabled=false; btn.textContent='Guardar mi firma ✍️'; return; }
    await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'firma', img_url:url, texto:'Mi firma'});
    toast('Firma guardada ✍️'); switchTab('avatar'); return;
  }
  const { error } = await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'dibujo', img_url:url, texto:'Un dibujo especial'});
  if(error){ toast('No se pudo guardar'); console.error(error); btn.disabled=false; btn.textContent='Guardar en el álbum 🖼️'; return; }
  toast('Guardado en el álbum 🖼️'); switchTab('album');
}

/* ================= ÁLBUM ================= */
let albumFiltro = { tipo:'todo', carpeta:'todas', favoritos:false, texto:'', orden:'reciente' };
let albumVista = 'grid';
let albumPapelera = false;
let albumModoCollage = false;
let albumSeleccionCollage = new Set();

async function renderAlbum(){
  const [{data:album}, {data:carpetas}] = await Promise.all([
    sb.from('album').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:true}),
    sb.from('album_carpetas').select('*').eq('couple_id', SESSION.coupleId).order('nombre')
  ]);
  window._albumItems = album||[];
  window._albumCarpetas = carpetas||[];
  dibujarAlbum();
}

function dibujarAlbum(){
  const main = document.getElementById('main');
  const items = window._albumItems||[];
  const carpetas = window._albumCarpetas||[];

  const recuerdos = calcularRecuerdosAlbum(items);

  const TIPOS = [['todo','Todo'],['foto','📷 Fotos'],['video','🎬 Videos'],['audio','🎵 Audios'],['dibujo','✏️ Dibujos'],['collage','🧩 Collages'],['firma','✍️ Firmas'],['tarjeta_romantica','💌 Tarjetas']];
  const carpetaActual = albumFiltro.carpeta!=='todas' ? carpetas.find(c=>c.id===albumFiltro.carpeta) : null;

  main.innerHTML = `
    <div class="card">
      <h2>Subir un recuerdo</h2>
      <button class="btn btn-gold btn-block" onclick="abrirCamara()">📸 Usar la cámara</button>
      <p class="small muted" style="text-align:center;margin:8px 0">— o elige un archivo —</p>
      <input type="file" id="albumFile" accept="image/*,video/*,audio/*">
      <div class="field" style="margin-top:10px"><label>Descripción</label><input id="albumCap" placeholder="¿Qué recuerdan de este momento?"></div>
      <div class="field"><label>Etiquetas (separadas por coma)</label><input id="albumTags" placeholder="viaje, playa, aniversario"></div>
      <div class="field"><label>Carpeta</label>
        <select id="albumCarpetaSel">
          <option value="">Sin carpeta</option>
          ${carpetas.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-block" id="btnSubirFoto" onclick="subirAlbumArchivo()">Guardar en el álbum</button>
      <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="crearCarpetaAlbum()">+ Nueva carpeta</button>
    </div>

    ${recuerdos.length ? `<div class="card" style="background:linear-gradient(135deg,rgba(240,219,176,.5),rgba(246,207,224,.4))">
      <h3>✨ Recuerdos de hoy</h3>
      <div class="cat-chip-row" style="overflow-x:auto">
        ${recuerdos.map(r=>`<div class="a-item" style="min-width:90px;width:90px;height:90px;flex:none" onclick="abrirItemAlbum('${r.item.id}')">
          ${r.item.img_url? `<img src="${r.item.img_url}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;background:linear-gradient(135deg,var(--rosa),var(--lila))">🎵</div>`}
          <div class="a-cap">Hace ${r.anios} año${r.anios!==1?'s':''}</div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="card">
      <input id="albumBuscar" placeholder="Buscar por texto o etiqueta..." style="width:100%;padding:11px 14px;border-radius:14px;border:1.5px solid var(--linea);margin-bottom:10px" value="${esc(albumFiltro.texto)}">
      <div class="cat-chip-row">
        ${TIPOS.map(([t,lbl])=>`<button class="cat-chip ${albumFiltro.tipo===t?'active':''}" onclick="albumSetFiltro('tipo','${t}')">${lbl}</button>`).join('')}
      </div>
      <div class="cat-chip-row" style="margin-top:8px">
        <button class="cat-chip ${albumFiltro.favoritos?'active':''}" onclick="albumToggleFavFiltro()">⭐ Favoritos</button>
        <button class="cat-chip ${albumFiltro.carpeta==='todas'?'active':''}" onclick="albumSetFiltro('carpeta','todas')">Todas las carpetas</button>
        ${carpetas.map(c=>`<button class="cat-chip ${albumFiltro.carpeta===c.id?'active':''}" onclick="albumSetFiltro('carpeta','${c.id}')">📁 ${esc(c.nombre)}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
        <select id="albumOrdenSel" onchange="albumFiltro.orden=this.value;pintarAlbumGrid()" style="border-radius:10px;border:1.5px solid var(--linea);padding:6px 10px">
          <option value="reciente" ${albumFiltro.orden==='reciente'?'selected':''}>Más recientes</option>
          <option value="antiguo" ${albumFiltro.orden==='antiguo'?'selected':''}>Más antiguos</option>
          <option value="favoritos" ${albumFiltro.orden==='favoritos'?'selected':''}>Favoritos primero</option>
          <option value="az" ${albumFiltro.orden==='az'?'selected':''}>Alfabético (A-Z)</option>
        </select>
        <button class="btn btn-sm ${albumVista==='grid'?'btn-primary':'btn-outline'}" onclick="albumVista='grid';dibujarAlbum()">▦ Cuadrícula</button>
        <button class="btn btn-sm ${albumVista==='lista'?'btn-primary':'btn-outline'}" onclick="albumVista='lista';dibujarAlbum()">☰ Lista</button>
        <button class="btn btn-sm ${albumPapelera?'btn-primary':'btn-outline'}" onclick="albumPapelera=!albumPapelera;dibujarAlbum()">🗑️ Papelera</button>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-sm ${albumModoCollage?'btn-primary':'btn-outline'}" onclick="toggleModoCollage()">${albumModoCollage? 'Cancelar selección' : '🧩 Crear collage'}</button>
        ${albumModoCollage? `<button class="btn btn-sm btn-gold" onclick="generarCollage()">Hacer collage (${albumSeleccionCollage.size})</button>` : ''}
        <button class="btn btn-sm btn-outline" onclick="iniciarPresentacionAlbum()">🎬 Reproducir presentación</button>
      </div>
      ${carpetaActual ? `<div class="config-item" style="margin-top:10px">
          <div class="config-item-info"><div class="config-item-icon lila">🎞️</div><div><label>Presentación automática</label><div class="sub">Cada ${carpetaActual.intervalo_seg||5}s en "${esc(carpetaActual.nombre)}"</div></div></div>
          <button class="config-toggle ${carpetaActual.presentacion_auto?'on':''}" onclick="toggleCarpetaPresentacionAuto('${carpetaActual.id}',this)"></button>
        </div>
        <div class="field"><label>Segundos por foto</label><input type="number" min="2" max="30" id="carpetaIntervalo" value="${carpetaActual.intervalo_seg||5}" onchange="guardarIntervaloCarpeta('${carpetaActual.id}', this.value)"></div>` : ''}
    </div>

    <div class="section-title">${albumPapelera? '🗑️ Papelera' : 'Su álbum'} (<span id="albumCount"></span>)</div>
    <div class="${albumVista==='lista'?'album-list':'album-grid'}" id="albumGrid"></div>`;

  document.getElementById('albumBuscar').addEventListener('input', (e)=>{ albumFiltro.texto = e.target.value; pintarAlbumGrid(); });
  pintarAlbumGrid();
}

function calcularRecuerdosAlbum(items){
  const hoy = new Date();
  const out = [];
  for(const a of items){
    const d = new Date(a.created_at);
    const anios = hoy.getFullYear() - d.getFullYear();
    if(anios < 1) continue;
    if(d.getMonth()===hoy.getMonth() && d.getDate()===hoy.getDate()){
      out.push({item:a, anios});
    }
  }
  return out;
}

async function toggleCarpetaPresentacionAuto(id, btn){
  const carpetas = window._albumCarpetas||[];
  const c = carpetas.find(x=>x.id===id);
  const nuevo = !(c?.presentacion_auto);
  btn.classList.toggle('on', nuevo);
  await sb.from('album_carpetas').update({presentacion_auto:nuevo}).eq('id', id);
  if(c) c.presentacion_auto = nuevo;
}
async function guardarIntervaloCarpeta(id, valor){
  const seg = Math.max(2, Math.min(30, parseInt(valor)||5));
  await sb.from('album_carpetas').update({intervalo_seg:seg}).eq('id', id);
  const c = (window._albumCarpetas||[]).find(x=>x.id===id);
  if(c) c.intervalo_seg = seg;
}

let _presentacionTimer = null;
function iniciarPresentacionAlbum(){
  const fotos = filtrarAlbum().filter(a=>a.img_url);
  if(!fotos.length){ toast('No hay fotos para mostrar con estos filtros'); return; }
  let idx = 0;
  const carpetaActual = albumFiltro.carpeta!=='todas' ? (window._albumCarpetas||[]).find(c=>c.id===albumFiltro.carpeta) : null;
  const intervaloMs = ((carpetaActual?.intervalo_seg)||5)*1000;
  const overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:#000;z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <button style="position:absolute;top:16px;right:18px;background:none;border:none;color:#fff;font-size:26px;cursor:pointer" onclick="pararPresentacionAlbum()">✕</button>
    <img id="presentacionImg" style="max-width:92%;max-height:75vh;border-radius:14px;object-fit:contain" src="${fotos[0].img_url}">
    <div id="presentacionCap" style="color:#fff;margin-top:14px;text-align:center;padding:0 20px">${esc(fotos[0].texto||'')}</div>
    <div style="display:flex;gap:14px;margin-top:20px">
      <button class="btn btn-sm btn-outline" style="color:#fff;border-color:#fff" onclick="presentacionPaso(-1)">◀</button>
      <button class="btn btn-sm btn-outline" style="color:#fff;border-color:#fff" onclick="presentacionPaso(1)">▶</button>
    </div>`;
  document.body.appendChild(overlay);
  window._presentacionFotos = fotos;
  window._presentacionIdx = 0;
  _presentacionTimer = setInterval(()=>presentacionPaso(1), intervaloMs);
}
function presentacionPaso(dir){
  const fotos = window._presentacionFotos||[];
  if(!fotos.length) return;
  window._presentacionIdx = (window._presentacionIdx + dir + fotos.length) % fotos.length;
  const f = fotos[window._presentacionIdx];
  const img = document.getElementById('presentacionImg');
  const cap = document.getElementById('presentacionCap');
  if(img) img.src = f.img_url;
  if(cap) cap.textContent = f.texto||'';
}
function pararPresentacionAlbum(){
  if(_presentacionTimer) clearInterval(_presentacionTimer);
  _presentacionTimer = null;
  const overlay = document.querySelector('body > div[style*="position:fixed;inset:0;background:#000"]');
  if(overlay) overlay.remove();
}

function albumSetFiltro(campo, valor){ albumFiltro[campo] = valor; dibujarAlbum(); }
function albumToggleFavFiltro(){ albumFiltro.favoritos = !albumFiltro.favoritos; dibujarAlbum(); }

function filtrarAlbum(){
  const items = window._albumItems||[];
  let out = items.filter(a=>{
    if(albumPapelera) { if(!a.eliminado) return false; }
    else { if(a.eliminado) return false; }
    if(albumFiltro.tipo!=='todo' && a.tipo!==albumFiltro.tipo) return false;
    if(albumFiltro.favoritos && !a.favorito) return false;
    if(albumFiltro.carpeta!=='todas' && a.carpeta_id!==albumFiltro.carpeta) return false;
    if(albumFiltro.texto){
      const q = albumFiltro.texto.toLowerCase();
      const enTexto = (a.texto||'').toLowerCase().includes(q);
      const enTags = (a.etiquetas||[]).some(t=>(t||'').toLowerCase().includes(q));
      if(!enTexto && !enTags) return false;
    }
    return true;
  });
  if(albumFiltro.orden==='antiguo') out = out.slice().sort((a,b)=> new Date(a.created_at)-new Date(b.created_at));
  else if(albumFiltro.orden==='favoritos') out = out.slice().sort((a,b)=> (b.favorito===a.favorito?0:b.favorito?1:-1));
  else if(albumFiltro.orden==='az') out = out.slice().sort((a,b)=> (a.texto||'').localeCompare(b.texto||''));
  else out = out.slice().sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  return out;
}

function pintarAlbumGrid(){
  const filtrados = filtrarAlbum();
  const countEl = document.getElementById('albumCount');
  if(countEl) countEl.textContent = filtrados.length;
  const grid = document.getElementById('albumGrid');
  if(!filtrados.length){ grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><span class="ic">🖼️</span>${albumPapelera?'La papelera está vacía.':'No hay recuerdos con estos filtros.'}</div>`; return; }
  if(albumVista==='lista'){
    grid.innerHTML = filtrados.map(a=>{
      const miniatura = a.tipo==='video' ? (a.thumb_url||a.img_url) : (a.tipo==='audio'||a.tipo==='tarjeta_romantica' ? null : a.img_url);
      return `<div class="card" style="display:flex;align-items:center;gap:12px">
        <div style="width:56px;height:56px;border-radius:10px;overflow:hidden;flex:none;background:linear-gradient(135deg,var(--rosa),var(--lila));display:flex;align-items:center;justify-content:center" onclick="${albumPapelera?'':`abrirItemAlbum('${a.id}')`}">
          ${miniatura?`<img src="${miniatura}" style="width:100%;height:100%;object-fit:cover">`:'🎵'}
        </div>
        <div style="flex:1;min-width:0" onclick="${albumPapelera?'':`abrirItemAlbum('${a.id}')`}">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.texto||'(sin descripción)')}</div>
          <div class="small muted">${new Date(a.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}${a.favorito?' · ⭐':''}</div>
        </div>
        ${albumPapelera ? `<button class="btn btn-sm btn-outline" onclick="restaurarAlbumItem('${a.id}')">↩️</button><button class="btn btn-sm" onclick="borrarAlbumPermanente('${a.id}')">🗑️</button>`
          : `<button class="btn btn-sm btn-outline" onclick="moverAlbumPapelera('${a.id}')">🗑️</button>`}
      </div>`;
    }).join('');
    return;
  }
  grid.innerHTML = filtrados.map(a=>{
    const seleccionado = albumSeleccionCollage.has(a.id);
    const miniatura = a.tipo==='video' ? (a.thumb_url||a.img_url) : (a.tipo==='audio'||a.tipo==='tarjeta_romantica' ? null : a.img_url);
    const badge = a.tipo==='video' ? '▶️' : (a.tipo==='audio' ? '🎵' : (a.tipo==='tarjeta_romantica' ? '💌' : (a.tipo==='firma' ? '✍️' : '')));
    const clickFn = albumPapelera ? '' : (albumModoCollage ? `toggleSeleccionCollage('${a.id}')` : `abrirItemAlbum('${a.id}')`);
    const tarjetaBg = a.tipo==='tarjeta_romantica' ? (PLANTILLAS_TARJETA[a.plantilla]?.bg || PLANTILLAS_TARJETA.clasica.bg) : null;
    return `<div class="a-item" style="${seleccionado?'outline:3px solid var(--dorado)':''}" onclick="${clickFn}">
      ${miniatura ? `<img src="${miniatura}" loading="lazy">` : tarjetaBg ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:6px;text-align:center;font-family:'Cormorant Garamond',serif;font-size:12px;background:${tarjetaBg};color:#4a3550">${esc((a.texto||'').slice(0,60))}</div>` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;background:linear-gradient(135deg,var(--rosa),var(--lila))">🎵</div>`}
      ${badge? `<div style="position:absolute;top:4px;right:4px;font-size:12px;background:rgba(0,0,0,.45);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center">${badge}</div>`:''}
      ${a.favorito? `<div style="position:absolute;top:4px;left:4px;font-size:13px">⭐</div>`:''}
      ${albumPapelera ? `<div style="position:absolute;bottom:4px;right:4px;display:flex;gap:4px">
          <button onclick="event.stopPropagation();restaurarAlbumItem('${a.id}')" style="border:none;background:rgba(0,0,0,.55);color:#fff;border-radius:8px;width:24px;height:24px;font-size:12px">↩️</button>
          <button onclick="event.stopPropagation();borrarAlbumPermanente('${a.id}')" style="border:none;background:rgba(0,0,0,.55);color:#fff;border-radius:8px;width:24px;height:24px;font-size:12px">🗑️</button>
        </div>` : !albumModoCollage ? `<button onclick="event.stopPropagation();moverAlbumPapelera('${a.id}')" style="position:absolute;bottom:4px;right:4px;border:none;background:rgba(0,0,0,.45);color:#fff;border-radius:8px;width:24px;height:24px;font-size:12px">🗑️</button>` : ''}
      <div class="a-cap">${esc(a.texto||'')}</div>
    </div>`;
  }).join('');
}

function toggleModoCollage(){ albumModoCollage = !albumModoCollage; if(!albumModoCollage) albumSeleccionCollage.clear(); dibujarAlbum(); }
function toggleSeleccionCollage(id){
  if(albumSeleccionCollage.has(id)) albumSeleccionCollage.delete(id); else albumSeleccionCollage.add(id);
  dibujarAlbum();
}
async function moverAlbumPapelera(id){
  await sb.from('album').update({eliminado:true, eliminado_at:new Date().toISOString()}).eq('id', id);
  const item = (window._albumItems||[]).find(a=>a.id===id); if(item){ item.eliminado=true; }
  toast('Movido a la papelera 🗑️'); pintarAlbumGrid();
}
async function restaurarAlbumItem(id){
  await sb.from('album').update({eliminado:false, eliminado_at:null}).eq('id', id);
  const item = (window._albumItems||[]).find(a=>a.id===id); if(item){ item.eliminado=false; }
  toast('Recuerdo restaurado 💗'); pintarAlbumGrid();
}
async function borrarAlbumPermanente(id){
  await sb.from('album').delete().eq('id', id);
  window._albumItems = (window._albumItems||[]).filter(a=>a.id!==id);
  toast('Eliminado permanentemente'); pintarAlbumGrid();
}

async function crearCarpetaAlbum(){
  const nombre = prompt('Nombre de la nueva carpeta:');
  if(!nombre || !nombre.trim()) return;
  const { error } = await sb.from('album_carpetas').insert({couple_id:SESSION.coupleId, nombre:nombre.trim()});
  if(error){ toast('No se pudo crear la carpeta'); console.error(error); return; }
  toast('Carpeta creada 📁');
  renderAlbum();
}

function generarThumbVideo(file){
  return new Promise((resolve)=>{
    const video = document.createElement('video');
    video.preload='metadata'; video.muted=true; video.playsInline=true;
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = ()=>{ video.currentTime = Math.min(0.5, (video.duration||1)/2); };
    video.onseeked = ()=>{
      try{
        const maxW=480, scale=Math.min(1, maxW/video.videoWidth);
        const c=document.createElement('canvas'); c.width=video.videoWidth*scale; c.height=video.videoHeight*scale;
        c.getContext('2d').drawImage(video,0,0,c.width,c.height);
        resolve({ dataUrl:c.toDataURL('image/jpeg',0.7), duracion:Math.round(video.duration||0) });
      }catch(e){ resolve({dataUrl:null, duracion:Math.round(video.duration||0)}); }
      URL.revokeObjectURL(video.src);
    };
    video.onerror = ()=> resolve({dataUrl:null, duracion:null});
  });
}
function obtenerDuracionAudio(file){
  return new Promise((resolve)=>{
    const audio = new Audio();
    audio.preload='metadata';
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = ()=>{ const d=Math.round(audio.duration||0); URL.revokeObjectURL(audio.src); resolve(d); };
    audio.onerror = ()=> resolve(null);
  });
}
async function subirBlobDirecto(blob, carpeta, nombreArchivo, ext, contentType){
  const path = `${SESSION.coupleId}/${carpeta}/${nombreArchivo}-${uid()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType, upsert:true });
  if(error){ console.error(error); return null; }
  const { data } = sb.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

async function subirAlbumArchivo(){
  const file = document.getElementById('albumFile').files[0];
  const cap = document.getElementById('albumCap').value.trim();
  const tagsRaw = (document.getElementById('albumTags')||{}).value || '';
  const etiquetas = tagsRaw.trim() ? tagsRaw.split(',').map(t=>t.trim()).filter(Boolean) : [];
  const carpetaSel = document.getElementById('albumCarpetaSel');
  const carpetaId = carpetaSel && carpetaSel.value ? carpetaSel.value : null;
  if(!file){ toast('Elige un archivo primero'); return; }
  const btn = document.getElementById('btnSubirFoto');
  btn.innerHTML='<span class="spinner"></span>'; btn.disabled=true;
  try{
    let tipo, url, thumb_url=null, duracion_seg=null;
    if(file.type.startsWith('image/')){
      tipo='foto';
      const dataUrl = await new Promise((res)=>{
        const reader=new FileReader();
        reader.onload=(e)=>{
          const img=new Image();
          img.onload=()=>{
            const maxW=900, scale=Math.min(1,maxW/img.width);
            const c=document.createElement('canvas'); c.width=img.width*scale; c.height=img.height*scale;
            c.getContext('2d').drawImage(img,0,0,c.width,c.height);
            res(c.toDataURL('image/jpeg',0.65));
          };
          img.src=e.target.result;
        };
        reader.readAsDataURL(file);
      });
      url = await subirImagen(dataUrl, 'album', 'foto');
    } else if(file.type.startsWith('video/')){
      tipo='video';
      const thumb = await generarThumbVideo(file);
      duracion_seg = thumb.duracion;
      if(thumb.dataUrl) thumb_url = await subirImagen(thumb.dataUrl, 'album', 'video-thumb');
      url = await subirBlobDirecto(file, 'album', 'video', (file.name.split('.').pop()||'mp4'), file.type||'video/mp4');
    } else if(file.type.startsWith('audio/')){
      tipo='audio';
      duracion_seg = await obtenerDuracionAudio(file);
      url = await subirBlobDirecto(file, 'album', 'audio', (file.name.split('.').pop()||'mp3'), file.type||'audio/mpeg');
    } else {
      toast('Formato no soportado'); btn.disabled=false; btn.textContent='Guardar en el álbum'; return;
    }
    if(!url){ toast('No se pudo subir el archivo'); btn.disabled=false; btn.textContent='Guardar en el álbum'; return; }
    const { error } = await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, img_url:url, thumb_url, duracion_seg, mime_type:file.type, texto:cap, etiquetas, carpeta_id:carpetaId});
    if(error){ toast('No se pudo guardar'); console.error(error); btn.disabled=false; btn.textContent='Guardar en el álbum'; return; }
    toast('Guardado en el álbum 💗');
    renderAlbum();
    verificarLogros(true);
  } catch(err){
    console.error(err); toast('Ocurrió un error al subir'); btn.disabled=false; btn.textContent='Guardar en el álbum';
  }
}

async function generarCollage(){
  if(albumSeleccionCollage.size<2){ toast('Elige al menos 2 fotos'); return; }
  const items = (window._albumItems||[]).filter(a=>albumSeleccionCollage.has(a.id) && a.img_url && a.tipo!=='audio');
  if(items.length<2){ toast('Elige al menos 2 fotos'); return; }
  toast('Creando collage...');
  const imgs = await Promise.all(items.map(a=>new Promise((res)=>{
    const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>res(img); img.onerror=()=>res(null);
    img.src = a.tipo==='video' ? (a.thumb_url||a.img_url) : a.img_url;
  })));
  const validas = imgs.filter(Boolean);
  if(validas.length<2){ toast('No se pudo cargar alguna imagen'); return; }
  const cols = validas.length<=2 ? validas.length : (validas.length<=4 ? 2 : 3);
  const rows = Math.ceil(validas.length/cols);
  const cellSize = 320;
  const c = document.createElement('canvas'); c.width=cellSize*cols; c.height=cellSize*rows;
  const cx = c.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,c.width,c.height);
  validas.forEach((img,i)=>{
    const x=(i%cols)*cellSize, y=Math.floor(i/cols)*cellSize;
    const scale = Math.max(cellSize/img.width, cellSize/img.height);
    const w=img.width*scale, h=img.height*scale;
    cx.save(); cx.beginPath(); cx.rect(x,y,cellSize,cellSize); cx.clip();
    cx.drawImage(img, x+(cellSize-w)/2, y+(cellSize-h)/2, w, h);
    cx.restore();
  });
  let dataUrl;
  try{ dataUrl = c.toDataURL('image/jpeg',0.8); }
  catch(e){ toast('No se pudo generar el collage (imágenes externas)'); return; }
  const url = await subirImagen(dataUrl, 'album', 'collage');
  if(!url){ toast('No se pudo guardar el collage'); return; }
  const { error } = await sb.from('album').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'collage', img_url:url, texto:'Un collage de recuerdos'});
  if(error){ toast('No se pudo guardar'); console.error(error); return; }
  toast('Collage creado 🧩');
  albumModoCollage=false; albumSeleccionCollage.clear();
  renderAlbum();
}

async function abrirItemAlbum(id){
  const a = (window._albumItems||[]).find(x=>x.id===id);
  if(!a) return;
  sb.from('album').update({vistas:(a.vistas||0)+1}).eq('id', id).then(()=>{ a.vistas=(a.vistas||0)+1; });
  const [{data:comentarios}, {data:reacciones}] = await Promise.all([
    sb.from('album_comentarios').select('*').eq('album_id', id).order('created_at',{ascending:true}),
    sb.from('album_reacciones').select('*').eq('album_id', id)
  ]);
  const misReaccion = (reacciones||[]).find(r=>r.autor_id===SESSION.user.id);
  const conteo = {};
  (reacciones||[]).forEach(r=>{ conteo[r.emoji]=(conteo[r.emoji]||0)+1; });
  const EMOJIS = ['❤️','😂','😮','😢','👏','🔥'];

  cerrarModalAlbum();
  const overlay = document.createElement('div');
  overlay.id = 'albumModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(30,20,30,.75);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px 22px 0 0;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:18px;position:relative">
      <button onclick="cerrarModalAlbum()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <div style="border-radius:16px;overflow:hidden;margin-bottom:12px;background:#000">
        ${a.tipo==='video' ? `<video src="${a.img_url}" controls style="width:100%;max-height:340px;display:block"></video>` :
          a.tipo==='audio' ? `<div style="padding:30px 16px;background:linear-gradient(135deg,var(--rosa),var(--lila));text-align:center"><div style="font-size:40px">🎵</div><audio src="${a.img_url}" controls style="width:100%;margin-top:10px"></audio></div>` :
          a.tipo==='tarjeta_romantica' ? `<div style="padding:40px 22px;text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;background:${(PLANTILLAS_TARJETA[a.plantilla]||PLANTILLAS_TARJETA.clasica).bg};color:${(PLANTILLAS_TARJETA[a.plantilla]||{}).textoClaro?'#fff':'#4a3550'}">${(PLANTILLAS_TARJETA[a.plantilla]||{}).sello||'💌'}<br>${esc(a.texto||'')}</div>` :
          `<img src="${a.img_url}" style="width:100%;max-height:340px;object-fit:contain;display:block;background:#000">` }
      </div>
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div style="flex:1"><div style="font-weight:700">${esc(a.texto||'Un recuerdo especial')}</div>
        <div class="muted small">${new Date(a.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div></div>
        <button class="icon-btn" onclick="toggleFavoritoAlbum('${a.id}', ${!a.favorito})" title="Favorito">${a.favorito?'⭐':'☆'}</button>
      </div>
      ${(a.etiquetas&&a.etiquetas.length)? `<div style="margin-top:8px">${a.etiquetas.map(t=>`<span class="chip">#${esc(t)}</span>`).join('')}</div>`:''}
      <div class="cat-chip-row" style="margin-top:8px;overflow-x:auto">
        <span class="small muted" style="align-self:center;margin-right:4px">Emoción:</span>
        ${['🥰','😊','😢','😤','😴','🥺'].map(e=>`<button class="cat-chip ${a.emocion===e?'active':''}" onclick="etiquetarEmocionAlbum('${a.id}','${e}')">${e}</button>`).join('')}
        ${a.emocion?`<button class="cat-chip" onclick="etiquetarEmocionAlbum('${a.id}','')">✕</button>`:''}
      </div>
      <div class="row" style="margin-top:12px;gap:6px;flex-wrap:wrap">
        ${EMOJIS.map(e=>`<button class="btn btn-sm ${misReaccion&&misReaccion.emoji===e?'btn-gold':'btn-outline'}" onclick="reaccionarAlbum('${a.id}','${e}')">${e} ${conteo[e]||''}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-outline" onclick="compartirAlbum('${a.id}')">↗ Compartir</button>
        <button class="btn btn-sm btn-outline" onclick="moverCarpetaAlbum('${a.id}')">📁 Mover</button>
        <button class="btn btn-sm btn-ghost" style="color:#c0527a" onclick="eliminarItemAlbum('${a.id}')">🗑 Eliminar</button>
      </div>
      <div class="section-title">Comentarios</div>
      <div id="albumComentariosList" style="display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto">
        ${(comentarios||[]).map(c=>`<div style="background:var(--superficie);border:1px solid var(--linea);border-radius:12px;padding:8px 10px;font-size:13px">${esc(c.texto)}<div class="muted" style="font-size:10px;margin-top:2px">${new Date(c.created_at).toLocaleString('es-ES')}</div></div>`).join('') || '<div class="muted small">Sé el primero en comentar 💬</div>'}
      </div>
      <div class="row" style="margin-top:8px">
        <input id="albumComentarioInput" placeholder="Escribe un comentario..." style="flex:1;padding:10px 14px;border-radius:14px;border:1.5px solid var(--linea)">
        <button class="btn btn-primary btn-sm" onclick="comentarAlbum('${a.id}')">Enviar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
function cerrarModalAlbum(){ const o=document.getElementById('albumModalOverlay'); if(o) o.remove(); }
async function etiquetarEmocionAlbum(id, emocion){
  await sb.from('album').update({emocion}).eq('id', id);
  const item = (window._albumItems||[]).find(x=>x.id===id); if(item) item.emocion = emocion;
  abrirItemAlbum(id);
}

async function toggleFavoritoAlbum(id, valor){
  const { error } = await sb.from('album').update({favorito:valor}).eq('id', id);
  if(error){ toast('No se pudo actualizar'); console.error(error); return; }
  await renderAlbum();
  abrirItemAlbum(id);
}
async function reaccionarAlbum(id, emoji){
  const { data: existente } = await sb.from('album_reacciones').select('*').eq('album_id', id).eq('autor_id', SESSION.user.id).maybeSingle();
  if(existente && existente.emoji===emoji){
    await sb.from('album_reacciones').delete().eq('id', existente.id);
  } else if(existente){
    await sb.from('album_reacciones').update({emoji}).eq('id', existente.id);
  } else {
    await sb.from('album_reacciones').insert({album_id:id, autor_id:SESSION.user.id, emoji});
  }
  abrirItemAlbum(id);
}
async function comentarAlbum(id){
  const input = document.getElementById('albumComentarioInput');
  const texto = input.value.trim();
  if(!texto) return;
  input.value='';
  const { error } = await sb.from('album_comentarios').insert({album_id:id, autor_id:SESSION.user.id, texto});
  if(error){ toast('No se pudo enviar el comentario'); console.error(error); return; }
  abrirItemAlbum(id);
}
async function moverCarpetaAlbum(id){
  const carpetas = window._albumCarpetas||[];
  if(!carpetas.length){ toast('Primero crea una carpeta desde el álbum'); return; }
  const opciones = carpetas.map((c,i)=>`${i+1}. ${c.nombre}`).join('\n');
  const resp = prompt(`¿A qué carpeta quieres mover este recuerdo?\n0. Sin carpeta\n${opciones}`);
  if(resp===null) return;
  const idx = parseInt(resp,10);
  if(isNaN(idx)) return;
  const carpetaId = idx===0 ? null : (carpetas[idx-1] ? carpetas[idx-1].id : null);
  await sb.from('album').update({carpeta_id:carpetaId}).eq('id', id);
  cerrarModalAlbum();
  renderAlbum();
}
async function eliminarItemAlbum(id){
  if(!confirm('¿Eliminar este elemento del álbum?')) return;
  await sb.from('album').delete().eq('id', id);
  cerrarModalAlbum();
  renderAlbum();
}
async function compartirAlbum(id){
  const a = (window._albumItems||[]).find(x=>x.id===id);
  if(!a) return;
  try{
    if(navigator.share){
      if(a.img_url && a.tipo!=='audio' && navigator.canShare){
        try{
          const resp = await fetch(a.img_url);
          const blob = await resp.blob();
          const file = new File([blob], 'recuerdo.jpg', {type:blob.type||'image/jpeg'});
          if(navigator.canShare({files:[file]})){
            await navigator.share({files:[file], text: a.texto||'Un recuerdo de Notre petit monde'});
            return;
          }
        }catch(e){ /* sigue con el share sin archivo */ }
      }
      await navigator.share({title:'Notre petit monde', text: a.texto||'Un recuerdo especial', url:a.img_url});
    } else if(navigator.clipboard){
      await navigator.clipboard.writeText(a.img_url);
      toast('Enlace copiado 📋');
    }
  }catch(err){ console.error(err); }
}

/* ================= CALENDARIO ================= */
const HITOS_SUGERIDOS = [
  {icono:'💋', titulo:'Primer beso'},{icono:'💑', titulo:'Primera cita'},{icono:'📸', titulo:'Primera foto juntos'},
  {icono:'✈️', titulo:'Primer viaje'},{icono:'💞', titulo:'Fecha en que se conocieron'},{icono:'💍', titulo:'Fecha de compromiso'},
];
