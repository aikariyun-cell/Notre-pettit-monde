async function renderEntretenimiento(){
  const main = document.getElementById('main');
  const { data: items } = await sb.from('entretenimiento').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  window._entreItems = items||[];
  const TIPOS = [['todo','Todo'],['pelicula','🎬 Películas'],['serie','📺 Series'],['juego','🎮 Juegos'],['libro','📚 Libros'],['otro','✨ Otro']];
  main.innerHTML = `
    <div class="card">
      <h2>🎬 Entretenimiento</h2>
      <p class="muted small">Guarden lo que quieren ver, jugar o leer juntos.</p>
      <div class="field"><label>Tipo</label>
        <select id="entreTipo">
          <option value="pelicula">Película</option><option value="serie">Serie</option>
          <option value="juego">Juego</option><option value="libro">Libro</option><option value="otro">Otro</option>
        </select>
      </div>
      <div class="field"><label>Título</label><input id="entreTitulo" placeholder="Nombre"></div>
      <div class="field"><label>Imagen (URL, opcional)</label><input id="entreImagen" placeholder="https://..."></div>
      <div class="field"><label>Notas (opcional)</label><input id="entreNotas" placeholder="¿Por qué quieren verlo/jugarlo?"></div>
      <button class="btn btn-primary btn-block" onclick="agregarEntretenimiento()">Agregar a la lista</button>
    </div>
    <div class="cat-chip-row">
      ${TIPOS.map(([t,lbl])=>`<button class="cat-chip ${entreFiltro===t?'active':''}" onclick="entreFiltro='${t}';renderEntretenimiento()">${lbl}</button>`).join('')}
    </div>
    <div id="entreLista"></div>`;
  pintarEntreLista();
}
function pintarEntreLista(){
  const cont = document.getElementById('entreLista');
  const items = (window._entreItems||[]).filter(a=> entreFiltro==='todo' || a.tipo===entreFiltro);
  if(!items.length){ cont.innerHTML = `<div class="empty"><span class="ic">🎬</span>Nada por aquí todavía.</div>`; return; }
  const ICONO = {pelicula:'🎬',serie:'📺',juego:'🎮',libro:'📚',otro:'✨'};
  const ESTADOS = [['pendiente','⏳ Pendiente'],['en_curso','▶️ En curso'],['completado','✅ Completado']];
  cont.innerHTML = items.map(a=>`
    <div class="card">
      <div style="display:flex;gap:10px">
        ${a.imagen_url?`<img src="${a.imagen_url}" style="width:64px;height:90px;object-fit:cover;border-radius:10px">`:`<div style="width:64px;height:90px;border-radius:10px;background:linear-gradient(135deg,var(--rosa),var(--lila));display:flex;align-items:center;justify-content:center;font-size:26px">${ICONO[a.tipo]||'✨'}</div>`}
        <div style="flex:1">
          <b>${esc(a.titulo)}</b>
          <div class="small muted">${ICONO[a.tipo]||''} ${a.tipo}</div>
          ${a.notas?`<div class="small" style="margin-top:4px">${esc(a.notas)}</div>`:''}
          <div style="margin-top:6px">${[1,2,3,4,5].map(n=>`<span style="cursor:pointer;font-size:15px" onclick="calificarEntretenimiento('${a.id}',${n})">${(a.calificacion||0)>=n?'⭐':'☆'}</span>`).join('')}</div>
        </div>
      </div>
      <div class="cat-chip-row" style="margin-top:8px">
        ${ESTADOS.map(([e,lbl])=>`<button class="cat-chip ${a.estado===e?'active':''}" onclick="cambiarEstadoEntretenimiento('${a.id}','${e}')">${lbl}</button>`).join('')}
        <button class="cat-chip" onclick="eliminarEntretenimiento('${a.id}')">🗑️ Quitar</button>
      </div>
    </div>`).join('');
}
async function agregarEntretenimiento(){
  const tipo = document.getElementById('entreTipo').value;
  const titulo = document.getElementById('entreTitulo').value.trim();
  const imagen_url = document.getElementById('entreImagen').value.trim();
  const notas = document.getElementById('entreNotas').value.trim();
  if(!titulo){ toast('Escribe un título'); return; }
  const { error } = await sb.from('entretenimiento').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, titulo, imagen_url: imagen_url||null, notas});
  if(error){ toast('No se pudo agregar'); console.error(error); return; }
  toast('Agregado a la lista 🎬');
  renderEntretenimiento();
}
async function cambiarEstadoEntretenimiento(id, estado){
  await sb.from('entretenimiento').update({estado, updated_at:new Date().toISOString()}).eq('id', id);
  renderEntretenimiento();
}
async function calificarEntretenimiento(id, calificacion){
  await sb.from('entretenimiento').update({calificacion, updated_at:new Date().toISOString()}).eq('id', id);
  renderEntretenimiento();
}
async function eliminarEntretenimiento(id){
  if(!confirm('¿Quitar este elemento de la lista?')) return;
  await sb.from('entretenimiento').delete().eq('id', id);
  toast('Eliminado');
  renderEntretenimiento();
}

/* ================= BANCOS DE CONTENIDO ================= */
const PREGUNTAS_DIA = [
"¿Cuál fue tu primera impresión de mí?","¿Qué canción te recuerda a nosotros?","¿Cuál es tu recuerdo favorito de este año juntos?",
"¿Qué es lo que más admiras de mí?","¿Cuál sería nuestra cita perfecta?","¿Qué comida te gustaría que cocináramos juntos?",
"¿Qué lugar del mundo quieres visitar conmigo?","¿Qué película describe mejor nuestra relación?","¿Cuál ha sido el mejor regalo que te he dado?",
"¿Qué es algo pequeño que hago que te hace feliz?","¿Cómo te imaginas nuestra vida en 5 años?","¿Qué apodo tuyo te gusta más?",
"¿Cuál fue el momento en que supiste que me amabas?","¿Qué tradición te gustaría que empezáramos?","¿Qué es lo más gracioso que hemos vivido juntos?",
"¿Qué canción pondrías en nuestra boda?","¿Qué mascota te gustaría que tuviéramos?","¿Cuál es tu forma favorita de pasar tiempo conmigo?",
"¿Qué es algo que quieres aprender juntos?","¿Cuál es tu recuerdo favorito de nuestra primera cita?","¿Qué te hace sentir más amado/a por mí?",
"¿Qué es algo que te gustaría que hiciéramos más seguido?","¿Cuál ha sido nuestro mejor viaje (o el que sueñas)?","¿Qué es lo que más te gusta de mi personalidad?",
"¿Qué palabra usarías para describir nuestra relación?","¿Qué es algo que aprendiste de mí?","¿Cuál es tu comida favorita que cocino/pido?",
"¿Qué es un sueño que tenemos en común?","¿Qué es lo que más valoras de nuestras conversaciones?","¿Qué momento del día te hace pensar más en mí?",
"¿Qué es algo tonto que hacemos juntos que te encanta?","¿Cómo prefieres que te consuele cuando estás triste?","¿Qué es lo que más te sorprendió de mí al conocerme?",
"¿Cuál es tu forma favorita de decir 'te amo' sin palabras?","¿Qué meta personal te gustaría lograr este año?","¿Qué es algo que te gustaría que supiera sobre ti?",
"¿Cuál ha sido nuestra pelea más tonta?","¿Qué es lo que más te gusta de nuestras rutinas?","¿Qué regalo te gustaría recibir de mí?",
"¿Qué es algo nuevo que te gustaría intentar juntos este mes?","¿Qué recuerdo de la infancia te gustaría compartir conmigo?",
];
const CONVERSACIONES_BANCO = {
  romance: ["¿Qué te hace sentir más enamorado/a de mí?","¿Cómo te gusta que te demuestre cariño en público?","¿Qué gesto romántico nunca olvidarás?","¿Qué canción te parece la más romántica de todas?","¿Prefieres cartas de amor o palabras dichas en voz alta?","¿Qué cita imaginaria te encantaría vivir?","¿Qué te parece más romántico: un viaje o una noche en casa?","¿Cuál crees que es nuestro 'para siempre'?","¿Qué detalle romántico jamás olvidarás de mí?","¿Cómo te gustaría que fuera nuestra próxima cita sorpresa?"],
  futuro: ["¿Cómo te imaginas nuestra casa ideal?","¿Qué ciudad te gustaría que exploráramos juntos algún día?","¿Cómo te imaginas celebrando nuestro décimo aniversario?","¿Qué meta te gustaría lograr en los próximos 5 años?","¿Cómo te imaginas nuestras mañanas dentro de 10 años?","¿Qué tradiciones familiares te gustaría crear?","¿Qué tipo de vacaciones anuales te gustaría tener?","¿Cómo te imaginas que envejezcamos juntos?","¿Qué proyecto en pareja te gustaría emprender?","¿Qué esperas que no cambie nunca entre nosotros?"],
  familia: ["¿Cómo describirías a tu familia en tres palabras?","¿Qué valor familiar es más importante para ti?","¿Cómo te gustaría que celebráramos las fiestas?","¿Qué tradición de tu familia te gustaría mantener?","¿Cómo te imaginas presentarme oficialmente a tu familia?","¿Qué aprendiste de tus padres sobre el amor?","¿Cuántos hijos (o mascotas) te gustaría tener, si alguno?","¿Qué tipo de padre/madre crees que serías?","¿Qué recuerdo familiar es el más especial para ti?","¿Cómo manejas los conflictos familiares?"],
  viajes: ["¿Cuál es tu destino soñado?","¿Prefieres playa o montaña?","¿Cuál fue el mejor viaje de tu vida?","¿Qué tipo de viajero eres: planificado o improvisado?","¿Qué comida de otro país te gustaría probar conmigo?","¿Prefieres viajar en pareja o en grupo?","¿Qué aventura extrema harías conmigo?","¿Qué idioma te gustaría aprender para viajar?","¿Prefieres un roadtrip o un vuelo?","¿Qué lugar de tu país aún no conoces y quieres visitar?"],
  dinero: ["¿Cómo manejas el estrés financiero?","¿Prefieres ahorrar o gastar en experiencias?","¿Qué significa para ti la estabilidad financiera?","¿Cómo te gustaría que manejáramos las finanzas en pareja?","¿Qué es algo en lo que no te importaría gastar de más?","¿Cuál es tu meta de ahorro más importante?","¿Cómo aprendiste a manejar el dinero?","¿Qué opinas de compartir gastos desde el inicio?","¿Qué comprarías si ganaras la lotería?","¿Qué es más importante: seguridad financiera o libertad?"],
  personalidad: ["¿Cómo describirías tu personalidad en 3 palabras?","¿Qué es lo que más te enorgullece de ti mismo/a?","¿Cuál es tu mayor miedo?","¿Qué es algo que te gustaría mejorar de ti?","¿Eres más de planear o improvisar?","¿Cómo recargas energías: solo/a o en compañía?","¿Qué te hace reír incontrolablemente?","¿Cuál es tu mayor fortaleza?","¿Qué es algo que la gente malinterpreta de ti?","¿Cómo manejas el estrés?"],
  suenos: ["¿Cuál es tu mayor sueño en la vida?","¿Qué carrera soñabas de niño/a?","¿Qué te gustaría lograr antes de los 40?","¿Qué habilidad te gustaría dominar?","¿Qué legado te gustaría dejar?","¿Qué proyecto personal tienes pendiente?","¿Qué harías si el dinero no fuera un problema?","¿Cuál es tu versión de una vida exitosa?","¿Qué sueño compartimos como pareja?","¿Qué es algo que quieres lograr este año?"],
  intimidad: ["¿Qué te hace sentir más conectado/a conmigo?","¿Cómo prefieres que te consuele en momentos difíciles?","¿Qué necesitas de mí cuando estás vulnerable?","¿Qué te ayuda a sentirte seguro/a en la relación?","¿Cómo te gusta que celebremos tus logros?","¿Qué te hace sentir verdaderamente escuchado/a?","¿Qué es algo que nunca le has dicho a nadie más?","¿Cómo prefieres resolver un malentendido?","¿Qué necesitas de mí en silencio, sin pedirlo?","¿Qué te hace sentir más cerca de mí?"],
  amistades: ["¿Quién es tu mejor amigo/a y por qué?","¿Qué buscas en una amistad?","¿Cómo equilibras el tiempo entre amigos y pareja?","¿Qué amistad ha marcado tu vida?","¿Te gustaría que compartiéramos más amistades?","¿Qué opinas de las amistades del sexo opuesto?","¿Qué es lo que más valoras de tus amistades?","¿Cómo mantienes amistades a distancia?","¿Qué amigo te gustaría que yo conociera mejor?","¿Qué has aprendido de tus amistades?"],
  valores: ["¿Qué valor es innegociable para ti?","¿Qué significa el respeto para ti?","¿Cómo defines la lealtad?","¿Qué es lo más importante en una relación?","¿Qué valores te gustaría que compartiéramos?","¿Cómo defines el éxito en la vida?","¿Qué opinas sobre la honestidad total en pareja?","¿Qué principio de vida sigues siempre?","¿Qué te enseñaron tus abuelos que aún sigues?","¿Qué te gustaría que nuestros valores como pareja representaran?"],
};
const LOVE_LANGUAGES = [
  {id:'palabras', icon:'💬', label:'Palabras de afirmación'},
  {id:'tiempo', icon:'⏳', label:'Tiempo de calidad'},
  {id:'actos', icon:'🤲', label:'Actos de servicio'},
  {id:'regalos', icon:'🎁', label:'Regalos'},
  {id:'contacto', icon:'🤗', label:'Contacto físico'},
];
const TRIVIA_PREGUNTAS = [
  {p:'¿Cuál es el lenguaje del amor que implica dar cumplidos y palabras bonitas?', o:['Actos de servicio','Palabras de afirmación','Regalos','Tiempo de calidad'], r:1},
  {p:'¿Qué símbolo se suele regalar en San Valentín?', o:['Trébol','Estrella','Corazón','Luna'], r:2},
  {p:'¿Cuántos años se celebran como "bodas de plata"?', o:['10','25','50','15'], r:1},
  {p:'¿Qué flor se asocia tradicionalmente con el amor romántico?', o:['Girasol','Tulipán','Rosa roja','Margarita'], r:2},
  {p:'¿Qué gesto es un símbolo universal de cariño?', o:['Chocar los cinco','Abrazo','Saludo militar','Reverencia'], r:1},
  {p:'¿En qué mes se celebra tradicionalmente San Valentín?', o:['Enero','Febrero','Marzo','Abril'], r:1},
  {p:'¿Qué se dice que representan las bodas de oro?', o:['25 años','40 años','50 años','60 años'], r:2},
  {p:'¿Cuál de estos NO es uno de los 5 lenguajes del amor clásicos?', o:['Contacto físico','Actos de servicio','Sentido del humor','Regalos'], r:2},
  {p:'¿Qué palabra describe compartir gustos y aficiones en pareja?', o:['Compatibilidad','Independencia','Rivalidad','Indiferencia'], r:0},
  {p:'¿Qué se recomienda hacer para mantener viva la chispa en pareja?', o:['Ignorar al otro','Citas frecuentes','Discutir siempre','Evitar hablar'], r:1},
];
const AHORCADO_PALABRAS = [
  'AMOR','ABRAZO','BESO','CARIÑO','TERNURA','ROMANCE','PAREJA','CORAZON','DULZURA','COMPLICIDAD','TERNEZA','CONFIANZA','ALIANZA','FIDELIDAD'
];
const ADIVINA_FRASES = [
  '¿Quién es más probable que llore viendo una película romántica?',
  '¿Quién es más probable que olvide una fecha importante?',
  '¿Quién es más probable que planee la cita perfecta?',
  '¿Quién es más probable que gane en una discusión tonta?',
  '¿Quién es más probable que se quede dormido primero?',
  '¿Quién es más probable que cocine algo delicioso?',
  '¿Quién es más probable que mande un mensaje random de "te amo"?',
  '¿Quién es más probable que gaste de más en un regalo sorpresa?',
  '¿Quién es más probable que cante en la ducha?',
  '¿Quién es más probable que proponga un viaje espontáneo?',
  '¿Quién es más probable que revise el celular del otro por celos?',
  '¿Quién es más probable que se ría en el peor momento?',
  '¿Quién es más probable que recuerde el primer "te quiero"?',
  '¿Quién es más probable que se pierda manejando?',
  '¿Quién es más probable que gane en videojuegos?',
];
let conexionTab = 'recuerdos';
async function renderConexion(){
  const main = document.getElementById('main');
  const SUB = [['recuerdos','💖 Recuerdos'],['love','❤️ Love Language'],['pregunta','🌸 Pregunta del día'],['conversar','💬 Conversar'],['checkin','🌱 Check-in']];
  main.innerHTML = `
    <div class="card" style="padding:12px"><div class="subtabs" style="flex-wrap:wrap">${SUB.map(([k,l])=>`<button data-cx="${k}" class="${conexionTab===k?'active':''}">${l}</button>`).join('')}</div></div>
    <div id="conexionBody"></div>`;
  document.querySelectorAll('[data-cx]').forEach(b=>b.onclick=()=>{ conexionTab=b.dataset.cx; renderConexion(); });
  const body = document.getElementById('conexionBody');
  if(conexionTab==='recuerdos') renderBancoRecuerdos(body);
  else if(conexionTab==='love') renderLoveLanguage(body);
  else if(conexionTab==='pregunta') renderPreguntaDia(body);
  else if(conexionTab==='conversar') renderConversaciones(body);
  else if(conexionTab==='checkin') renderCheckin(body);
}

/* --- Banco de recuerdos --- */
let brFiltro = 'todos';
async function renderBancoRecuerdos(body){
  const CATS = [['todos','Todos'],['anecdota','📔 Anécdotas'],['frase','💬 Frases'],['promesa','🤝 Promesas'],['primera_vez','✨ Primeras veces'],['vergonzoso','🙈 Vergonzosos'],['chiste','😂 Chistes internos'],['apodo','💗 Apodos'],['lugar','📍 Lugares']];
  const { data: items } = await sb.from('banco_recuerdos').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  window._brItems = items||[];
  body.innerHTML = `
    <div class="card">
      <h2>💖 Banco de recuerdos</h2>
      <p class="muted small">Guarden pequeños momentos para no olvidarlos nunca.</p>
      <div class="field"><label>Categoría</label>
        <select id="brCat">${CATS.slice(1).map(([id,l])=>`<option value="${id}">${l}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Cuéntalo</label><textarea id="brTexto" rows="3" placeholder="Escribe el recuerdo..."></textarea></div>
      <button class="btn btn-primary btn-block" onclick="agregarBancoRecuerdo()">Guardar recuerdo</button>
    </div>
    <div class="cat-chip-row" style="overflow-x:auto">${CATS.map(([id,l])=>`<button class="cat-chip ${brFiltro===id?'active':''}" onclick="brFiltro='${id}';renderConexion()">${l}</button>`).join('')}</div>
    <div id="brLista"></div>`;
  pintarBancoRecuerdos();
}
function pintarBancoRecuerdos(){
  const cont = document.getElementById('brLista');
  const items = (window._brItems||[]).filter(a=> brFiltro==='todos' || a.categoria===brFiltro);
  if(!items.length){ cont.innerHTML = `<div class="empty"><span class="ic">💖</span>Aún no hay recuerdos aquí.</div>`; return; }
  cont.innerHTML = items.map(a=>`<div class="card">
    <div style="display:flex;justify-content:space-between;gap:8px">
      <p style="white-space:pre-wrap;flex:1">${esc(a.texto)}</p>
      <div style="display:flex;flex-direction:column;gap:4px">
        <button class="btn btn-sm ${a.favorito?'btn-gold':'btn-outline'}" onclick="toggleFavoritoBanco('${a.id}',${!a.favorito})">⭐</button>
        <button class="btn btn-sm btn-danger" onclick="eliminarBancoRecuerdo('${a.id}')">✕</button>
      </div>
    </div>
    <div class="small muted">${new Date(a.created_at).toLocaleDateString('es-ES')}</div>
  </div>`).join('');
}
async function agregarBancoRecuerdo(){
  const categoria = document.getElementById('brCat').value;
  const texto = document.getElementById('brTexto').value.trim();
  if(!texto){ toast('Escribe el recuerdo'); return; }
  await sb.from('banco_recuerdos').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, categoria, texto});
  await registrarActividad(); toast('Recuerdo guardado 💖'); renderConexion();
}
async function toggleFavoritoBanco(id,val){ await sb.from('banco_recuerdos').update({favorito:val}).eq('id',id); renderConexion(); }
async function eliminarBancoRecuerdo(id){ if(!confirm('¿Eliminar este recuerdo?'))return; await sb.from('banco_recuerdos').delete().eq('id',id); renderConexion(); }

/* --- Love Language Tracker --- */
async function renderLoveLanguage(body){
  const desde = new Date(); desde.setDate(desde.getDate()-7);
  const { data: registros } = await sb.from('love_language_registros').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false}).limit(200);
  const items = registros||[];
  const semana = items.filter(r=>new Date(r.created_at)>=desde);
  const counts = {}; LOVE_LANGUAGES.forEach(l=>counts[l.id]=0);
  semana.forEach(r=>{ if(counts[r.lenguaje]!==undefined) counts[r.lenguaje]++; });
  const total = Math.max(1, semana.length);
  body.innerHTML = `
    <div class="card">
      <h2>❤️ Love Language Tracker</h2>
      <p class="muted small">Registra cómo se expresan cariño hoy.</p>
      <div class="av-options">${LOVE_LANGUAGES.map(l=>`<div class="av-opt" onclick="registrarLoveLanguage('${l.id}')"><span class="ao-icon">${l.icon}</span><span>${l.label}</span></div>`).join('')}</div>
      <div class="field" style="margin-top:10px"><label>Nota (opcional)</label><input id="llNota" placeholder="¿Qué pasó?"></div>
    </div>
    <div class="card">
      <h3>Estadísticas de esta semana</h3>
      ${LOVE_LANGUAGES.map(l=>{ const pct = Math.round((counts[l.id]/total)*100); return `<div style="margin-bottom:10px"><div class="small">${l.icon} ${l.label} · ${counts[l.id]}</div><div style="background:var(--linea);border-radius:99px;height:10px;overflow:hidden;margin-top:4px"><div style="width:${pct}%;height:100%;background:var(--rosa-int)"></div></div></div>`; }).join('')}
      ${!semana.length ? `<div class="empty small">Aún no hay registros esta semana.</div>` : ''}
    </div>
    <div class="section-title">Historial reciente</div>
    ${items.slice(0,20).map(r=>{ const l = LOVE_LANGUAGES.find(x=>x.id===r.lenguaje)||{icon:'💗',label:r.lenguaje}; return `<div class="item-row"><span>${l.icon} ${l.label}${r.nota?` — ${esc(r.nota)}`:''}</span><span class="small muted">${new Date(r.created_at).toLocaleDateString('es-ES')}</span></div>`; }).join('') || ''}`;
}
async function registrarLoveLanguage(lenguaje){
  const nota = (document.getElementById('llNota')?.value||'').trim();
  await sb.from('love_language_registros').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, lenguaje, nota});
  await registrarActividad(); toast('Registrado 💗'); renderConexion();
}

/* --- Pregunta del día --- */
function diaDelAnio(){ const n=new Date(); const inicio=new Date(n.getFullYear(),0,0); return Math.floor((n-inicio)/86400000); }
async function renderPreguntaDia(body){
  const hoy = new Date().toISOString().slice(0,10);
  const pregunta = PREGUNTAS_DIA[diaDelAnio() % PREGUNTAS_DIA.length];
  const { data: respuestas } = await sb.from('pregunta_dia_respuestas').select('*').eq('couple_id', SESSION.coupleId).order('fecha',{ascending:false});
  const items = respuestas||[];
  const deHoy = items.filter(r=>r.fecha===hoy);
  const miRespuestaHoy = deHoy.find(r=>r.autor_id===SESSION.user.id);
  const suRespuestaHoy = deHoy.find(r=>r.autor_id!==SESSION.user.id);
  const ambosRespondieron = miRespuestaHoy && suRespuestaHoy;
  body.innerHTML = `
    <div class="hero">
      <h2>🌸 Pregunta de hoy</h2>
      <p style="font-size:17px;margin-top:6px">${esc(pregunta)}</p>
      ${miRespuestaHoy ? `<div class="card" style="margin-top:12px"><b>Tu respuesta:</b><p>${esc(miRespuestaHoy.respuesta)}</p></div>` : `
        <div class="field" style="margin-top:12px"><textarea id="pdRespuesta" rows="3" placeholder="Escribe tu respuesta..."></textarea></div>
        <button class="btn btn-primary btn-block" onclick="responderPreguntaDia()">Responder</button>`}
      ${miRespuestaHoy && !suRespuestaHoy ? `<div class="empty small" style="margin-top:10px">Esperando la respuesta de tu pareja para desbloquear la suya 🔒</div>` : ''}
      ${ambosRespondieron ? `<div class="card" style="margin-top:10px"><b>Su respuesta:</b><p>${esc(suRespuestaHoy.respuesta)}</p></div>` : ''}
    </div>
    <div class="section-title">Historial de respuestas</div>
    ${items.filter(r=>r.fecha!==hoy && r.autor_id===SESSION.user.id).slice(0,30).map(r=>`<div class="card"><div class="small muted">${new Date(r.fecha).toLocaleDateString('es-ES')}</div><p>${esc(r.pregunta_texto)}</p><p style="font-style:italic">"${esc(r.respuesta)}"</p><button class="btn btn-sm ${r.favorito?'btn-gold':'btn-outline'}" onclick="toggleFavoritoPreguntaDia('${r.id}',${!r.favorito})">⭐ Favorita</button></div>`).join('') || '<div class="empty small">Aún no hay historial.</div>'}`;
}
async function responderPreguntaDia(){
  const respuesta = document.getElementById('pdRespuesta').value.trim();
  if(!respuesta){ toast('Escribe tu respuesta'); return; }
  const hoy = new Date().toISOString().slice(0,10);
  const pregunta = PREGUNTAS_DIA[diaDelAnio() % PREGUNTAS_DIA.length];
  await sb.from('pregunta_dia_respuestas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, fecha:hoy, pregunta_texto:pregunta, respuesta});
  await registrarActividad(); toast('Respuesta guardada 🌸'); renderConexion();
}
async function toggleFavoritoPreguntaDia(id,val){ await sb.from('pregunta_dia_respuestas').update({favorito:val}).eq('id',id); renderConexion(); }

/* --- Conversaciones profundas --- */
let convCategoria = 'romance';
async function renderConversaciones(body){
  const CAT_LABELS = {romance:'💕 Romance',futuro:'🔮 Futuro',familia:'👨‍👩‍👧 Familia',viajes:'✈️ Viajes',dinero:'💰 Dinero',personalidad:'🎭 Personalidad',suenos:'🌙 Sueños',intimidad:'💞 Intimidad emocional',amistades:'👯 Amistades',valores:'🧭 Valores'};
  const { data: respuestas } = await sb.from('conversaciones_respuestas').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  window._convRespuestas = respuestas||[];
  const preguntas = CONVERSACIONES_BANCO[convCategoria]||[];
  const respondidasEnCat = new Set((window._convRespuestas||[]).filter(r=>r.categoria===convCategoria && r.autor_id===SESSION.user.id).map(r=>r.pregunta_texto));
  const disponibles = preguntas.filter(p=>!respondidasEnCat.has(p));
  const pregunta = disponibles.length ? disponibles[Math.floor(Math.random()*disponibles.length)] : preguntas[Math.floor(Math.random()*preguntas.length)];
  body.innerHTML = `
    <div class="card">
      <h2>💬 Conversaciones profundas</h2>
      <p class="muted small">Una biblioteca de preguntas para conocerse más a fondo.</p>
      <div class="cat-chip-row" style="overflow-x:auto">${Object.entries(CAT_LABELS).map(([id,l])=>`<button class="cat-chip ${convCategoria===id?'active':''}" onclick="convCategoria='${id}';renderConexion()">${l}</button>`).join('')}</div>
    </div>
    <div class="hero">
      <p style="font-size:16px">${esc(pregunta)}</p>
      <div class="field" style="margin-top:10px"><textarea id="convRespuesta" rows="3" placeholder="Tu respuesta..."></textarea></div>
      <button class="btn btn-primary btn-block" onclick="responderConversacion('${convCategoria}', '${jsAttr(pregunta)}')">Guardar respuesta</button>
    </div>
    <div class="section-title">Respuestas guardadas en esta categoría</div>
    ${(window._convRespuestas||[]).filter(r=>r.categoria===convCategoria).slice(0,20).map(r=>`<div class="card"><p class="small muted">${esc(r.pregunta_texto)}</p><p>"${esc(r.respuesta)}"</p><div style="display:flex;justify-content:space-between;align-items:center"><span class="small muted">${r.autor_id===SESSION.user.id?'Tú':'Tu pareja'} · ${new Date(r.created_at).toLocaleDateString('es-ES')}</span><button class="btn btn-sm ${r.favorito?'btn-gold':'btn-outline'}" onclick="toggleFavoritoConversacion('${r.id}',${!r.favorito})">⭐</button></div></div>`).join('') || '<div class="empty small">Aún no hay respuestas en esta categoría.</div>'}`;
}
async function responderConversacion(categoria, pregunta_texto){
  const respuesta = document.getElementById('convRespuesta').value.trim();
  if(!respuesta){ toast('Escribe tu respuesta'); return; }
  await sb.from('conversaciones_respuestas').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, categoria, pregunta_texto, respuesta});
  await registrarActividad(); toast('Respuesta guardada 💬'); renderConexion();
}
async function toggleFavoritoConversacion(id,val){ await sb.from('conversaciones_respuestas').update({favorito:val}).eq('id',id); renderConexion(); }

/* --- Check-in emocional semanal --- */
function inicioSemana(){
  const d = new Date(); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
async function renderCheckin(body){
  const semana = inicioSemana();
  const { data: checkins } = await sb.from('checkins_semanales').select('*').eq('couple_id', SESSION.coupleId).order('semana_inicio',{ascending:false});
  const items = checkins||[];
  const deEstaSemana = items.filter(c=>c.semana_inicio===semana);
  const miCheckin = deEstaSemana.find(c=>c.autor_id===SESSION.user.id);
  const suCheckin = deEstaSemana.find(c=>c.autor_id!==SESSION.user.id);
  body.innerHTML = `
    <div class="card">
      <h2>🌱 Check-in emocional semanal</h2>
      <p class="muted small">Semana del ${new Date(semana+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long'})}</p>
      ${miCheckin ? `<div class="empty small">Ya respondiste el check-in de esta semana 💗</div>` : `
        <div class="field"><label>¿Cómo te sentiste esta semana?</label><textarea id="ckSentimiento" rows="2"></textarea></div>
        <div class="field"><label>¿Qué mejorarías?</label><textarea id="ckMejorarias" rows="2"></textarea></div>
        <div class="field"><label>¿Qué agradeces?</label><textarea id="ckAgradeces" rows="2"></textarea></div>
        <button class="btn btn-primary btn-block" onclick="guardarCheckin()">Enviar check-in</button>`}
    </div>
    ${(miCheckin&&suCheckin) ? `<div class="card"><h3>Resumen de la semana</h3><p><b>Tú</b> sentiste: ${esc(miCheckin.sentimiento||'—')}</p><p><b>Tu pareja</b> sintió: ${esc(suCheckin.sentimiento||'—')}</p><p class="small muted" style="margin-top:8px">Ambos respondieron esta semana. Sigan cuidándose 🌱</p></div>` : ''}
    <div class="section-title">Historial</div>
    ${items.filter(c=>c.autor_id===SESSION.user.id).slice(0,12).map(c=>`<div class="card"><div class="small muted">Semana del ${new Date(c.semana_inicio+'T00:00:00').toLocaleDateString('es-ES')}</div><p><b>Sentí:</b> ${esc(c.sentimiento||'—')}</p><p><b>Mejoraría:</b> ${esc(c.mejorarias||'—')}</p><p><b>Agradezco:</b> ${esc(c.agradeces||'—')}</p></div>`).join('') || '<div class="empty small">Sin check-ins anteriores.</div>'}`;
}
async function guardarCheckin(){
  const sentimiento = document.getElementById('ckSentimiento').value.trim();
  const mejorarias = document.getElementById('ckMejorarias').value.trim();
  const agradeces = document.getElementById('ckAgradeces').value.trim();
  await sb.from('checkins_semanales').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, semana_inicio:inicioSemana(), sentimiento, mejorarias, agradeces});
  await registrarActividad(); toast('Check-in guardado 🌱'); renderConexion();
}

/* ================= REGALOS (cupones + caja sorpresa) ================= */
let regalosTab = 'cupones';
const CUPONES_PLANTILLA = ['Vale por un abrazo 🤗','Vale por una cita 💑','Vale por elegir la película 🎬','Vale por desayuno en la cama 🥞','Vale por un masaje 💆','Vale por un día sin quehaceres 🧹'];
async function renderRegalos(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="card" style="padding:12px"><div class="subtabs"><button data-rg="cupones" class="${regalosTab==='cupones'?'active':''}">🎟️ Cupones</button><button data-rg="sorpresa" class="${regalosTab==='sorpresa'?'active':''}">🎀 Caja sorpresa</button><button data-rg="caja" class="${regalosTab==='caja'?'active':''}">🎁 Caja de regalos</button></div></div>
    <div id="regalosBody"></div>`;
  document.querySelectorAll('[data-rg]').forEach(b=>b.onclick=()=>{ regalosTab=b.dataset.rg; renderRegalos(); });
  const body = document.getElementById('regalosBody');
  if(regalosTab==='cupones') renderCupones(body);
  else if(regalosTab==='sorpresa') renderCajaSorpresa(body);
  else renderCajaRegalos(body);
}
async function renderCupones(body){
  const { data: cupones } = await sb.from('cupones').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  const items = cupones||[];
  const activos = items.filter(c=>!c.usado);
  const usados = items.filter(c=>c.usado);
  body.innerHTML = `
    <div class="card">
      <h2>🎟️ Cupones personalizados</h2>
      <div class="cat-chip-row" style="overflow-x:auto">${CUPONES_PLANTILLA.map(t=>`<button class="cat-chip" onclick="crearCuponRapido('${jsAttr(t)}')">${t}</button>`).join('')}</div>
      <div class="field" style="margin-top:10px"><label>Título personalizado</label><input id="cupTitulo" placeholder="Vale por..."></div>
      <div class="field"><label>Descripción (opcional)</label><input id="cupDesc" placeholder="Detalles del vale"></div>
      <button class="btn btn-primary btn-block" onclick="crearCuponPersonalizado()">Crear cupón</button>
    </div>
    <div class="section-title">Cupones disponibles (${activos.length})</div>
    ${activos.map(c=>{
      const esMio = c.autor_id===SESSION.user.id;
      return `<div class="card" style="background:linear-gradient(135deg,var(--rosa),var(--lila))">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div><b>${esc(c.titulo)}</b>${c.descripcion?`<div class="small">${esc(c.descripcion)}</div>`:''}<div class="small muted" style="margin-top:4px">De ${esMio?'ti':'tu pareja'}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <button class="btn btn-sm btn-gold" onclick="canjearCupon('${c.id}')">Canjear</button>
          ${esMio ? `<div style="display:flex;gap:10px">
            <span onclick="editarCupon('${c.id}')" style="cursor:pointer" title="Editar">✏️</span>
            <span class="tag-del" onclick="quitarCupon('${c.id}')" title="Borrar">✕</span>
          </div>` : `<span class="small muted" title="Solo quien lo creó puede editarlo o borrarlo">🔒</span>`}
        </div>
      </div>
    </div>`;}).join('') || '<div class="empty">Sin cupones disponibles.</div>'}
    <div class="section-title">Historial (${usados.length})</div>
    ${usados.slice(0,15).map(c=>`<div class="item-row"><span style="opacity:.6">${esc(c.titulo)}</span><div style="display:flex;align-items:center;gap:10px"><span class="small muted">Usado el ${new Date(c.usado_at).toLocaleDateString('es-ES')}</span>${c.autor_id===SESSION.user.id?`<span class="tag-del" onclick="quitarCupon('${c.id}')" title="Borrar">✕</span>`:''}</div></div>`).join('') || '<div class="empty small">Sin historial aún.</div>'}`;
}
async function crearCuponRapido(titulo){ await sb.from('cupones').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo}); toast('Cupón creado 🎟️'); renderRegalos(); }
async function crearCuponPersonalizado(){
  const titulo = document.getElementById('cupTitulo').value.trim();
  const descripcion = document.getElementById('cupDesc').value.trim();
  if(!titulo){ toast('Escribe un título'); return; }
  await sb.from('cupones').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, descripcion});
  toast('Cupón creado 🎟️'); renderRegalos();
}
async function canjearCupon(id){
  if(!confirm('¿Canjear este cupón?')) return;
  await sb.from('cupones').update({usado:true, usado_at:new Date().toISOString()}).eq('id', id);
  toast('¡Cupón canjeado! 💗'); renderRegalos();
}
async function editarCupon(id){
  const { data: c } = await sb.from('cupones').select('titulo,descripcion,autor_id').eq('id', id).maybeSingle();
  if(!c || c.autor_id!==SESSION.user.id) return;
  const nuevoTitulo = prompt('Editar título del cupón', c.titulo);
  if(nuevoTitulo===null || !nuevoTitulo.trim()) return;
  const nuevaDesc = prompt('Editar descripción (opcional)', c.descripcion||'');
  if(nuevaDesc===null) return;
  await sb.from('cupones').update({titulo:nuevoTitulo.trim(), descripcion:nuevaDesc.trim()||null}).eq('id', id);
  toast('Cupón actualizado ✏️'); renderRegalos();
}
async function quitarCupon(id){
  if(!confirm('¿Borrar este cupón?')) return;
  await sb.from('cupones').delete().eq('id', id);
  toast('Cupón borrado'); renderRegalos();
}

async function renderCajaSorpresa(body){
  const { data: cajas } = await sb.from('caja_sorpresa').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  const items = cajas||[];
  const hoy = new Date();
  body.innerHTML = `
    <div class="card">
      <h2>🎀 Caja sorpresa</h2>
      <p class="muted small">Crea una sorpresa que se desbloquea en la fecha que elijas.</p>
      <div class="field"><label>Título</label><input id="csTitulo" placeholder="Una sorpresa para ti..."></div>
      <div class="field"><label>Mensaje</label><textarea id="csMensaje" rows="3"></textarea></div>
      <div class="field"><label>Foto (opcional)</label><input type="file" id="csFoto" accept="image/*"></div>
      <div class="field"><label>Fecha de desbloqueo</label><input type="date" id="csFecha"></div>
      <button class="btn btn-primary btn-block" id="btnCrearSorpresa" onclick="crearCajaSorpresa()">Crear caja sorpresa 🎀</button>
    </div>
    <div class="section-title">Cajas</div>
    ${items.map(c=>{
      const esMio = c.autor_id===SESSION.user.id;
      const controles = esMio ? `<div style="display:flex;gap:10px;flex-shrink:0">
          <span onclick="editarCajaSorpresa('${c.id}')" style="cursor:pointer" title="Editar">✏️</span>
          <span class="tag-del" onclick="quitarCajaSorpresa('${c.id}')" title="Borrar">✕</span>
        </div>` : '';
      const bloqueada = c.fecha_desbloqueo && new Date(c.fecha_desbloqueo) > hoy;
      if(bloqueada){
        const dias = Math.ceil((new Date(c.fecha_desbloqueo)-hoy)/86400000);
        return `<div class="card locked"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><b>🔒 ${esc(c.titulo)}</b><div class="small muted">Se desbloquea en ${dias} día${dias!==1?'s':''}</div></div>${controles}</div></div>`;
      }
      if(!c.abierta){
        return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><b>🎀 ${esc(c.titulo)}</b><div class="small muted">De ${esMio?'ti':'tu pareja'} · lista para abrir</div></div>${controles}</div><button class="btn btn-sm btn-gold" style="margin-top:8px" onclick="abrirCajaSorpresa('${c.id}')">Abrir</button></div>`;
      }
      return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b>💗 ${esc(c.titulo)}</b>${controles}</div><p style="white-space:pre-wrap;margin-top:6px">${esc(c.mensaje||'')}</p>${c.foto_url?`<img src="${c.foto_url}" style="width:100%;border-radius:12px;margin-top:8px">`:''}</div>`;
    }).join('') || '<div class="empty">Aún no hay cajas sorpresa.</div>'}`;
}
async function editarCajaSorpresa(id){
  const { data: c } = await sb.from('caja_sorpresa').select('titulo,mensaje,autor_id').eq('id', id).maybeSingle();
  if(!c || c.autor_id!==SESSION.user.id) return;
  const nuevoTitulo = prompt('Editar título', c.titulo);
  if(nuevoTitulo===null || !nuevoTitulo.trim()) return;
  const nuevoMensaje = prompt('Editar mensaje', c.mensaje||'');
  if(nuevoMensaje===null) return;
  await sb.from('caja_sorpresa').update({titulo:nuevoTitulo.trim(), mensaje:nuevoMensaje.trim()}).eq('id', id);
  toast('Caja sorpresa actualizada ✏️'); renderRegalos();
}
async function quitarCajaSorpresa(id){
  if(!confirm('¿Borrar esta caja sorpresa?')) return;
  await sb.from('caja_sorpresa').delete().eq('id', id);
  toast('Caja sorpresa borrada'); renderRegalos();
}
async function crearCajaSorpresa(){
  const titulo = document.getElementById('csTitulo').value.trim();
  const mensaje = document.getElementById('csMensaje').value.trim();
  const fecha_desbloqueo = document.getElementById('csFecha').value || null;
  const file = document.getElementById('csFoto').files[0];
  if(!titulo){ toast('Escribe un título'); return; }
  const btn = document.getElementById('btnCrearSorpresa'); btn.innerHTML='<span class="spinner"></span>'; btn.disabled=true;
  let foto_url = null;
  if(file){
    const dataUrl = await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(file); });
    foto_url = await subirImagen(dataUrl, 'album', 'sorpresa');
  }
  const { error } = await sb.from('caja_sorpresa').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, titulo, mensaje, foto_url, fecha_desbloqueo});
  if(error){ toast('No se pudo crear'); console.error(error); btn.disabled=false; btn.textContent='Crear caja sorpresa 🎀'; return; }
  toast('Caja sorpresa creada 🎀'); renderRegalos();
}
async function abrirCajaSorpresa(id){ await sb.from('caja_sorpresa').update({abierta:true}).eq('id', id); renderRegalos(); }

/* ================= JUEGOS ================= */
const VERDADES = ["¿Cuál es tu mayor miedo en esta relación?","¿Qué es algo que nunca me has contado?","¿Cuál fue tu primer pensamiento al verme hoy?","¿Qué es lo más vergonzoso que has hecho por amor?","¿Cuál es tu inseguridad más grande?","¿A quién admirabas antes de conocerme?","¿Cuál ha sido tu peor cita (no conmigo)?","¿Qué es algo que finges que te gusta?"];
const RETOS = ["Cántame tu canción favorita","Hazme una imitación graciosa","Dame un abrazo de 20 segundos","Cuéntame un secreto sin vergüenza","Bailemos una canción juntos","Dime 3 cosas que amas de mí sin pausar","Hazme un cumplido en otro idioma","Mándame un audio cantando"];
const NUNCA_NUNCA = ["Nunca nunca he llorado viendo una película","Nunca nunca he mentido sobre mi edad","Nunca nunca me he quedado dormido/a en una cita","Nunca nunca he stalkeado a un/a ex en redes","Nunca nunca he cantado en la ducha a todo volumen","Nunca nunca he fingido estar enfermo/a para faltar","Nunca nunca he comido algo del piso","Nunca nunca he tenido un crush con un/a famoso/a","Nunca nunca me he perdido en mi propia ciudad","Nunca nunca he roto algo y culpado a alguien más"];
const RULETA_RETOS = ["Dale un beso a tu pareja","Cuenta un chiste malo","Haz 10 sentadillas","Dile un piropo cursi","Cántale una estrofa","Hazle cosquillas por 10 segundos","Dile tu apodo favorito de ella/él","Dale un masaje de hombros por 1 min","Cuéntale algo que te haga feliz hoy","Imita a tu pareja por 10 segundos"];
let juegoActivo = null;
async function renderJuegos(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="card"><h2>🎲 Juegos en pareja</h2><p class="muted small">Elige un juego para divertirse un rato.</p></div>
    <div class="av-options" id="juegosMenu">
      <div class="av-opt" onclick="juegoActivo='vor';renderJuegos()"><span class="ao-icon">🎯</span><span>Verdad o reto</span></div>
      <div class="av-opt" onclick="juegoActivo='nunca';renderJuegos()"><span class="ao-icon">🙊</span><span>Nunca nunca</span></div>
      <div class="av-opt" onclick="juegoActivo='ruleta';renderJuegos()"><span class="ao-icon">🎡</span><span>Ruleta de retos</span></div>
      <div class="av-opt" onclick="juegoActivo='rapidas';renderJuegos()"><span class="ao-icon">⚡</span><span>Preguntas rápidas</span></div>
      <div class="av-opt" onclick="juegoActivo='conecta4';renderJuegos()"><span class="ao-icon">🔴🟡</span><span>4 en línea</span></div>
      <div class="av-opt" onclick="juegoActivo='trivia';renderJuegos()"><span class="ao-icon">❓</span><span>Trivia</span></div>
      <div class="av-opt" onclick="juegoActivo='memorama';renderJuegos()"><span class="ao-icon">🧠</span><span>Memorama</span></div>
      <div class="av-opt" onclick="juegoActivo='ahorcado';renderJuegos()"><span class="ao-icon">🔤</span><span>Ahorcado</span></div>
      <div class="av-opt" onclick="juegoActivo='bingo';renderJuegos()"><span class="ao-icon">🎱</span><span>Bingo</span></div>
      <div class="av-opt" onclick="juegoActivo='rompecabezas';renderJuegos()"><span class="ao-icon">🧩</span><span>Rompecabezas</span></div>
      <div class="av-opt" onclick="juegoActivo='adivina';renderJuegos()"><span class="ao-icon">🔮</span><span>Adivina quién</span></div>
    </div>
    <div id="juegoBody"></div>`;
  const jb = document.getElementById('juegoBody');
  try{
    if(juegoActivo==='vor') pintarVerdadOReto(jb);
    else if(juegoActivo==='nunca') pintarNuncaNunca(jb);
    else if(juegoActivo==='ruleta') pintarRuletaRetos(jb);
    else if(juegoActivo==='rapidas') pintarPreguntasRapidas(jb);
    else if(juegoActivo==='conecta4') await pintarConecta4(jb);
    else if(juegoActivo==='trivia') pintarTrivia(jb);
    else if(juegoActivo==='memorama') pintarMemorama(jb);
    else if(juegoActivo==='ahorcado') pintarAhorcado(jb);
    else if(juegoActivo==='bingo') pintarBingo(jb);
    else if(juegoActivo==='rompecabezas') pintarRompecabezas(jb);
    else if(juegoActivo==='adivina') await pintarAdivinaQuien(jb);
  }catch(e){
    console.error('Error al abrir el juego', e);
    jb.innerHTML = '<div class="hero" style="text-align:center"><p class="small muted">No se pudo abrir este juego. Intenta de nuevo.</p></div>';
  }
}
function pintarVerdadOReto(jb){
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🎯 Verdad o Reto</h3>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:10px">
      <button class="btn btn-primary" onclick="sacarCarta('verdad')">Verdad</button>
      <button class="btn btn-gold" onclick="sacarCarta('reto')">Reto</button>
    </div>
    <p id="cartaVoR" style="font-size:17px;margin-top:16px;min-height:50px"></p>
  </div>`;
}
function sacarCarta(tipo){
  const banco = tipo==='verdad' ? VERDADES : RETOS;
  document.getElementById('cartaVoR').textContent = banco[Math.floor(Math.random()*banco.length)];
}
function pintarNuncaNunca(jb){
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🙊 Nunca nunca</h3>
    <p id="cartaNunca" style="font-size:17px;margin:14px 0;min-height:50px">${NUNCA_NUNCA[0]}</p>
    <button class="btn btn-primary" onclick="siguienteNunca()">Siguiente frase</button>
  </div>`;
}
function siguienteNunca(){ document.getElementById('cartaNunca').textContent = NUNCA_NUNCA[Math.floor(Math.random()*NUNCA_NUNCA.length)]; }
function pintarRuletaRetos(jb){
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🎡 Ruleta de retos</h3>
    <p id="cartaRuleta" style="font-size:17px;margin:14px 0;min-height:50px">¡Gira para tu reto!</p>
    <button class="btn btn-gold" onclick="girarRuleta()">Girar 🎡</button>
  </div>`;
}
function girarRuleta(){
  const el = document.getElementById('cartaRuleta');
  el.textContent = '🎡 girando...';
  setTimeout(()=>{ el.textContent = RULETA_RETOS[Math.floor(Math.random()*RULETA_RETOS.length)]; }, 500);
}
function pintarPreguntasRapidas(jb){
  const todas = Object.values(CONVERSACIONES_BANCO).flat();
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>⚡ Preguntas rápidas</h3>
    <p id="cartaRapida" style="font-size:17px;margin:14px 0;min-height:50px">${todas[Math.floor(Math.random()*todas.length)]}</p>
    <button class="btn btn-primary" onclick="siguientePreguntaRapida()">Siguiente</button>
  </div>`;
}
function siguientePreguntaRapida(){
  const todas = Object.values(CONVERSACIONES_BANCO).flat();
  document.getElementById('cartaRapida').textContent = todas[Math.floor(Math.random()*todas.length)];
}
/* ---- 4 en línea (Conecta 4) ---- */
async function pintarConecta4(jb){
  const demo = isDemoMode();
  let g, soloLocal = demo;
  if(demo){
    g = (window._c4State) || { board:Array(42).fill(null), turno:null, ganador:null };
  } else {
    try{
      const { data, error } = await sb.from('extras').select('conecta4').eq('couple_id', SESSION.coupleId).maybeSingle();
      if(error) throw error;
      g = (data && data.conecta4 && data.conecta4.board) ? data.conecta4 : { board:Array(42).fill(null), turno:null, ganador:null };
    }catch(e){
      console.error('No se pudo leer 4 en línea, se usará estado local', e);
      g = window._c4State || { board:Array(42).fill(null), turno:null, ganador:null };
      soloLocal = true;
    }
  }
  window._c4State = g;
  window._c4Local = soloLocal;
  const miTurno = (demo||soloLocal) ? true : (!g.turno || g.turno === SESSION.slot);
  let mensaje;
  if(g.ganador==='empate') mensaje = '¡Empate!';
  else if(g.ganador) mensaje = (demo||soloLocal) ? `¡Ganó ${g.ganador==='P1'?'🔴':'🟡'}! 🎉` : (g.ganador===SESSION.slot ? '¡Ganaste! 🎉' : 'Tu pareja ganó 💗');
  else if(demo||soloLocal) mensaje = g.turno ? `Turno de ${g.turno==='P1'?'🔴':'🟡'}` : 'Empieza quien quiera';
  else mensaje = miTurno ? 'Tu turno' : 'Turno de tu pareja';
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🔴🟡 4 en línea</h3>
    ${soloLocal && !demo ? '<p class="small muted">⚠️ Jugando solo en este dispositivo (no se pudo sincronizar con tu pareja).</p>' : ''}
    <p class="small">${mensaje}</p>
    <div style="display:grid;grid-template-columns:repeat(7,36px);gap:4px;justify-content:center;margin:14px auto;background:var(--superficie);padding:8px;border-radius:12px">
      ${Array.from({length:7}).map((_,c)=>`<button onclick="jugarConecta4(${c})" style="width:36px;height:28px;border-radius:8px;border:1.5px solid var(--linea);background:var(--crema);font-size:12px" ${g.ganador||!miTurno?'disabled':''}>⬇</button>`).join('')}
      ${g.board.map((v,i)=>`<div style="width:36px;height:36px;border-radius:50%;background:${v==='P1'?'#ef6b7a':v==='P2'?'#f2c14e':'var(--crema)'};border:1.5px solid var(--linea)"></div>`).join('')}
    </div>
    <button class="btn btn-outline" onclick="reiniciarConecta4()">Reiniciar juego</button>
  </div>`;
}
function ganadorConecta4(board){
  const filas=6, cols=7;
  const at=(r,c)=>board[r*cols+c];
  for(let r=0;r<filas;r++)for(let c=0;c<cols;c++){
    const v = at(r,c); if(!v) continue;
    if(c<=cols-4 && v===at(r,c+1)&&v===at(r,c+2)&&v===at(r,c+3)) return v;
    if(r<=filas-4 && v===at(r+1,c)&&v===at(r+2,c)&&v===at(r+3,c)) return v;
    if(r<=filas-4 && c<=cols-4 && v===at(r+1,c+1)&&v===at(r+2,c+2)&&v===at(r+3,c+3)) return v;
    if(r>=3 && c<=cols-4 && v===at(r-1,c+1)&&v===at(r-2,c+2)&&v===at(r-3,c+3)) return v;
  }
  if(board.every(c=>c)) return 'empate';
  return null;
}
async function jugarConecta4(col){
  const g = window._c4State;
  const demo = isDemoMode();
  const soloLocal = demo || window._c4Local;
  if(!g || g.ganador) return;
  if(!soloLocal && g.turno && g.turno!==SESSION.slot) return;
  const cols=7, filas=6;
  let fila=-1;
  for(let r=filas-1;r>=0;r--){ if(!g.board[r*cols+col]){ fila=r; break; } }
  if(fila<0) return;
  const jugador = soloLocal ? (g.turno || 'P1') : (g.turno || SESSION.slot);
  g.board[fila*cols+col] = jugador;
  g.ganador = ganadorConecta4(g.board);
  g.turno = jugador==='P1' ? 'P2' : 'P1';
  if(soloLocal){
    window._c4State = g;
  } else {
    try{
      const { error } = await sb.from('extras').upsert({couple_id:SESSION.coupleId, conecta4:g, updated_at:new Date().toISOString()}, {onConflict:'couple_id'});
      if(error) throw error;
      if(g.ganador && g.ganador!=='empate') await registrarJuegoGanado();
    }catch(e){
      console.error('No se pudo guardar la jugada, se sigue localmente', e);
      window._c4Local = true;
      toast('No se pudo sincronizar, seguimos jugando en este dispositivo');
    }
  }
  renderJuegos();
}
async function reiniciarConecta4(){
  const g = { board:Array(42).fill(null), turno:null, ganador:null };
  if(isDemoMode() || window._c4Local){ window._c4State = g; } else {
    try{ await upsertExtras({conecta4:g}); }catch(e){ console.error(e); window._c4State = g; window._c4Local = true; }
  }
  renderJuegos();
}

/* ---- Trivia ---- */
function pintarTrivia(jb){
  if(!window._triviaState || window._triviaState.terminado){
    window._triviaState = { idx:0, score:0, orden: [...TRIVIA_PREGUNTAS.keys()].sort(()=>Math.random()-.5), respondida:false };
  }
  const st = window._triviaState;
  if(st.idx >= st.orden.length){
    const pct = Math.round((st.score/TRIVIA_PREGUNTAS.length)*100);
    st.terminado = true;
    jb.innerHTML = `<div class="hero" style="text-align:center">
      <h3>❓ Trivia</h3>
      <p style="font-size:20px;margin:14px 0">¡Terminaron! Puntaje: <b>${st.score}/${TRIVIA_PREGUNTAS.length}</b> (${pct}%)</p>
      <button class="btn btn-primary" onclick="reiniciarTrivia()">Jugar de nuevo</button>
    </div>`;
    if(pct>=70) registrarJuegoGanado(); else registrarActividad();
    return;
  }
  const q = TRIVIA_PREGUNTAS[st.orden[st.idx]];
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>❓ Trivia · Pregunta ${st.idx+1}/${TRIVIA_PREGUNTAS.length}</h3>
    <p style="font-size:16px;margin:10px 0">${esc(q.p)}</p>
    <div class="av-options" id="triviaOpts">${q.o.map((o,i)=>`<div class="av-opt" onclick="responderTrivia(${i})">${esc(o)}</div>`).join('')}</div>
    <p class="small muted" style="margin-top:8px">Puntaje actual: ${st.score}</p>
  </div>`;
}
function responderTrivia(i){
  const st = window._triviaState;
  if(st.respondida) return;
  st.respondida = true;
  const q = TRIVIA_PREGUNTAS[st.orden[st.idx]];
  const correcto = i===q.r;
  if(correcto) st.score++;
  const opts = document.querySelectorAll('#triviaOpts .av-opt');
  opts.forEach((el,idx)=>{
    if(idx===q.r) el.style.outline = '2px solid var(--ok)';
    if(idx===i && !correcto) el.style.outline = '2px solid var(--rosa-int)';
  });
  toast(correcto?'¡Correcto! ✨':'Casi, la próxima 💗');
  setTimeout(()=>{ st.idx++; st.respondida=false; pintarTrivia(document.getElementById('juegoBody')); }, 900);
}
function reiniciarTrivia(){ window._triviaState = null; pintarTrivia(document.getElementById('juegoBody')); }

/* ---- Memorama ---- */
const MEMORAMA_EMOJIS = ['💗','🌸','✨','🌙','💌','🐰','🍓','🎀'];
function pintarMemorama(jb){
  if(!window._memoState){
    const pares = [...MEMORAMA_EMOJIS, ...MEMORAMA_EMOJIS].sort(()=>Math.random()-.5);
    window._memoState = { cartas: pares.map(e=>({emoji:e, volteada:false, encontrada:false})), primera:null, segunda:null, movimientos:0, bloqueado:false };
  }
  const st = window._memoState;
  const encontradas = st.cartas.filter(c=>c.encontrada).length;
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🧠 Memorama</h3>
    <p class="small">Movimientos: ${st.movimientos} · Pares encontrados: ${encontradas/2}/${MEMORAMA_EMOJIS.length}</p>
    <div style="display:grid;grid-template-columns:repeat(4,52px);gap:6px;justify-content:center;margin:14px auto">
      ${st.cartas.map((c,i)=>`<button onclick="voltearMemorama(${i})" style="width:52px;height:52px;font-size:24px;border-radius:10px;border:1.5px solid var(--linea);background:${c.encontrada?'var(--dorado)':'var(--superficie)'}" ${c.encontrada||st.bloqueado?'disabled':''}>${c.volteada||c.encontrada?c.emoji:'❓'}</button>`).join('')}
    </div>
    <button class="btn btn-outline" onclick="reiniciarMemorama()">Reiniciar juego</button>
  </div>`;
  if(encontradas === st.cartas.length){ registrarJuegoGanado(); }
}
function voltearMemorama(i){
  const st = window._memoState;
  if(st.bloqueado || st.cartas[i].volteada || st.cartas[i].encontrada) return;
  st.cartas[i].volteada = true;
  if(st.primera===null){ st.primera = i; pintarMemorama(document.getElementById('juegoBody')); return; }
  st.segunda = i;
  st.movimientos++;
  pintarMemorama(document.getElementById('juegoBody'));
  const a = st.cartas[st.primera], b = st.cartas[st.segunda];
  if(a.emoji === b.emoji){
    a.encontrada = true; b.encontrada = true;
    st.primera = null; st.segunda = null;
    pintarMemorama(document.getElementById('juegoBody'));
  } else {
    st.bloqueado = true;
    setTimeout(()=>{
      a.volteada = false; b.volteada = false;
      st.primera = null; st.segunda = null; st.bloqueado = false;
      pintarMemorama(document.getElementById('juegoBody'));
    }, 700);
  }
}
function reiniciarMemorama(){ window._memoState = null; pintarMemorama(document.getElementById('juegoBody')); }

/* ---- Ahorcado ---- */
function pintarAhorcado(jb){
  if(!window._ahorcadoState){
    window._ahorcadoState = { palabra: AHORCADO_PALABRAS[Math.floor(Math.random()*AHORCADO_PALABRAS.length)], adivinadas:[], fallos:0, maxFallos:6 };
  }
  const st = window._ahorcadoState;
  const palabraMostrada = st.palabra.split('').map(l=>st.adivinadas.includes(l)?l:'_').join(' ');
  const gano = !palabraMostrada.includes('_');
  const perdio = st.fallos >= st.maxFallos;
  const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🔤 Ahorcado</h3>
    <p style="font-size:26px;margin-bottom:4px">${['🙂','😐','😕','😟','😨','😱','💀'][st.fallos]}</p>
    <p class="small">Fallos: ${st.fallos}/${st.maxFallos}</p>
    <p style="font-size:26px;letter-spacing:6px;margin:14px 0">${gano||perdio ? st.palabra.split('').join(' ') : palabraMostrada}</p>
    ${gano?`<p style="color:var(--ok);font-weight:700">¡Adivinaron la palabra! 🎉</p>`:''}
    ${perdio?`<p style="color:var(--rosa-int);font-weight:700">Se acabaron los intentos 💔</p>`:''}
    ${!gano && !perdio ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:320px;margin:0 auto">
      ${letras.map(l=>`<button onclick="adivinarLetraAhorcado('${l}')" style="width:30px;height:34px;border-radius:8px;border:1.5px solid var(--linea);background:var(--superficie)" ${st.adivinadas.includes(l)?'disabled':''}>${l}</button>`).join('')}
    </div>` : ''}
    <button class="btn btn-outline" style="margin-top:12px" onclick="reiniciarAhorcado()">Nueva palabra</button>
  </div>`;
  if(gano && !st._celebrado){ st._celebrado = true; registrarJuegoGanado(); }
}
function adivinarLetraAhorcado(letra){
  const st = window._ahorcadoState;
  if(st.adivinadas.includes(letra)) return;
  st.adivinadas.push(letra);
  if(!st.palabra.includes(letra)) st.fallos++;
  pintarAhorcado(document.getElementById('juegoBody'));
}
function reiniciarAhorcado(){ window._ahorcadoState = null; pintarAhorcado(document.getElementById('juegoBody')); }

/* ---- Bingo ---- */
function generarCartonBingo(){
  const rangos = [[1,15],[16,30],[31,45],[46,60],[61,75]];
  const cols = rangos.map(([min,max])=>{
    const nums = []; while(nums.length<5){ const n = min+Math.floor(Math.random()*(max-min+1)); if(!nums.includes(n)) nums.push(n); }
    return nums;
  });
  const card = [];
  for(let r=0;r<5;r++) for(let c=0;c<5;c++) card.push(r===2&&c===2 ? 'FREE' : cols[c][r]);
  return card;
}
function pintarBingo(jb){
  if(!window._bingoState){
    window._bingoState = { card: generarCartonBingo(), marcados: new Set(['FREE']), cantados: [] };
  }
  const st = window._bingoState;
  const gano = comprobarBingo(st);
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🎱 Bingo</h3>
    <p class="small">Número cantado: <b>${st.cantados.length?st.cantados[st.cantados.length-1]:'—'}</b> · Cantados: ${st.cantados.length}</p>
    <div style="display:grid;grid-template-columns:repeat(5,50px);gap:5px;justify-content:center;margin:14px auto">
      ${['B','I','N','G','O'].map(l=>`<div style="font-weight:800;color:var(--dorado)">${l}</div>`).join('')}
      ${st.card.map((n,i)=>`<button onclick="marcarBingo(${i})" style="width:50px;height:44px;border-radius:8px;border:1.5px solid var(--linea);background:${st.marcados.has(n)?'var(--dorado)':'var(--superficie)'};font-size:13px;font-weight:700">${n}</button>`).join('')}
    </div>
    ${gano?`<p style="color:var(--ok);font-weight:700">¡BINGO! 🎉</p>`:''}
    <button class="btn btn-gold" onclick="cantarBingo()">Cantar número 🎱</button>
    <button class="btn btn-outline" style="margin-top:8px" onclick="reiniciarBingo()">Cartón nuevo</button>
  </div>`;
  if(gano && !st._celebrado){ st._celebrado = true; registrarJuegoGanado(); }
}
function cantarBingo(){
  const st = window._bingoState;
  const disponibles = []; for(let n=1;n<=75;n++) if(!st.cantados.includes(n)) disponibles.push(n);
  if(!disponibles.length){ toast('¡Ya se cantaron todos los números!'); return; }
  const n = disponibles[Math.floor(Math.random()*disponibles.length)];
  st.cantados.push(n);
  pintarBingo(document.getElementById('juegoBody'));
}
function marcarBingo(i){
  const st = window._bingoState;
  const val = st.card[i];
  if(val==='FREE' || st.cantados.includes(val)) st.marcados.add(val);
  else toast('Ese número aún no ha sido cantado');
  pintarBingo(document.getElementById('juegoBody'));
}
function comprobarBingo(st){
  for(let r=0;r<5;r++){ if([0,1,2,3,4].every(c=>st.marcados.has(st.card[r*5+c]))) return true; }
  for(let c=0;c<5;c++){ if([0,1,2,3,4].every(r=>st.marcados.has(st.card[r*5+c]))) return true; }
  if([0,1,2,3,4].every(i=>st.marcados.has(st.card[i*5+i]))) return true;
  if([0,1,2,3,4].every(i=>st.marcados.has(st.card[i*5+(4-i)]))) return true;
  return false;
}
function reiniciarBingo(){ window._bingoState = null; pintarBingo(document.getElementById('juegoBody')); }

/* ---- Rompecabezas (puzzle deslizante) ---- */
const PUZZLE_EMOJIS = ['💗','🌸','✨','🌙','💌','🐰','🍓','🎀'];
function pintarRompecabezas(jb){
  if(!window._puzzleState){
    let tiles;
    do { tiles = [...PUZZLE_EMOJIS, null].sort(()=>Math.random()-.5); } while(!puzzleResoluble(tiles) || puzzleGanado(tiles));
    window._puzzleState = { tiles };
  }
  const st = window._puzzleState;
  const gano = puzzleGanado(st.tiles);
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🧩 Rompecabezas</h3>
    ${gano?`<p style="color:var(--ok);font-weight:700">¡Lo lograron! 🎉</p>`:'<p class="small">Ordena las fichas deslizando junto al espacio vacío</p>'}
    <div style="display:grid;grid-template-columns:repeat(3,60px);gap:6px;justify-content:center;margin:14px auto">
      ${st.tiles.map((t,i)=>`<button onclick="moverPuzzle(${i})" style="width:60px;height:60px;font-size:26px;border-radius:10px;border:1.5px solid var(--linea);background:${t?'var(--superficie)':'transparent'};box-shadow:${t?'':'none'}" ${!t?'disabled':''}>${t||''}</button>`).join('')}
    </div>
    <button class="btn btn-outline" onclick="reiniciarPuzzle()">Mezclar de nuevo</button>
  </div>`;
  if(gano && !st._celebrado){ st._celebrado = true; registrarJuegoGanado(); }
}
function puzzleGanado(tiles){ return PUZZLE_EMOJIS.every((e,i)=>tiles[i]===e) && tiles[8]===null; }
function puzzleResoluble(){ return true; } // con 8 fichas móviles cualquier mezcla aleatoria es jugable en la práctica
function moverPuzzle(i){
  const st = window._puzzleState;
  const vacio = st.tiles.indexOf(null);
  const filaI=Math.floor(i/3), colI=i%3, filaV=Math.floor(vacio/3), colV=vacio%3;
  const adyacente = (Math.abs(filaI-filaV)+Math.abs(colI-colV))===1;
  if(!adyacente) return;
  [st.tiles[i], st.tiles[vacio]] = [st.tiles[vacio], st.tiles[i]];
  pintarRompecabezas(document.getElementById('juegoBody'));
}
function reiniciarPuzzle(){ window._puzzleState = null; pintarRompecabezas(document.getElementById('juegoBody')); }

/* ---- Adivina quién (respondido de forma independiente y luego se revela) ---- */
async function pintarAdivinaQuien(jb){
  const { data } = await sb.from('extras').select('adivina').eq('couple_id', SESSION.coupleId).maybeSingle();
  const g = (data && data.adivina && typeof data.adivina.idx==='number') ? data.adivina : { idx:0, respuestas:{} };
  window._adivinaState = g;
  const frase = ADIVINA_FRASES[g.idx % ADIVINA_FRASES.length];
  const miRespuesta = g.respuestas[SESSION.slot];
  const suRespuesta = g.respuestas[otroSlot()];
  const ambosRespondieron = miRespuesta && suRespuesta;
  jb.innerHTML = `<div class="hero" style="text-align:center">
    <h3>🔮 Adivina quién</h3>
    <p style="font-size:17px;margin:14px 0;min-height:40px">${esc(frase)}</p>
    ${!miRespuesta ? `<div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-primary" onclick="responderAdivina('yo')">Yo 🙋</button>
      <button class="btn btn-gold" onclick="responderAdivina('pareja')">Mi pareja 💗</button>
    </div>` : (!ambosRespondieron ? `<p class="small muted">Ya respondiste, esperando a tu pareja... ⏳</p>` : `
      <p class="small">Tú dijiste: <b>${miRespuesta==='yo'?'Yo':'Mi pareja'}</b> · Tu pareja dijo: <b>${suRespuesta==='yo'?'Yo mismo/a':'Mi pareja (tú)'}</b></p>
      <p style="font-weight:700;margin-top:8px">${
        (miRespuesta==='yo' && suRespuesta==='pareja') || (miRespuesta==='pareja' && suRespuesta==='yo')
          ? '¡Coinciden! 🎉' : (miRespuesta===suRespuesta && miRespuesta==='yo' ? 'Cada quien piensa que es sí mismo 😅' : 'Cada quien piensa que es el otro 👀')
      }</p>
      <button class="btn btn-primary" style="margin-top:10px" onclick="siguienteAdivina()">Siguiente frase</button>
    `)}
  </div>`;
}
async function responderAdivina(valor){
  const g = window._adivinaState;
  g.respuestas = g.respuestas || {};
  g.respuestas[SESSION.slot] = valor;
  await upsertExtras({adivina:g});
  await registrarActividad();
  renderJuegos();
}
async function siguienteAdivina(){
  const g = { idx: (window._adivinaState.idx+1) % ADIVINA_FRASES.length, respuestas:{} };
  await upsertExtras({adivina:g});
  renderJuegos();
}

/* ================= COMPATIBILIDAD + MBTI ================= */
const COMPAT_PREGUNTAS = {
  comunicacion: [
    {id:'com1', texto:'Cuando algo me molesta prefiero...', opciones:['Hablarlo de inmediato','Pensarlo antes de hablar','Esperar a que se me pase']},
    {id:'com2', texto:'En una discusión yo tiendo a...', opciones:['Buscar resolverlo rápido','Necesitar espacio primero','Analizarlo con calma']},
    {id:'com3', texto:'Prefiero que me digan las cosas...', opciones:['Directamente y sin rodeos','Con delicadeza','Con ejemplos y contexto']},
    {id:'com4', texto:'Mi forma de disculparme es...', opciones:['Con palabras claras','Con actos','Con tiempo y espacio']},
  ],
  finanzas: [
    {id:'fin1', texto:'Mi relación con el dinero es...', opciones:['Ahorrador/a','Gasto en experiencias','Un poco de ambos']},
    {id:'fin2', texto:'Prefiero que las finanzas en pareja sean...', opciones:['Compartidas totalmente','Separadas pero coordinadas','Cada quien lo suyo']},
    {id:'fin3', texto:'Ante un gasto grande imprevisto yo...', opciones:['Reviso el presupuesto','Lo resuelvo y ya','Me estreso bastante']},
    {id:'fin4', texto:'Para mí el dinero representa...', opciones:['Seguridad','Libertad','Experiencias']},
  ],
  viajes: [
    {id:'via1', texto:'Mi estilo de viaje es...', opciones:['Todo planificado','Improvisar sobre la marcha','Un plan flexible']},
    {id:'via2', texto:'Prefiero viajar a...', opciones:['Playa','Montaña o naturaleza','Ciudades']},
    {id:'via3', texto:'Mi presupuesto de viaje es...', opciones:['Ajustado y cuidadoso','Flexible','Sin límite si se puede']},
    {id:'via4', texto:'Prefiero viajes de...', opciones:['Aventura y actividad','Descanso total','Cultura y descubrimiento']},
  ],
  crianza: [
    {id:'cri1', texto:'Sobre tener hijos/as pienso...', opciones:['Definitivamente sí','Definitivamente no','Aún no lo sé']},
    {id:'cri2', texto:'Mi estilo de crianza sería...', opciones:['Estructurado con reglas claras','Flexible y cercano','Depende del momento']},
    {id:'cri3', texto:'La disciplina para mí es...', opciones:['Importante y consistente','Con diálogo, no castigo','Un balance de ambos']},
    {id:'cri4', texto:'Sobre mascotas pienso...', opciones:['Me encantan, sí o sí','Puede que alguna','Prefiero no tener']},
  ],
  organizacion: [
    {id:'org1', texto:'Mi casa ideal es...', opciones:['Muy ordenada siempre','Cómoda aunque desordenada','Organizada por zonas']},
    {id:'org2', texto:'Con las tareas del hogar prefiero...', opciones:['Repartir por turnos','Cada quien lo suyo','Lo que se necesite en el momento']},
    {id:'org3', texto:'Mi rutina diaria es...', opciones:['Muy estructurada','Bastante libre','Depende del día']},
    {id:'org4', texto:'Ante los planes prefiero...', opciones:['Agendar con anticipación','Decidir el mismo día','Un poco de ambos']},
  ],
  objetivos: [
    {id:'obj1', texto:'En 5 años me veo...', opciones:['Estable en un solo lugar','Explorando nuevos horizontes','Enfocado/a en mi carrera']},
    {id:'obj2', texto:'El éxito para mí es...', opciones:['Estabilidad y familia','Libertad y experiencias','Logros profesionales']},
    {id:'obj3', texto:'Mi prioridad de vida ahora es...', opciones:['La relación','El crecimiento personal','El trabajo/carrera']},
    {id:'obj4', texto:'Sobre mudarme de ciudad/país...', opciones:['Encantado/a de la idea','Solo si es necesario','Prefiero quedarme']},
  ],
  idiomas_amor: [
    {id:'idi1', texto:'Me siento más amado/a cuando...', opciones:['Me lo dicen con palabras','Pasamos tiempo juntos','Me ayudan con algo']},
    {id:'idi2', texto:'Prefiero recibir...', opciones:['Un regalo pensado','Un abrazo largo','Un cumplido sincero']},
    {id:'idi3', texto:'Demuestro cariño principalmente...', opciones:['Con actos de servicio','Con contacto físico','Con palabras']},
    {id:'idi4', texto:'Lo que más agradezco de mi pareja es...', opciones:['Que me escuche','Que esté presente','Que me ayude sin pedirlo']},
  ],
};
let compatCategoria = 'comunicacion';
