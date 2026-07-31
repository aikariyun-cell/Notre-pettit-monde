async function renderCalendario(){
  const main = document.getElementById('main');
  const { data: cal } = await sb.from('calendario').select('*').eq('couple_id', SESSION.coupleId).order('fecha',{ascending:true});
  const items = cal||[];
  const hitos = items.filter(e=>e.tipo==='hito');
  const eventos = items.filter(e=>e.tipo!=='hito');
  const hoy = new Date();
  main.innerHTML = `
    <div class="card">
      <h2>💫 Calendario inteligente</h2>
      <p class="muted small">Guarden las fechas más importantes de su historia.</p>
      <div class="cat-chip-row" style="overflow-x:auto">${HITOS_SUGERIDOS.map(h=>`<button class="cat-chip" onclick="prepararHito('${jsAttr(h.titulo)}', '${jsAttr(h.icono)}')">${h.icono} ${h.titulo}</button>`).join('')}</div>
      <div class="grid2" style="margin-top:8px">
        <div class="field"><label>Título del hito</label><input id="hitoTitulo" placeholder="Ej. Primer beso"></div>
        <div class="field"><label>Fecha</label><input type="date" id="hitoFecha"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Modo</label>
          <select id="hitoModo">
            <option value="cuenta_regresiva">⏳ Cuenta regresiva (próximo aniversario)</option>
            <option value="cuenta_desde">📈 Cuenta desde (días desde que pasó)</option>
          </select>
        </div>
        <div class="field"><label>Color</label><input type="color" id="hitoColor" value="#eeb1cd" style="height:38px;padding:2px"></div>
      </div>
      <div class="field"><label>Icono personalizado (opcional)</label><input id="hitoIconoCustom" maxlength="2" placeholder="💞"></div>
      <label class="row" style="gap:8px;margin:6px 0"><input type="checkbox" id="hitoRecurrente" checked> <span class="small">Recordarme cada año automáticamente</span></label>
      <button class="btn btn-gold btn-block" onclick="agregarHito()">Guardar fecha importante</button>
    </div>
    ${hitos.length ? `<div class="section-title">Fechas importantes</div>${hitos.map(h=>{
      const d = new Date(h.fecha+'T00:00:00');
      const anios = hoy.getFullYear()-d.getFullYear();
      const diasDesde = Math.floor((hoy-d)/86400000);
      const prox = new Date(hoy.getFullYear() + (new Date(hoy.getFullYear(),d.getMonth(),d.getDate())<hoy?1:0), d.getMonth(), d.getDate());
      const diasFaltan = Math.ceil((prox-hoy)/86400000);
      const icono = h.icono_personalizado || h.icono || '💞';
      const borde = h.color ? `border-left:5px solid ${h.color}` : '';
      return `<div class="card" style="${borde}"><div style="display:flex;justify-content:space-between;align-items:center"><div><b>${icono} ${esc(h.titulo)}</b><div class="small muted">${d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})} · hace ${anios} año${anios!==1?'s':''}</div>${h.modo==='cuenta_desde' ? `<div class="small" style="color:var(--rosa-int)">📈 Llevan ${diasDesde} día${diasDesde!==1?'s':''} desde entonces</div>` : (h.recurrente?`<div class="small" style="color:var(--rosa-int)">🔔 Próximo aniversario en ${diasFaltan} día${diasFaltan!==1?'s':''}</div>`:'')}</div><span class="tag-del" onclick="quitarEvento('${h.id}')">✕</span></div></div>`;
    }).join('')}` : ''}
    <div class="card">
      <h2>Agregar evento</h2>
      <div class="grid2">
        <div class="field"><label>Fecha</label><input type="date" id="cl-fecha"></div>
        <div class="field"><label>Estado</label><select id="cl-estado"><option>🟢 Libre</option><option>🟡 Ocupado</option><option>🔴 No disponible</option></select></div>
      </div>
      <div class="field"><label>Título</label><input id="cl-titulo" placeholder="Cita, cumpleaños, salida..."></div>
      <button class="btn btn-primary btn-block" onclick="agregarEvento()">Agregar al calendario</button>
    </div>
    <div class="section-title">Eventos</div>
    <div class="card" id="listaEventos"></div>`;
  const lista = document.getElementById('listaEventos');
  if(!eventos.length){ lista.innerHTML = `<div class="empty small">Sin eventos por ahora.</div>`; return; }
  lista.innerHTML = eventos.map(e=>{
    const color = (e.estado||'').includes('🔴')?'#e07a7a':(e.estado||'').includes('🟡')?'#d9a655':'#8fbf9f';
    return `<div class="cal-item"><div class="cal-date"><b>${new Date(e.fecha).getDate()}</b><span>${new Date(e.fecha).toLocaleDateString('es-ES',{month:'short'})}</span></div>
    <div style="flex:1"><b>${esc(e.titulo)}</b><div class="small muted"><span class="status-dot" style="background:${color}"></span>${e.estado||''}</div></div>
    <span class="tag-del" onclick="quitarEvento('${e.id}')">✕</span></div>`;
  }).join('');
}
function prepararHito(titulo, icono){
  document.getElementById('hitoTitulo').value = titulo;
  window._hitoIcono = icono;
}
async function agregarHito(){
  const titulo = document.getElementById('hitoTitulo').value.trim();
  const fecha = document.getElementById('hitoFecha').value;
  const recurrente = document.getElementById('hitoRecurrente').checked;
  const modo = document.getElementById('hitoModo').value;
  const color = document.getElementById('hitoColor').value;
  const icono_personalizado = document.getElementById('hitoIconoCustom').value.trim();
  if(!titulo || !fecha){ toast('Completa el título y la fecha'); return; }
  await sb.from('calendario').insert({couple_id:SESSION.coupleId, titulo, fecha, tipo:'hito', icono:window._hitoIcono||'💞', icono_personalizado, modo, color, recurrente, estado:'💞 Fecha importante'});
  window._hitoIcono = null;
  toast('Fecha importante guardada 💫'); renderCalendario();
}
async function agregarEvento(){
  const fecha = document.getElementById('cl-fecha').value;
  const titulo = document.getElementById('cl-titulo').value.trim();
  const estado = document.getElementById('cl-estado').value;
  if(!fecha || !titulo){ toast('Completa fecha y título'); return; }
  await sb.from('calendario').insert({couple_id:SESSION.coupleId, fecha, titulo, estado});
  toast('Evento agregado 📅'); renderCalendario();
}
async function quitarEvento(id){ await sb.from('calendario').delete().eq('id', id); renderCalendario(); }

/* ================= RECUERDOS (Diario + Scrapbook + Cápsula del tiempo) ================= */
let recuerdosSub = 'diario';
let diarioSub = 'personal';
let scrapTipo = 'foto';
async function renderRecuerdos(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="subtabs" id="recuerdosSubtabs">
      <button data-r="diario" class="${recuerdosSub==='diario'?'active':''}">📖 Diario</button>
      <button data-r="scrapbook" class="${recuerdosSub==='scrapbook'?'active':''}">📒 Scrapbook</button>
      <button data-r="capsula" class="${recuerdosSub==='capsula'?'active':''}">⏳ Cápsula</button>
    </div>
    <div id="recuerdosBody"></div>`;
  document.querySelectorAll('#recuerdosSubtabs button').forEach(b=>b.onclick=()=>{ recuerdosSub=b.dataset.r; renderRecuerdos(); });
  const body = document.getElementById('recuerdosBody');
  if(recuerdosSub==='diario') return renderDiario(body);
  if(recuerdosSub==='scrapbook') return renderScrapbook(body);
  return renderCapsula(body);
}

/* ---------- Diario personal + compartido ---------- */
async function renderDiario(body){
  let q = sb.from('diario').select('*').eq('couple_id', SESSION.coupleId).eq('tipo', diarioSub);
  if(diarioSub==='personal') q = q.eq('autor_id', SESSION.user.id);
  const { data: entradas } = await q.order('created_at',{ascending:false});
  const now = new Date();
  const semana = (entradas||[]).filter(e=> (now-new Date(e.created_at))<7*86400000).length;
  const mes = (entradas||[]).filter(e=> (now-new Date(e.created_at))<30*86400000).length;
  body.innerHTML = `
    <div class="subtabs">
      <button data-d="personal" class="${diarioSub==='personal'?'active':''}">Mi diario</button>
      <button data-d="compartido" class="${diarioSub==='compartido'?'active':''}">Diario compartido</button>
    </div>
    <div class="card">
      <h2>${diarioSub==='personal'?'Escribe para ti':'Escriban juntos'}</h2>
      <div class="muted small" style="margin-bottom:10px">${diarioSub==='personal'?'Solo tú puedes ver estas entradas.':'Ambos pueden leer y escribir aquí.'}</div>
      <textarea id="dr-texto" rows="4" placeholder="¿Qué pasó hoy? ¿Cómo te sientes?"></textarea>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="agregarDiario()">Guardar entrada</button>
    </div>
    <div class="stat-strip">
      <div class="stat-box"><b>${semana}</b><span>Esta semana</span></div>
      <div class="stat-box"><b>${mes}</b><span>Este mes</span></div>
      <div class="stat-box"><b>${(entradas||[]).length}</b><span>En total</span></div>
    </div>
    <div class="section-title">Entradas</div>
    <div id="listaDiario"></div>`;
  body.querySelectorAll('.subtabs button').forEach(b=>b.onclick=()=>{ diarioSub=b.dataset.d; renderDiario(body); });
  const lista = document.getElementById('listaDiario');
  if(!entradas || !entradas.length){ lista.innerHTML = `<div class="empty"><span class="ic">📖</span>Aún no hay entradas aquí.</div>`; return; }
  lista.innerHTML = entradas.map(e=>`<div class="letter-card">
    <div class="small muted">${new Date(e.created_at).toLocaleDateString('es-ES',{weekday:'long', day:'numeric', month:'long'})} · ${diarioSub==='compartido' ? (e.autor_id===SESSION.user.id?'Tú':'Tu pareja') : 'Privado'}</div>
    <p style="white-space:pre-wrap;margin:8px 0 6px">${esc(e.texto)}</p>
    ${e.autor_id===SESSION.user.id?`<span class="tag-del" onclick="quitarDiario('${e.id}')">Eliminar ✕</span>`:''}
  </div>`).join('');
}
async function agregarDiario(){
  const texto = document.getElementById('dr-texto').value.trim();
  if(!texto){ toast('Escribe algo primero'); return; }
  const { error } = await sb.from('diario').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:diarioSub, texto});
  if(error){ toast('No se pudo guardar'); console.error(error); return; }
  toast('Entrada guardada 📖'); renderRecuerdos();
  verificarLogros(true);
}
async function quitarDiario(id){ await sb.from('diario').delete().eq('id', id); renderRecuerdos(); }

/* ---------- Scrapbook ---------- */
let scrapVista = 'cuadricula';
async function renderScrapbook(body){
  if(scrapVista==='paginas') return renderScrapbookPaginas(body);
  const { data: items } = await sb.from('scrapbook').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:true});
  const tipos = [['foto','📷 Foto'],['nota','📝 Nota'],['sticker','✨ Sticker'],['ticket','🎫 Ticket']];
  body.innerHTML = `
    <div class="subtabs" id="scrapVistaTabs">
      <button data-v="cuadricula" class="${scrapVista==='cuadricula'?'active':''}">▦ Cuadrícula</button>
      <button data-v="paginas" class="${scrapVista==='paginas'?'active':''}">📒 Páginas libres</button>
    </div>
    <div class="card">
      <h2>Añadir al scrapbook</h2>
      <div class="cat-chip-row" id="scrapTipos">${tipos.map(t=>`<button class="cat-chip ${scrapTipo===t[0]?'active':''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div id="scrapForm"></div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" id="btnScrap" onclick="agregarScrapbook()">Pegar en el scrapbook</button>
    </div>
    <div class="section-title">Su scrapbook (${(items||[]).length})</div>
    <div class="album-grid" id="scrapGrid"></div>`;
  document.querySelectorAll('#scrapVistaTabs button').forEach(b=>b.onclick=()=>{ scrapVista=b.dataset.v; renderRecuerdos(); });
  body.querySelectorAll('#scrapTipos button').forEach(b=>b.onclick=()=>{ scrapTipo=b.dataset.t; renderScrapbook(body); });
  const form = document.getElementById('scrapForm');
  if(scrapTipo==='foto'){
    form.innerHTML = `<input type="file" id="scrapFile" accept="image/*"><div class="field" style="margin-top:8px"><label>Nota (opcional)</label><input id="scrapTexto" placeholder="Un recuerdo, un ticket, una idea..."></div>`;
  } else {
    form.innerHTML = `<div class="field"><label>${scrapTipo==='sticker'?'Escribe el emoji o frase':'Escribe la nota'}</label><input id="scrapTexto" placeholder="${scrapTipo==='sticker'?'✨💕🎉':'Escribe aquí...'}"></div>`;
  }
  const grid = document.getElementById('scrapGrid');
  if(!items || !items.length){ grid.outerHTML = `<div class="empty"><span class="ic">📒</span>Su scrapbook está vacío por ahora.</div>`; return; }
  grid.innerHTML = items.slice().reverse().map(it=>{
    if(it.tipo==='foto'){ return `<div class="a-item" onclick="quitarScrapbook('${it.id}')"><img src="${it.img_url}" loading="lazy"><div class="a-cap">${esc(it.texto||'')}</div></div>`; }
    const emoji = it.tipo==='sticker'?'✨':it.tipo==='ticket'?'🎫':'📝';
    return `<div class="a-item" style="background:linear-gradient(160deg,#fff,#fdf2f6);display:flex;align-items:center;justify-content:center;padding:10px;text-align:center;color:#4a3550" onclick="quitarScrapbook('${it.id}')"><div><div style="font-size:20px">${emoji}</div><div class="small script" style="margin-top:4px">${esc(it.texto||'')}</div></div></div>`;
  }).join('');
}
async function agregarScrapbook(){
  const btn = document.getElementById('btnScrap');
  const texto = (document.getElementById('scrapTexto')||{}).value?.trim() || '';
  if(scrapTipo==='foto'){
    const file = document.getElementById('scrapFile').files[0];
    if(!file){ toast('Elige una foto primero'); return; }
    btn.innerHTML='<span class="spinner"></span>'; btn.disabled=true;
    const reader = new FileReader();
    reader.onload = (e)=>{
      const img = new Image();
      img.onload = async ()=>{
        const maxW=900, scale=Math.min(1, maxW/img.width);
        const c=document.createElement('canvas'); c.width=img.width*scale; c.height=img.height*scale;
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        const dataUrl = c.toDataURL('image/jpeg',0.65);
        const url = await subirImagen(dataUrl, 'scrapbook', 'foto');
        if(!url){ toast('La imagen es muy pesada, intenta otra'); btn.disabled=false; btn.textContent='Pegar en el scrapbook'; return; }
        const { error } = await sb.from('scrapbook').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'foto', img_url:url, texto});
        if(error){ toast('No se pudo guardar'); console.error(error); btn.disabled=false; btn.textContent='Pegar en el scrapbook'; return; }
        toast('Pegado en el scrapbook 📒'); renderRecuerdos();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    return;
  }
  if(!texto){ toast('Escribe algo primero'); return; }
  const { error } = await sb.from('scrapbook').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:scrapTipo, texto});
  if(error){ toast('No se pudo guardar'); console.error(error); return; }
  toast('Pegado en el scrapbook 📒'); renderRecuerdos();
}
async function quitarScrapbook(id){
  if(confirm('¿Quitar este elemento del scrapbook?')){ await sb.from('scrapbook').delete().eq('id', id); renderRecuerdos(); }
}

/* ---------- Cápsula del tiempo ---------- */
async function renderCapsula(body){
  const { data: capsulas } = await sb.from('capsulas').select('*').eq('couple_id', SESSION.coupleId).order('fecha_apertura',{ascending:true});
  const now = new Date();
  body.innerHTML = `
    <div class="card">
      <h2>Crear una cápsula del tiempo</h2>
      <div class="field"><label>Título</label><input id="cp-titulo" placeholder="Para nosotros en el futuro..."></div>
      <div class="field"><label>Mensaje</label><textarea id="cp-mensaje" rows="4" placeholder="Escribe algo para abrir más adelante..."></textarea></div>
      <div class="field"><label>Foto (opcional)</label><input type="file" id="cp-foto" accept="image/*"></div>
      <div class="field"><label>Abrir el día</label><input type="date" id="cp-fecha"></div>
      <button class="btn btn-primary btn-block" id="btnCapsula" onclick="agregarCapsula()">Sellar cápsula ⏳</button>
    </div>
    <div class="section-title">Sus cápsulas</div>
    <div id="listaCapsulas"></div>`;
  const lista = document.getElementById('listaCapsulas');
  if(!capsulas || !capsulas.length){ lista.innerHTML = `<div class="empty"><span class="ic">⏳</span>Aún no han sellado ninguna cápsula.</div>`; return; }
  lista.innerHTML = capsulas.slice().reverse().map(c=>{
    const puedeAbrir = new Date(c.fecha_apertura) <= now;
    if(c.abierta){
      return `<div class="letter-card">
        <div class="letter-title">⏳ ${esc(c.titulo)}</div>
        ${c.img_url?`<img src="${c.img_url}" style="width:100%;border-radius:12px;margin:8px 0">`:''}
        <p style="white-space:pre-wrap">${esc(c.mensaje)}</p>
        <div class="small muted">Sellada el ${new Date(c.created_at).toLocaleDateString('es-ES')} · abierta el ${new Date(c.fecha_apertura).toLocaleDateString('es-ES')}</div>
      </div>`;
    }
    if(puedeAbrir){
      return `<div class="letter-card locked"><span class="envelope">⏳</span><div class="letter-title">${esc(c.titulo)}</div><div class="small muted">¡Ya pueden abrirla!</div><button class="btn btn-sm btn-gold" style="margin-top:8px" onclick="abrirCapsula('${c.id}')">Abrir cápsula</button></div>`;
    }
    const dias = Math.ceil((new Date(c.fecha_apertura)-now)/86400000);
    return `<div class="letter-card locked"><span class="envelope">🔒⏳</span><div class="letter-title">${esc(c.titulo)}</div><div class="small muted">Se abre en ${dias} día${dias!==1?'s':''} (${new Date(c.fecha_apertura).toLocaleDateString('es-ES')})</div></div>`;
  }).join('');
}
async function agregarCapsula(){
  const titulo = document.getElementById('cp-titulo').value.trim();
  const mensaje = document.getElementById('cp-mensaje').value.trim();
  const fecha = document.getElementById('cp-fecha').value;
  const file = document.getElementById('cp-foto').files[0];
  if(!titulo || !mensaje || !fecha){ toast('Completa título, mensaje y fecha'); return; }
  if(new Date(fecha) <= new Date()){ toast('Elige una fecha futura'); return; }
  const btn = document.getElementById('btnCapsula');
  btn.innerHTML='<span class="spinner"></span>'; btn.disabled=true;
  let img_url = null;
  if(file){
    const dataUrl = await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(file); });
    img_url = await subirImagen(dataUrl, 'capsulas', 'foto');
  }
  const { error } = await sb.from('capsulas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, mensaje, img_url, fecha_apertura:fecha, abierta:false});
  btn.disabled=false; btn.textContent='Sellar cápsula ⏳';
  if(error){ toast('No se pudo sellar'); console.error(error); return; }
  toast('Cápsula sellada ⏳'); renderRecuerdos();
}
async function abrirCapsula(id){ await sb.from('capsulas').update({abierta:true}).eq('id', id); renderRecuerdos(); }

/* ================= CHAT ================= */
let chatReplyTo = null;
let chatTempDuracionMin = null;

async function renderChat(){
  const ahora = new Date().toISOString();
  sb.from('chat_mensajes').delete().eq('couple_id', SESSION.coupleId).lt('expira_en', ahora).then(()=>{});
  const { data: chat } = await sb.from('chat_mensajes').select('*').eq('couple_id', SESSION.coupleId)
    .or(`programado_para.is.null,programado_para.lte.${ahora}`)
    .order('created_at',{ascending:true}).limit(300);
  const visibles = (chat||[]).filter(m => !m.expira_en || new Date(m.expira_en) > new Date());
  window._chatMensajes = visibles;

  const main = document.getElementById('main');
  if(!document.getElementById('chatScroll')){
    main.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <div>
            <h2 style="margin:0">Chat privado 💬</h2>
            <div id="chatPresencia" class="small muted" style="margin-top:2px"></div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="icon-btn llamada-btn-chat" onclick="iniciarLlamada(false)" title="Llamar">📞</button>
            <button class="icon-btn llamada-btn-chat" onclick="iniciarLlamada(true)" title="Videollamada">🎥</button>
            <button class="icon-btn" onclick="toggleChatBusqueda()" title="Buscar">🔍</button>
            <button class="icon-btn" onclick="abrirProgramados()" title="Programados">⏰</button>
          </div>
        </div>
        <div id="chatSearchWrap" style="display:none;margin-top:8px" class="search-bar">
          <input id="chatSearch" placeholder="Buscar en la conversación..." oninput="filtrarChat()">
        </div>
        <div class="chat-scroll" id="chatScroll"></div>
        <div id="chatReplyBar" style="display:none" class="chat-reply-bar"></div>
        <div class="chat-media-bar">
          <button class="chat-media-btn" onclick="toggleChatEmoji()">😊 Emoji NPM</button>
          <button class="chat-media-btn" onclick="abrirMediaChat('image/*','foto')">📷 Foto</button>
          <button class="chat-media-btn" onclick="abrirMediaChat('video/*','video')">🎥 Video</button>
          <button class="chat-media-btn" onclick="abrirMediaChat('audio/*','audio')">🎵 Audio</button>
          <button class="chat-media-btn" onclick="abrirMediaChat('*/*','archivo')">📎 Archivo</button>
          <button class="chat-media-btn" onclick="toggleStickerPicker()">🌸 Sticker</button>
          <button class="chat-media-btn" onclick="toggleGifPicker()">✨ GIF</button>
          <button class="chat-media-btn" id="btnProgramar" onclick="toggleSchedule()">⏰ Prog.</button>
          <button class="chat-media-btn" id="btnTemporal" onclick="toggleTemporal()">⏳ Temporal</button>
        </div>
        <div id="emojiPickerWrap" style="display:none"></div>
        <div id="stickerPickerWrap" style="display:none"></div>
        <div id="gifPickerWrap" style="display:none"></div>
        <div id="scheduleWrap" style="display:none"></div>
        <input type="file" id="chatFileInput" style="display:none">
        <div class="chat-input">
          <input id="chatMsg" placeholder="Escribe algo bonito...">
          <button class="btn btn-gold" onclick="enviarMsg()">Enviar</button>
        </div>
      </div>`;
    document.getElementById('chatMsg').addEventListener('keydown', e=>{ if(e.key==='Enter') enviarMsg(); });
  }
  if(!window._chatPollInterval){
    // El chat ya se actualiza al instante por Supabase Realtime; este sondeo cada 8s
    // queda solo como red de seguridad por si la conexión en tiempo real se cae un
    // momento (por ejemplo, al bloquear la pantalla del celular).
    window._chatPollInterval = setInterval(()=>{ if(activeTab==='chat') renderChat(); }, 8000);
  }
  if(!window._chatPresenciaInterval){
    // Refresca la etiqueta "En línea" / "Últ. vez..." cada 15s aunque no llegue ningún
    // cambio nuevo, porque el estado "en línea" depende del tiempo transcurrido, no solo
    // de eventos de la base de datos.
    window._chatPresenciaInterval = setInterval(()=>{ if(activeTab==='chat') pintarPresenciaChat(); }, 15000);
  }
  pintarPresenciaChat();
  pintarChatMensajes(visibles);
  marcarMensajesRecibidos(visibles);
}
function pintarPresenciaChat(){
  const el = document.getElementById('chatPresencia');
  if(!el || typeof CACHE==='undefined' || !CACHE.perfiles) return;
  const pareja = CACHE.perfiles[otroSlot()];
  if(!pareja){ el.textContent=''; return; }
  const enLinea = typeof estaEnLinea==='function' && estaEnLinea(pareja);
  const texto = typeof formatearUltimaVez==='function' ? formatearUltimaVez(pareja) : '';
  el.innerHTML = enLinea
    ? `<span class="status-dot" style="background:#8fbf9f"></span>${texto}`
    : `<span class="status-dot" style="background:#c9b8a8"></span>${texto}`;
}
async function marcarMensajesRecibidos(mensajes){
  if(isDemoMode()) return;
  const ahora = new Date().toISOString();
  const pendientesEntrega = mensajes.filter(m=>m.autor_id && m.autor_id!==SESSION.user.id && !m.entregado_at).map(m=>m.id);
  const pendientesLectura = mensajes.filter(m=>m.autor_id && m.autor_id!==SESSION.user.id && !m.leido_at).map(m=>m.id);
  try{
    if(pendientesEntrega.length){
      await sb.from('chat_mensajes').update({entregado_at:ahora, entregado_por:SESSION.user.id}).in('id', pendientesEntrega);
    }
    if(pendientesLectura.length){
      await sb.from('chat_mensajes').update({leido_at:ahora, leido_por:SESSION.user.id}).in('id', pendientesLectura);
    }
  }catch(e){ console.error(e); }
}

function pintarChatMensajes(mensajes){
  const scroll = document.getElementById('chatScroll');
  if(!scroll) return;
  if(!mensajes.length){ scroll.innerHTML = `<div class="empty small">Aún no hay mensajes. Di hola 👋</div>`; return; }
  const porId = {}; mensajes.forEach(m=>porId[m.id]=m);
  const REACC = ['❤️','😂','😮','😢','👏'];
  scroll.innerHTML = mensajes.map(m=>{
    const esYo = m.autor_id===SESSION.user.id;
    const hora = new Date(m.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
    if(m.tipo==='llamada'){
      let info={}; try{ info = JSON.parse(m.texto||'{}'); }catch(e){}
      const esVideo = !!info.video;
      const ROTULOS = {
        realizada: {icono: esVideo?'🎥':'📞', texto: esVideo?'Videollamada':'Llamada'},
        rechazada: {icono:'📵', texto: (esVideo?'Videollamada':'Llamada')+' rechazada'},
        cancelada: {icono:'📵', texto: (esVideo?'Videollamada':'Llamada')+' sin respuesta'},
      };
      const r = ROTULOS[info.estado] || ROTULOS.realizada;
      const duracion = info.duracion>0 ? ` · ${formatearDuracion(info.duracion*1000)}` : '';
      return `<div class="msg-llamada-registro" data-id="${m.id}">
        <span class="msg-llamada-icono">${r.icono}</span>
        <span>${r.texto}${duracion}</span>
        <span class="msg-llamada-hora">${hora}</span>
      </div>`;
    }
    let contenido;
    if(m.eliminado){
      contenido = `<i>🚫 Mensaje eliminado</i>`;
    } else if(m.tipo==='foto'){
      contenido = `<img class="msg-media" src="${m.media_url}" onclick="event.stopPropagation();window.open('${m.media_url}','_blank')">${m.texto?`<div>${esc(m.texto)}</div>`:''}`;
    } else if(m.tipo==='video'){
      contenido = `<video class="msg-media" controls src="${m.media_url}" onclick="event.stopPropagation()"></video>${m.texto?`<div>${esc(m.texto)}</div>`:''}`;
    } else if(m.tipo==='audio'){
      contenido = `<audio class="msg-audio" controls src="${m.media_url}" onclick="event.stopPropagation()"></audio>`;
    } else if(m.tipo==='archivo'){
      contenido = `<a class="msg-file" href="${m.media_url}" target="_blank" onclick="event.stopPropagation()">📎 ${esc(m.media_name||'Archivo')}</a>`;
    } else if(m.tipo==='sticker'){
      contenido = `<div style="font-size:38px">${esc(m.texto||'')}</div>`;
    } else if(m.tipo==='gif'){
      contenido = `<div style="font-size:22px;letter-spacing:2px">${esc(m.texto||'')}</div>`;
    } else {
      contenido = esc(m.texto||'');
    }
    const respondido = (m.reply_to && porId[m.reply_to]) ? `<div class="replied">↩ ${esc((porId[m.reply_to].eliminado ? '[mensaje eliminado]' : (porId[m.reply_to].texto || '[multimedia]')).substring(0,60))}</div>` : '';
    const reacciones = m.reactions||[];
    const conteo = {};
    reacciones.forEach(r=>{ conteo[r.emoji]=(conteo[r.emoji]||0)+1; });
    const miReaccion = reacciones.find(r=>r.autor_id===SESSION.user.id);
    const editadoTag = (m.editado && !m.eliminado) ? ' <span style="font-size:9px;opacity:.6">editado</span>' : '';
    const tempTag = m.expira_en ? ` <span class="temp-badge" title="Mensaje temporal">⏳</span>` : '';
    const cuentaEliminada = m.autor_id===null;
    return `<div class="msg ${esYo?'me':'them'}" data-id="${m.id}" onclick="toggleMsgAcciones(event,'${m.id}')">
      ${cuentaEliminada?`<div class="small" style="opacity:.6;font-style:italic;margin-bottom:2px">Cuenta eliminada</div>`:''}${!m.eliminado?`<div class="msg-actions">
        ${REACC.map(e=>`<span onclick="event.stopPropagation();reaccionarMsg('${m.id}','${e}')">${e}</span>`).join('')}
        <span onclick="event.stopPropagation();responderMsg('${m.id}')">↩️</span>
        ${esYo?`<span onclick="event.stopPropagation();editarMsg('${m.id}')">✏️</span><span onclick="event.stopPropagation();eliminarMsg('${m.id}')">🗑️</span>`:''}
      </div>`:''}
      ${respondido}
      ${contenido}
      ${Object.keys(conteo).length?`<div>${Object.entries(conteo).map(([e,c])=>`<span class="msg-reaction" onclick="event.stopPropagation();reaccionarMsg('${m.id}','${e}')" style="${miReaccion&&miReaccion.emoji===e?'outline:1.5px solid var(--dorado)':''}">${e}${c>1?' '+c:''}</span>`).join('')}</div>`:''}
      <span class="t">${hora}${editadoTag}${tempTag}${esYo && !m.eliminado ? ` <span class="msg-ticks ${m.leido_at?'leido':m.entregado_at?'entregado':''}" title="${m.leido_at?'Leído':m.entregado_at?'Entregado':'Enviado'}">${m.leido_at||m.entregado_at?'✓✓':'✓'}</span>` : ''}</span>
    </div>`;
  }).join('');
  scroll.scrollTop = scroll.scrollHeight;
}

function toggleMsgAcciones(evt, id){
  const el = document.querySelector(`.msg[data-id="${id}"]`);
  if(!el) return;
  const abierto = el.classList.contains('actions-open');
  document.querySelectorAll('.msg.actions-open').forEach(m=>m.classList.remove('actions-open'));
  if(!abierto) el.classList.add('actions-open');
}
document.addEventListener('click', (e)=>{
  if(!e.target.closest || !e.target.closest('.msg')) document.querySelectorAll('.msg.actions-open').forEach(m=>m.classList.remove('actions-open'));
});

function toggleChatBusqueda(){
  const wrap = document.getElementById('chatSearchWrap');
  if(!wrap) return;
  const abierto = wrap.style.display!=='none';
  wrap.style.display = abierto?'none':'block';
  if(!abierto){ document.getElementById('chatSearch').focus(); } else { filtrarChatReset(); }
}
function filtrarChat(){
  const q = (document.getElementById('chatSearch').value||'').toLowerCase().trim();
  document.querySelectorAll('#chatScroll .msg').forEach(el=>{
    const texto = el.textContent.toLowerCase();
    el.style.display = (!q || texto.includes(q)) ? '' : 'none';
  });
}
function filtrarChatReset(){
  document.querySelectorAll('#chatScroll .msg').forEach(el=>{ el.style.display=''; });
}

function toggleStickerPicker(){
  const wrap = document.getElementById('stickerPickerWrap');
  const gifWrap = document.getElementById('gifPickerWrap');
  if(gifWrap) gifWrap.style.display='none';
  const abierto = wrap.style.display!=='none';
  wrap.style.display = abierto?'none':'block';
  if(!abierto) wrap.innerHTML = `<div class="emoji-picker"><div style="font-weight:700;font-size:13px;margin-bottom:8px">🌸 Stickers</div><div class="sticker-grid">${NPM_STICKERS.map(s=>`<div class="sticker-item" onclick="enviarSticker('${s}')">${s}</div>`).join('')}</div></div>`;
}
async function enviarSticker(sticker){
  document.getElementById('stickerPickerWrap').style.display='none';
  await enviarMensajeEspecial('sticker', sticker);
}
function toggleGifPicker(){
  const wrap = document.getElementById('gifPickerWrap');
  const stWrap = document.getElementById('stickerPickerWrap');
  if(stWrap) stWrap.style.display='none';
  const abierto = wrap.style.display!=='none';
  wrap.style.display = abierto?'none':'block';
  if(!abierto) wrap.innerHTML = `<div class="emoji-picker"><div style="font-weight:700;font-size:13px;margin-bottom:8px">✨ GIFs NPM</div><div class="gif-grid">${NPM_GIFS.map(g=>`<div class="gif-item" onclick="enviarGif('${g}')">${g}</div>`).join('')}</div></div>`;
}
async function enviarGif(emoji){
  document.getElementById('gifPickerWrap').style.display='none';
  await enviarMensajeEspecial('gif', emoji);
}
let chatEmojiCat = 'amor';
function toggleChatEmoji(){
  const wrap = document.getElementById('emojiPickerWrap');
  if(!wrap) return;
  document.getElementById('stickerPickerWrap').style.display='none';
  document.getElementById('gifPickerWrap').style.display='none';
  const abierto = wrap.style.display!=='none';
  wrap.style.display = abierto?'none':'block';
  if(abierto) return;
  const cats = [['amor','💗 Amor'],['estados','😊 Estados'],['mensajes','💬 Mensajes'],['exclusivos','⭐ Exclusivos'],['actividades','🏠 Actividades'],['minijuegos','🎮 Mini'],['mascotas','🐾 Mascotas']];
  wrap.innerHTML = `<div class="emoji-picker">
    <div class="emoji-picker-cats">${cats.map(([k,l])=>`<button class="emoji-cat-btn ${chatEmojiCat===k?'active':''}" data-cat="${k}">${l}</button>`).join('')}</div>
    <div class="emoji-grid" id="emojiGrid"></div>
  </div>`;
  wrap.querySelectorAll('.emoji-cat-btn').forEach(b=>b.onclick=()=>{ chatEmojiCat=b.dataset.cat; wrap.querySelectorAll('.emoji-cat-btn').forEach(x=>x.classList.toggle('active', x===b)); pintarEmojiGrid(); });
  pintarEmojiGrid();
}
function pintarEmojiGrid(){
  const grid = document.getElementById('emojiGrid');
  if(!grid) return;
  const emojis = NPM_EMOJIS[chatEmojiCat]||[];
  grid.innerHTML = emojis.map(em=>`<div class="emoji-item" onclick="enviarNpmEmoji('${em.e}')"><span>${em.e}</span><span class="ei-label">${em.l}</span></div>`).join('');
}
async function enviarNpmEmoji(emoji){
  document.getElementById('emojiPickerWrap').style.display='none';
  await enviarMensajeEspecial('sticker', emoji);
}
async function enviarMensajeEspecial(tipo, texto){
  const payload = {couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, texto};
  aplicarExtrasMensaje(payload);
  const { error } = await insertarYMostrarMensaje(payload);
  if(error){ toast('No se pudo enviar'); console.error(error); return; }
  cancelarRespuesta();
}
function aplicarExtrasMensaje(payload){
  if(chatReplyTo){ payload.reply_to = chatReplyTo.id; }
  if(chatTempDuracionMin){ payload.expira_en = new Date(Date.now()+chatTempDuracionMin*60000).toISOString(); }
}
// Inserta el mensaje y, en cuanto Supabase confirma la fila creada, la agrega directo a la
// conversación en pantalla (sin volver a pedir los 300 mensajes completos). Así el envío se
// siente instantáneo en vez de esperar una segunda consulta antes de mostrar tu propio mensaje.
async function insertarYMostrarMensaje(payload){
  const { data: nuevo, error } = await sb.from('chat_mensajes').insert(payload).select().single();
  if(error) return { error };
  if(nuevo){
    window._chatMensajes = (window._chatMensajes||[]).concat([nuevo]);
    pintarChatMensajes(window._chatMensajes);
  } else {
    renderChat();
  }
  return { data: nuevo };
}

function toggleSchedule(){
  const wrap = document.getElementById('scheduleWrap');
  const abierto = wrap.style.display!=='none';
  wrap.style.display = abierto?'none':'block';
  document.getElementById('btnProgramar').classList.toggle('active', !abierto);
  if(!abierto) wrap.innerHTML = `<div class="schedule-form"><div style="font-weight:700;font-size:13px;margin-bottom:8px">⏰ Programar este mensaje</div><div class="field" style="margin-bottom:6px"><label>Fecha y hora</label><input type="datetime-local" id="scheduleDate"></div><p class="hint">Escribe tu mensaje abajo y presiona Enviar: se guardará en privado y aparecerá en el chat automáticamente en esa fecha.</p></div>`;
}
function toggleTemporal(){
  const btn = document.getElementById('btnTemporal');
  if(chatTempDuracionMin){
    chatTempDuracionMin = null;
    btn.classList.remove('active');
    btn.textContent = '⏳ Temporal';
    toast('Mensajes temporales desactivados');
    return;
  }
  const resp = prompt('¿Por cuánto tiempo debe durar cada mensaje que envíes desde ahora?\n1. 10 minutos\n2. 1 hora\n3. 24 horas');
  if(resp===null) return;
  const mapa = {'1':[10,'10 min'],'2':[60,'1 h'],'3':[1440,'24 h']};
  const opcion = mapa[resp.trim()];
  if(!opcion){ toast('Opción no válida'); return; }
  chatTempDuracionMin = opcion[0];
  btn.classList.add('active');
  btn.textContent = `⏳ Temporal (${opcion[1]})`;
  toast('Tus próximos mensajes se autodestruirán 🔥. Toca de nuevo para desactivar.');
}

function responderMsg(id){
  const m = (window._chatMensajes||[]).find(x=>x.id===id);
  if(!m) return;
  const previa = m.eliminado ? '[mensaje eliminado]' : (m.texto || (m.tipo==='foto'?'📷 Foto':m.tipo==='video'?'🎥 Video':m.tipo==='audio'?'🎵 Audio':m.tipo==='archivo'?'📎 '+(m.media_name||'Archivo'):'Mensaje'));
  chatReplyTo = {id, texto: previa};
  const bar = document.getElementById('chatReplyBar');
  bar.style.display='flex';
  bar.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">↩ Respondiendo: <i>${esc(previa.substring(0,50))}</i></span><button onclick="cancelarRespuesta()" style="border:none;background:none;cursor:pointer;font-size:14px">✕</button>`;
  document.getElementById('chatMsg').focus();
}
function cancelarRespuesta(){
  chatReplyTo = null;
  const bar = document.getElementById('chatReplyBar');
  if(bar){ bar.style.display='none'; bar.innerHTML=''; }
}

async function editarMsg(id){
  const m = (window._chatMensajes||[]).find(x=>x.id===id);
  if(!m || m.autor_id!==SESSION.user.id) return;
  if(m.tipo!=='texto'){ toast('Solo se pueden editar mensajes de texto'); return; }
  const nuevo = prompt('Editar mensaje:', m.texto||'');
  if(nuevo===null || !nuevo.trim() || nuevo===m.texto) return;
  const { error } = await sb.from('chat_mensajes').update({texto:nuevo.trim(), editado:true}).eq('id', id).eq('autor_id', SESSION.user.id);
  if(error){ toast('No se pudo editar'); console.error(error); return; }
  renderChat();
}
async function eliminarMsg(id){
  const m = (window._chatMensajes||[]).find(x=>x.id===id);
  if(!m || m.autor_id!==SESSION.user.id) return;
  if(!confirm('¿Eliminar este mensaje?')) return;
  const { error } = await sb.from('chat_mensajes').update({eliminado:true, texto:'', media_url:null}).eq('id', id).eq('autor_id', SESSION.user.id);
  if(error){ toast('No se pudo eliminar'); console.error(error); return; }
  renderChat();
}
async function reaccionarMsg(id, emoji){
  const m = (window._chatMensajes||[]).find(x=>x.id===id);
  if(!m) return;
  let reacciones = [...(m.reactions||[])];
  const idx = reacciones.findIndex(r=>r.autor_id===SESSION.user.id);
  if(idx>=0 && reacciones[idx].emoji===emoji){
    reacciones.splice(idx,1);
  } else if(idx>=0){
    reacciones[idx] = {emoji, autor_id:SESSION.user.id};
  } else {
    reacciones.push({emoji, autor_id:SESSION.user.id});
  }
  const { error } = await sb.from('chat_mensajes').update({reactions:reacciones}).eq('id', id);
  if(error){ toast('No se pudo reaccionar'); console.error(error); return; }
  renderChat();
}

function abrirMediaChat(accept, tipo){
  const inp = document.getElementById('chatFileInput');
  if(!inp) return;
  inp.accept = accept;
  inp.onchange = async ()=>{
    const file = inp.files[0];
    if(!file) return;
    toast('Subiendo...');
    let url=null, media_name=null;
    try{
      if(tipo==='foto'){
        const dataUrl = await new Promise((res)=>{
          const r = new FileReader();
          r.onload = (e)=>{
            const img = new Image();
            img.onload = ()=>{
              const maxW=900, scale=Math.min(1,maxW/img.width);
              const c=document.createElement('canvas'); c.width=img.width*scale; c.height=img.height*scale;
              c.getContext('2d').drawImage(img,0,0,c.width,c.height);
              res(c.toDataURL('image/jpeg',0.7));
            };
            img.src = e.target.result;
          };
          r.readAsDataURL(file);
        });
        url = await subirImagen(dataUrl, 'chat', 'foto');
      } else if(tipo==='video'){
        url = await subirBlobDirecto(file, 'chat', 'video', (file.name.split('.').pop()||'mp4'), file.type||'video/mp4');
      } else if(tipo==='audio'){
        url = await subirBlobDirecto(file, 'chat', 'audio', (file.name.split('.').pop()||'mp3'), file.type||'audio/mpeg');
      } else if(tipo==='archivo'){
        media_name = file.name;
        url = await subirBlobDirecto(file, 'chat', 'archivo', (file.name.split('.').pop()||'bin'), file.type||'application/octet-stream');
      }
    } finally { inp.value=''; }
    if(!url){ toast('No se pudo subir el archivo'); return; }
    const payload = {couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, texto:'', media_url:url};
    if(media_name) payload.media_name = media_name;
    aplicarExtrasMensaje(payload);
    const { error } = await insertarYMostrarMensaje(payload);
    if(error){ toast('No se pudo enviar'); console.error(error); return; }
    cancelarRespuesta();
  };
  inp.click();
}

async function abrirProgramados(){
  const ahora = new Date().toISOString();
  const { data } = await sb.from('chat_mensajes').select('*').eq('couple_id', SESSION.coupleId).gt('programado_para', ahora).order('programado_para',{ascending:true});
  const lista = data||[];
  const existente = document.getElementById('programadosOverlay'); if(existente) existente.remove();
  const overlay = document.createElement('div');
  overlay.id = 'programadosOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(30,20,30,.75);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--crema);border-radius:22px 22px 0 0;max-width:520px;width:100%;max-height:80vh;overflow-y:auto;padding:18px;position:relative">
    <button onclick="document.getElementById('programadosOverlay').remove()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
    <h3 style="margin:0 0 12px">⏰ Mensajes programados</h3>
    ${lista.length ? lista.map(m=>`<div class="scheduled-item"><div><b>${esc(m.texto || ('['+m.tipo+']'))}</b><div class="muted small">${new Date(m.programado_para).toLocaleString('es-ES')}</div></div>${m.autor_id===SESSION.user.id?`<button class="btn btn-sm btn-ghost" onclick="cancelarProgramado('${m.id}')">Cancelar</button>`:'<span class="muted small">de tu pareja</span>'}</div>`).join('') : '<div class="muted small">No hay mensajes programados.</div>'}
  </div>`;
  document.body.appendChild(overlay);
}
async function cancelarProgramado(id){
  await sb.from('chat_mensajes').delete().eq('id', id).eq('autor_id', SESSION.user.id);
  toast('Mensaje programado cancelado');
  abrirProgramados();
}

async function enviarMsg(){
  const inp = document.getElementById('chatMsg');
  const val = inp.value.trim();
  if(!val) return;
  inp.value='';
  lanzarEfectoEnvio(inp);
  const scheduleWrap = document.getElementById('scheduleWrap');
  const fechaInput = document.getElementById('scheduleDate');
  if(scheduleWrap && scheduleWrap.style.display!=='none' && fechaInput && fechaInput.value){
    const fecha = new Date(fechaInput.value);
    if(fecha > new Date()){
      const payload = {couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'texto', texto:val, programado_para:fecha.toISOString()};
      const { error } = await sb.from('chat_mensajes').insert(payload);
      if(error){ toast('No se pudo programar'); console.error(error); return; }
      toast('Mensaje programado ⏰');
      scheduleWrap.style.display='none';
      document.getElementById('btnProgramar').classList.remove('active');
      return;
    } else {
      toast('Elige una fecha futura');
    }
  }
  const payload = {couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo:'texto', texto:val};
  aplicarExtrasMensaje(payload);
  const { error } = await insertarYMostrarMensaje(payload);
  if(error){ toast('No se pudo enviar'); console.error(error); return; }
  cancelarRespuesta();
  verificarLogros(true);
}
function lanzarEfectoEnvio(el){
  const rect = el?.getBoundingClientRect ? el.getBoundingClientRect() : {left:window.innerWidth/2, top:window.innerHeight/2};
  const iconos = ['💗','✨','🌸'];
  for(let i=0;i<3;i++){
    const div = document.createElement('div');
    div.className='float-heart';
    div.textContent = iconos[Math.floor(Math.random()*iconos.length)];
    div.style.left = (rect.left + Math.random()*40) + 'px';
    div.style.top = (rect.top - 10) + 'px';
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 1000);
  }
}

/* ================= MÚSICA (playlist compartida) ================= */
async function renderMusica(){
  const main = document.getElementById('main');
  const { data: pistas } = await sb.from('musica_playlist').select('*').eq('couple_id', SESSION.coupleId).order('orden',{ascending:true}).order('created_at',{ascending:true});
  window._musicaItems = pistas||[];
  main.innerHTML = `
    <div class="card">
      <h2>🎵 Nuestra playlist</h2>
      <p class="muted small">Guarden canciones especiales para escuchar juntos.</p>
      <div class="field"><label>Título</label><input id="musTitulo" placeholder="Nombre de la canción"></div>
      <div class="field"><label>Artista</label><input id="musArtista" placeholder="Artista (opcional)"></div>
      <div class="field"><label>Enlace</label><input id="musUrl" placeholder="https://open.spotify.com/... o https://youtube.com/..."></div>
      <div class="field"><label>Plataforma</label>
        <select id="musPlataforma">
          <option value="spotify">Spotify</option>
          <option value="youtube">YouTube</option>
          <option value="apple_music">Apple Music</option>
          <option value="soundcloud">SoundCloud</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" onclick="agregarCancion()">Agregar a la playlist</button>
    </div>
    <div class="section-title">Canciones (${(pistas||[]).length})</div>
    <div id="musicaLista"></div>`;
  pintarMusicaLista();
}
function embedMusica(a){
  try{
    if(a.plataforma==='youtube'){
      const m = (a.url||'').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      if(m) return `<iframe width="100%" height="160" style="border-radius:12px;border:none" src="https://www.youtube.com/embed/${m[1]}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
    if(a.plataforma==='spotify' && (a.url||'').includes('open.spotify.com')){
      const embedUrl = a.url.replace('open.spotify.com/', 'open.spotify.com/embed/');
      return `<iframe style="border-radius:12px;border:none" src="${embedUrl}" width="100%" height="152" allow="encrypted-media"></iframe>`;
    }
  }catch(e){}
  return `<a class="btn btn-sm btn-outline" href="${a.url}" target="_blank" rel="noopener">▶ Abrir enlace</a>`;
}
function pintarMusicaLista(){
  const cont = document.getElementById('musicaLista');
  const items = window._musicaItems||[];
  if(!items.length){ cont.innerHTML = `<div class="empty"><span class="ic">🎵</span>Aún no han agregado canciones.</div>`; return; }
  cont.innerHTML = items.map((a,i)=>`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div><b>${esc(a.titulo)}</b>${a.artista?`<div class="small muted">${esc(a.artista)}</div>`:''}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm ${a.favorita?'btn-gold':'btn-outline'}" onclick="toggleFavoritaCancion('${a.id}',${!a.favorita})">⭐</button>
          <button class="btn btn-sm btn-outline" onclick="moverCancion('${a.id}',-1)" ${i===0?'disabled':''}>↑</button>
          <button class="btn btn-sm btn-outline" onclick="moverCancion('${a.id}',1)" ${i===items.length-1?'disabled':''}>↓</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarCancion('${a.id}')">✕</button>
        </div>
      </div>
      <div style="margin-top:8px">${embedMusica(a)}</div>
    </div>`).join('');
}
async function agregarCancion(){
  const titulo = document.getElementById('musTitulo').value.trim();
  const artista = document.getElementById('musArtista').value.trim();
  const url = document.getElementById('musUrl').value.trim();
  const plataforma = document.getElementById('musPlataforma').value;
  if(!titulo || !url){ toast('Escribe al menos el título y el enlace'); return; }
  const orden = (window._musicaItems||[]).length;
  const { error } = await sb.from('musica_playlist').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, artista, url, plataforma, orden});
  if(error){ toast('No se pudo agregar la canción'); console.error(error); return; }
  toast('Canción agregada 🎵');
  renderMusica();
}
async function toggleFavoritaCancion(id, valor){
  await sb.from('musica_playlist').update({favorita:valor}).eq('id', id);
  renderMusica();
}
async function moverCancion(id, dir){
  const items = window._musicaItems||[];
  const i = items.findIndex(a=>a.id===id);
  const j = i+dir;
  if(i<0||j<0||j>=items.length) return;
  const a = items[i], b = items[j];
  await Promise.all([
    sb.from('musica_playlist').update({orden:b.orden}).eq('id', a.id),
    sb.from('musica_playlist').update({orden:a.orden}).eq('id', b.id),
  ]);
  renderMusica();
}
async function eliminarCancion(id){
  if(!confirm('¿Quitar esta canción de la playlist?')) return;
  await sb.from('musica_playlist').delete().eq('id', id);
  toast('Canción eliminada');
  renderMusica();
}

/* ================= ENTRETENIMIENTO (películas, series, juegos, libros) ================= */
let entreFiltro = 'todo';
