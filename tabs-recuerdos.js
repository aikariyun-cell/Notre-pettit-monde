async function renderCompatibilidad(){
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="card" style="padding:12px"><div class="subtabs"><button data-cp="test" class="active">🧩 Test de compatibilidad</button><button data-cp="mbti">🧠 MBTI</button></div></div>
    <div id="compatBody"></div>`;
  let compatTab = 'test';
  document.querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('[data-cp]').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    compatTab = b.dataset.cp;
    const body = document.getElementById('compatBody');
    if(compatTab==='test') renderTestCompatibilidad(body); else renderMBTI(body);
  });
  renderTestCompatibilidad(document.getElementById('compatBody'));
}
async function renderTestCompatibilidad(body){
  const CAT_LABELS = {comunicacion:'💬 Comunicación',finanzas:'💰 Finanzas',viajes:'✈️ Viajes',crianza:'👶 Crianza',organizacion:'🧺 Organización',objetivos:'🎯 Objetivos de vida',idiomas_amor:'❤️ Idiomas del amor'};
  const { data: respuestas } = await sb.from('compatibilidad_respuestas').select('*').eq('couple_id', SESSION.coupleId);
  const items = respuestas||[];
  const misRespuestas = {}; items.filter(r=>r.autor_id===SESSION.user.id).forEach(r=>misRespuestas[r.pregunta_id]=r.respuesta);
  const susRespuestas = {}; items.filter(r=>r.autor_id!==SESSION.user.id).forEach(r=>susRespuestas[r.pregunta_id]=r.respuesta);
  const preguntas = COMPAT_PREGUNTAS[compatCategoria]||[];
  let coincidencias=0, totalComparado=0;
  Object.values(COMPAT_PREGUNTAS).flat().forEach(p=>{ if(misRespuestas[p.id] && susRespuestas[p.id]){ totalComparado++; if(misRespuestas[p.id]===susRespuestas[p.id]) coincidencias++; } });
  const compatGeneral = totalComparado ? Math.round((coincidencias/totalComparado)*100) : null;
  body.innerHTML = `
    ${compatGeneral!==null ? `<div class="hero" style="text-align:center"><h2>🧩 Compatibilidad general</h2><p style="font-size:38px;font-weight:800;color:var(--rosa-int)">${compatGeneral}%</p><p class="small muted">Basado en ${totalComparado} preguntas respondidas por ambos</p></div>` : `<div class="card"><p class="muted small">Respondan las preguntas y cuando ambos hayan contestado verán su % de compatibilidad.</p></div>`}
    <div class="card"><div class="cat-chip-row" style="overflow-x:auto">${Object.entries(CAT_LABELS).map(([id,l])=>`<button class="cat-chip ${compatCategoria===id?'active':''}" onclick="compatCategoria='${id}';renderCompatibilidad()">${l}</button>`).join('')}</div></div>
    ${preguntas.map(p=>`<div class="card">
      <p><b>${esc(p.texto)}</b></p>
      <div class="av-options">${p.opciones.map(o=>`<div class="av-opt ${misRespuestas[p.id]===o?'active':''}" onclick="responderCompat('${p.id}', '${jsAttr(o)}')">${esc(o)}</div>`).join('')}</div>
      ${misRespuestas[p.id] && susRespuestas[p.id] ? `<div class="small muted" style="margin-top:6px">${misRespuestas[p.id]===susRespuestas[p.id]?'✅ Coinciden':'🔄 Respuestas distintas'} — tu pareja: "${esc(susRespuestas[p.id])}"</div>` : (misRespuestas[p.id] ? `<div class="small muted" style="margin-top:6px">Esperando la respuesta de tu pareja...</div>` : '')}
    </div>`).join('')}`;
}
async function responderCompat(pregunta_id, respuesta){
  await sb.from('compatibilidad_respuestas').upsert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, categoria:compatCategoria, pregunta_id, respuesta}, {onConflict:'couple_id,autor_id,pregunta_id'});
  renderTestCompatibilidad(document.getElementById('compatBody'));
}

const MBTI_PREGUNTAS = [
  {eje:'ei', texto:'En una fiesta, prefiero...', a:'Conversar con muchas personas', b:'Hablar profundo con pocas personas'},
  {eje:'ei', texto:'Recargo energía...', a:'Estando con gente', b:'Estando a solas'},
  {eje:'ei', texto:'Prefiero...', a:'Pensar en voz alta', b:'Pensar antes de hablar'},
  {eje:'ei', texto:'Un fin de semana ideal es...', a:'Salir y socializar', b:'Quedarme tranquilo/a en casa'},
  {eje:'ei', texto:'En el trabajo en equipo prefiero...', a:'Discutir ideas en grupo', b:'Trabajar mi parte y luego compartir'},
  {eje:'sn', texto:'Prefiero información...', a:'Concreta y práctica', b:'Abstracta y llena de posibilidades'},
  {eje:'sn', texto:'Confío más en...', a:'Mi experiencia', b:'Mi intuición'},
  {eje:'sn', texto:'Me interesa más...', a:'El presente', b:'El futuro y las ideas'},
  {eje:'sn', texto:'Prefiero instrucciones...', a:'Paso a paso, detalladas', b:'Generales, ya improviso'},
  {eje:'sn', texto:'Disfruto más...', a:'Los detalles concretos', b:'Los patrones y el panorama general'},
  {eje:'tf', texto:'Al decidir me guío más por...', a:'La lógica', b:'Mis valores y sentimientos'},
  {eje:'tf', texto:'Doy feedback siendo...', a:'Directo/a y honesto/a', b:'Cuidadoso/a con los sentimientos'},
  {eje:'tf', texto:'Prefiero que me evalúen por...', a:'Resultados objetivos', b:'Esfuerzo e intención'},
  {eje:'tf', texto:'En un conflicto priorizo...', a:'Tener la razón basada en hechos', b:'Mantener la armonía'},
  {eje:'tf', texto:'Tomo decisiones importantes con...', a:'Análisis frío', b:'Lo que siento que es correcto'},
  {eje:'jp', texto:'Prefiero mi día...', a:'Planificado', b:'Espontáneo'},
  {eje:'jp', texto:'Ante un proyecto...', a:'Empiezo temprano y organizado', b:'Trabajo mejor bajo presión'},
  {eje:'jp', texto:'Mi espacio suele estar...', a:'Ordenado', b:'Con desorden creativo'},
  {eje:'jp', texto:'Prefiero...', a:'Tener todo decidido', b:'Dejar opciones abiertas'},
  {eje:'jp', texto:'Al viajar prefiero...', a:'Itinerario armado', b:'Decidir sobre la marcha'},
];
const MBTI_DESC = {
  base: {
    E:'Extrovertido — te energiza el contacto social', I:'Introvertido — te energiza la soledad y la calma',
    S:'Sensorial — te enfocas en lo concreto y real', N:'Intuitivo — te enfocas en posibilidades e ideas',
    T:'Racional — decides con lógica', F:'Sentimental — decides con valores y empatía',
    J:'Organizado/a — prefieres estructura y planeación', P:'Flexible — prefieres espontaneidad y adaptación',
  }
};
let mbtiRespuestasTemp = {};
async function renderMBTI(body){
  const { data: tests } = await sb.from('mbti_tests').select('*').eq('couple_id', SESSION.coupleId).order('created_at',{ascending:false});
  const items = tests||[];
  const miTest = items.find(t=>t.autor_id===SESSION.user.id);
  const suTest = items.find(t=>t.autor_id!==SESSION.user.id);
  if(!miTest){
    body.innerHTML = `<div class="card"><h2>🧠 Test MBTI</h2><p class="muted small">Responde estas ${MBTI_PREGUNTAS.length} preguntas para descubrir tu tipo de personalidad.</p></div>
      ${MBTI_PREGUNTAS.map((p,i)=>`<div class="card">
        <p><b>${i+1}. ${esc(p.texto)}</b></p>
        <div class="av-options">
          <div class="av-opt ${mbtiRespuestasTemp[i]==='a'?'active':''}" onclick="responderMBTITemp(${i},'a')">${esc(p.a)}</div>
          <div class="av-opt ${mbtiRespuestasTemp[i]==='b'?'active':''}" onclick="responderMBTITemp(${i},'b')">${esc(p.b)}</div>
        </div>
      </div>`).join('')}
      <button class="btn btn-primary btn-block" onclick="finalizarMBTI()">Ver mi resultado</button>`;
    return;
  }
  const tipoDesc = miTest.tipo.split('').map(l=>MBTI_DESC.base[l]).join(' · ');
  body.innerHTML = `
    <div class="hero" style="text-align:center"><h2>🧠 Tu tipo: ${miTest.tipo}</h2><p class="small" style="margin-top:8px">${esc(tipoDesc)}</p></div>
    ${suTest ? `
      <div class="card"><h3>Comparación de pareja</h3>
        <p><b>Tú:</b> ${miTest.tipo} &nbsp; <b>Tu pareja:</b> ${suTest.tipo}</p>
        <p class="small muted" style="margin-top:8px">${mbtiCompararTexto(miTest.tipo, suTest.tipo)}</p>
      </div>` : `<div class="empty small">Esperando a que tu pareja también haga el test.</div>`}
    <button class="btn btn-outline btn-block" style="margin-top:10px" onclick="reiniciarMBTI()">Volver a hacer el test</button>`;
}
function responderMBTITemp(i, val){ mbtiRespuestasTemp[i]=val; renderMBTI(document.getElementById('compatBody')); }
async function finalizarMBTI(){
  if(Object.keys(mbtiRespuestasTemp).length < MBTI_PREGUNTAS.length){ toast('Responde todas las preguntas'); return; }
  const ejes = {ei:0, sn:0, tf:0, jp:0};
  const letras = {ei:['E','I'], sn:['S','N'], tf:['T','F'], jp:['J','P']};
  MBTI_PREGUNTAS.forEach((p,i)=>{ ejes[p.eje] += mbtiRespuestasTemp[i]==='a' ? 1 : -1; });
  const tipo = Object.keys(ejes).map(eje=> ejes[eje]>=0 ? letras[eje][0] : letras[eje][1]).join('');
  await sb.from('mbti_tests').insert({couple_id:SESSION.coupleId, autor_id:SESSION.user.id, tipo, ei:ejes.ei, sn:ejes.sn, tf:ejes.tf, jp:ejes.jp});
  mbtiRespuestasTemp = {};
  await registrarActividad();
  toast('¡Test completado! 🧠');
  renderMBTI(document.getElementById('compatBody'));
}
async function reiniciarMBTI(){
  if(!confirm('¿Quieres volver a hacer el test?')) return;
  await sb.from('mbti_tests').delete().eq('couple_id', SESSION.coupleId).eq('autor_id', SESSION.user.id);
  mbtiRespuestasTemp = {};
  renderMBTI(document.getElementById('compatBody'));
}
function mbtiCompararTexto(a, b){
  let coincidencias = 0; for(let i=0;i<4;i++) if(a[i]===b[i]) coincidencias++;
  if(coincidencias===4) return 'Comparten exactamente el mismo tipo de personalidad — se entienden con una facilidad especial, aunque cuidado con reforzar los mismos puntos ciegos.';
  if(coincidencias>=2) return 'Comparten varios rasgos de personalidad, lo que facilita la comunicación, y sus diferencias pueden complementarse bien.';
  return 'Tienen personalidades bastante distintas — eso puede traer un gran equilibrio a la relación si aprenden a valorar sus diferencias.';
}

/* ================= EXTRAS ================= */
async function renderExtras(){
  const main = document.getElementById('main');
  const { data: ex } = await sb.from('extras').select('*').eq('couple_id', SESSION.coupleId).maybeSingle();
  const extras = ex || {};
  main.innerHTML = `
    <div class="card">
      <h2>Botón de emergencia</h2>
      <p class="muted small">Envía una señal instantánea a tu pareja.</p>
      <div class="grid2">
        <button class="btn btn-outline" onclick="enviarEmergencia('Necesito un abrazo 🫂')">Necesito un abrazo</button>
        <button class="btn btn-outline" onclick="enviarEmergencia('¿Podemos hablar? 💭')">¿Podemos hablar?</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="enviarEmergencia('No estoy teniendo un buen día 🥺')">No estoy teniendo un buen día</button>
    </div>
    <div class="card">
      <h2>Notas motivacionales</h2>
      <div class="grid2">
        <button class="btn btn-sm btn-outline" onclick="generarNota('motivacion')">Motivación</button>
        <button class="btn btn-sm btn-outline" onclick="generarNota('apoyo')">Apoyo</button>
        <button class="btn btn-sm btn-outline" onclick="generarNota('romantico')">Romántico</button>
        <button class="btn btn-sm btn-outline" onclick="generarNota('buenosDias')">Buenos días</button>
      </div>
      <div id="notaGenerada" class="script" style="font-size:17px;margin-top:14px;min-height:24px"></div>
      <div class="row" style="margin-top:10px" id="notaBotones"></div>
    </div>
    <div class="card">
      <h2>Pregunta para conocerse</h2>
      <div id="preguntaTexto" class="script" style="font-size:18px;min-height:26px">Toca el botón para descubrir una pregunta</div>
      <button class="btn btn-gold btn-block" style="margin-top:12px" onclick="preguntaAleatoria()">Nueva pregunta 🎲</button>
    </div>
    <div class="card">
      <h2>Cuenta regresiva personalizada</h2>
      <div class="field"><label>¿Para qué?</label><input id="cd-titulo" placeholder="Vacaciones, visita, etc."></div>
      <div class="field"><label>Fecha</label><input type="date" id="cd-fecha"></div>
      <button class="btn btn-gold btn-block" onclick="agregarCuenta()">Agregar cuenta regresiva</button>
      <div id="cuentasList" style="margin-top:12px"></div>
    </div>`;
  const cuentas = extras.cuentas || [];
  const now = new Date();
  document.getElementById('cuentasList').innerHTML = cuentas.map((c,i)=>{
    const dias = Math.ceil((new Date(c.fecha)-now)/86400000);
    return `<div class="item-row"><span><b>${esc(c.titulo)}</b><div class="small muted">${dias>=0? `Faltan ${dias} días` : 'Ya pasó'}</div></span><span class="tag-del" onclick="quitarCuenta(${i})">✕</span></div>`;
  }).join('') || '<div class="muted small">Sin cuentas regresivas</div>';
}
async function enviarEmergencia(msg){
  await upsertExtras({emergencia:{de:SESSION.slot, msg, leido:false, at:Date.now()}});
  toast('Enviado a tu pareja 💗');
}
function generarNota(cat){
  const arr = FRASES[cat];
  const texto = arr[Math.floor(Math.random()*arr.length)];
  document.getElementById('notaGenerada').textContent = '"'+texto+'"';
  document.getElementById('notaBotones').innerHTML = `<button class="btn btn-sm btn-gold" id="btnEnviarNota">Enviar a mi pareja</button>`;
  document.getElementById('btnEnviarNota').onclick = ()=>enviarNota(texto);
}
async function enviarNota(texto){
  const { data } = await sb.from('extras').select('notas').eq('couple_id',SESSION.coupleId).maybeSingle();
  const notas = (data && data.notas) || [];
  notas.push({id:uid(), texto, para: otroSlot(), leido:false, at:Date.now()});
  await upsertExtras({notas});
  toast('Mensaje enviado 💌');
}
function preguntaAleatoria(){ document.getElementById('preguntaTexto').textContent = PREGUNTAS[Math.floor(Math.random()*PREGUNTAS.length)]; }
async function agregarCuenta(){
  const titulo = document.getElementById('cd-titulo').value.trim();
  const fecha = document.getElementById('cd-fecha').value;
  if(!titulo || !fecha){ toast('Completa el título y la fecha'); return; }
  const { data } = await sb.from('extras').select('cuentas').eq('couple_id',SESSION.coupleId).maybeSingle();
  const cuentas = (data && data.cuentas) || [];
  cuentas.push({titulo, fecha});
  await upsertExtras({cuentas});
  renderExtras();
}
async function quitarCuenta(i){
  const { data } = await sb.from('extras').select('cuentas').eq('couple_id',SESSION.coupleId).maybeSingle();
  const cuentas = (data && data.cuentas) || [];
  cuentas.splice(i,1);
  await upsertExtras({cuentas});
  renderExtras();
}

/* ================= EMOJIS EXCLUSIVOS NPM ================= */
function renderEmojis(){
  const main = document.getElementById('main');
  const secciones = [
    {key:'amor',title:'💗 Amor',badge:'10'},
    {key:'estados',title:'😊 Estados de ánimo',badge:'8'},
    {key:'mensajes',title:'💬 Mensajes rápidos',badge:'8'},
    {key:'exclusivos',title:'⭐ Emojis exclusivos Notre Petit Monde',badge:'18'},
    {key:'actividades',title:'🏠 Actividades / Ubicación',badge:'8'},
    {key:'minijuegos',title:'🎮 Minijuegos',badge:'7'},
    {key:'mascotas',title:'🐾 Mascotas de nuestra historia',badge:'9'},
  ];
  main.innerHTML = `
    <div class="card">
      <h2>Emojis exclusivos Notre Petit Monde 😊</h2>
      <p class="muted small">Estos emojis son únicos de su app. Toca cualquiera para copiarlo, o envíalo directo desde el chat.</p>
    </div>
    <div class="emoji-gallery">
      ${secciones.map(sec=>`
        <div class="card eg-section">
          <div class="eg-section-title">${sec.title}<span class="eg-badge">${sec.badge}</span></div>
          <div class="eg-grid">
            ${(NPM_EMOJIS[sec.key]||[]).map(em=>`
              <div class="eg-card" onclick="copiarEmoji('${em.e}')">
                <span class="ec-emoji">${em.e}</span>
                <span class="ec-label">${em.l}</span>
              </div>`).join('')}
          </div>
        </div>`).join('')}
      <div class="card">
        <div class="eg-section-title">🌸 Stickers NPM</div>
        <div class="eg-grid" style="grid-template-columns:repeat(5,1fr)">
          ${NPM_STICKERS.map(s=>`<div class="eg-card" onclick="copiarEmoji('${s}')"><span class="ec-emoji">${s}</span></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="eg-section-title">✨ GIFs NPM</div>
        <div class="eg-grid" style="grid-template-columns:repeat(4,1fr)">
          ${NPM_GIFS.map(g=>`<div class="eg-card" onclick="copiarEmoji('${g}')"><span class="ec-emoji" style="font-size:22px">${g}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ================= AVATAR (DiceBear · Avataaars) ================= */
/* Generamos el avatar con la API de DiceBear (estilo Avataaars) en vez de
   dibujar el SVG a mano. Guardamos solo la configuración (avatar_config)
   en Supabase; la imagen se regenera al vuelo con estos mapas. */
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

/* Valores validados contra la definición oficial de Avataaars
   (github.com/dicebear/styles -> src/avataaars.json). El estilo NO acepta
   colores ni nombres de variante libres: solo los que están en sus paletas
   y listas de variantes, por eso antes se veían rotos. */
const AV_TOP_MAP = {
  none:'shortFlat', corto:'shortFlat', largo:'straight02', rizado:'curly', ondulado:'curvy',
  trenzas:'frida', mohawk:'sides', cola:'miaWallace', bob:'bob', afro:'fro',
  flequillo:'straightAndStrand', moño:'bun',
  voluminoso:'bigHair', rastas:'dreads', afrodiadema:'froBand', melena:'longButNotTooLong',
  rapado:'shaggy', lisocorto:'straight01', rizadocorto:'shortCurly', redondocorto:'shortRound',
  onduladocorto:'shortWaved', cesar:'theCaesar', cesarraya:'theCaesarAndSidePart',
  gorro:'hat', turbante:'turban', hiyab:'hijab', gorroinvierno:'winterHat1'
};
/* Paleta de ropa válida: 262e33, 65c9ff, 5199e4, 25557c, e6e6e6, 929598,
   3c4f5c, b1e2ff, a7ffc4, ffafb9, ffffb1, ff488e, ff5c5c, ffffff */
const AV_CLOTHING_MAP = {
  none:    {clothing:'shirtCrewNeck',     color:'ffffff'},
  casual:  {clothing:'hoodie',            color:'65c9ff'},
  formal:  {clothing:'blazerAndShirt',    color:'262e33'},
  deporte: {clothing:'graphicShirt',      color:'a7ffc4', graphic:'bear'},
  kawaii:  {clothing:'graphicShirt',      color:'ffafb9', graphic:'hola'},
  space:   {clothing:'hoodie',            color:'3c4f5c', graphic:'diamond'},
  magico:  {clothing:'overall',           color:'ff488e'},
  pijama:  {clothing:'hoodie',            color:'b1e2ff'},
  verano:  {clothing:'shirtVNeck',        color:'ffffb1'},
  invierno:{clothing:'blazerAndSweater',  color:'ff5c5c'},
  oficina: {clothing:'blazerAndShirt',    color:'929598'},
  floral:  {clothing:'collarAndSweater',  color:'a7ffc4'},
  escote:  {clothing:'shirtScoopNeck',    color:'ffafb9'},
  rockera: {clothing:'graphicShirt',      color:'262e33', graphic:'skull'},
  divertida:{clothing:'graphicShirt',     color:'ffffb1', graphic:'pizza'},
  vintage: {clothing:'collarAndSweater',  color:'e6e6e6'},
  jardinero:{clothing:'overall',          color:'a7ffc4'},
  fiesta:  {clothing:'graphicShirt',      color:'ff488e', graphic:'cumbia'},
  rebelde: {clothing:'graphicShirt',      color:'3c4f5c', graphic:'resist'},
  elegante:{clothing:'blazerAndSweater',  color:'262e33'},
  playera: {clothing:'shirtCrewNeck',     color:'b1e2ff'},
  suavecita:{clothing:'shirtScoopNeck',   color:'ffffff'},
};
const AV_ACCESSORY_MAP = {
  none:'round', gafas:'round', sol:'sunglasses', pasta:'wayfarers', kurt:'kurt',
  receta1:'prescription01', receta2:'prescription02', parche:'eyepatch'
};
const AV_FACIAL_MAP = {
  none:'beardLight', bigotefino:'moustacheFancy', bigotegrueso:'moustacheMagnum',
  barbaligera:'beardLight', barbamedia:'beardMedium', barbaimponente:'beardMajestic'
};
const AV_EXPRESION_MAP = {
  '😊': {eyes:'happy',   eyebrows:'default',        mouth:'smile'},
  '🥰': {eyes:'hearts',  eyebrows:'upDown',         mouth:'twinkle'},
  '😴': {eyes:'closed',  eyebrows:'defaultNatural', mouth:'serious'},
  '😎': {eyes:'squint',  eyebrows:'raisedExcited',  mouth:'twinkle'},
  '🥺': {eyes:'side',    eyebrows:'sadConcerned',   mouth:'concerned'},
  '😂': {eyes:'closed',  eyebrows:'raisedExcited',  mouth:'tongue'},
  '😢': {eyes:'cry',     eyebrows:'sadConcerned',   mouth:'sad'},
  '😤': {eyes:'eyeRoll', eyebrows:'angry',          mouth:'grimace'},
  '🤗': {eyes:'wink',    eyebrows:'default',        mouth:'smile'},
  '😲': {eyes:'surprised', eyebrows:'raisedExcitedNatural', mouth:'screamOpen'},
  '😵': {eyes:'xDizzy',  eyebrows:'defaultNatural', mouth:'disbelief'},
  '🥱': {eyes:'closed',  eyebrows:'sadConcernedNatural', mouth:'default'},
  '😋': {eyes:'happy',   eyebrows:'default',        mouth:'eating'},
  '🤪': {eyes:'winkWacky', eyebrows:'upDownNatural', mouth:'tongue'},
  '🧐': {eyes:'squint',  eyebrows:'frownNatural',   mouth:'default'},
};

function avataaarsUrl(config, headOnly){
  const top = AV_TOP_MAP[config.cabello] || 'shortFlat';
  const outfit = AV_CLOTHING_MAP[config.ropa] || AV_CLOTHING_MAP.casual;
  const accessory = AV_ACCESSORY_MAP[config.accesorio] || 'round';
  const facial = AV_FACIAL_MAP[config.vello] || 'beardLight';
  const exp = AV_EXPRESION_MAP[config.expresion] || AV_EXPRESION_MAP['😊'];
  const piel = (config.piel || '#edb98a').replace('#','');
  const pelo = (config.colorCabello || '#4a312c').replace('#','');
  const p = new URLSearchParams();
  p.set('seed', 'npm-avatar');
  p.set('top', top);
  p.set('topProbability', config.cabello==='none' ? '0' : '100');
  p.set('hairColor', pelo);
  p.set('skinColor', piel);
  p.set('accessories', accessory);
  p.set('accessoriesProbability', config.accesorio==='none' ? '0' : '100');
  p.set('facialHair', facial);
  p.set('facialHairProbability', config.vello==='none' ? '0' : '100');
  p.set('facialHairColor', pelo);
  p.set('clothes', outfit.clothing);
  p.set('clothesColor', outfit.color);
  if(outfit.graphic){ p.set('clothesGraphic', outfit.graphic); p.set('clothesGraphicProbability','100'); }
  p.set('eyes', exp.eyes);
  p.set('eyebrows', exp.eyebrows);
  p.set('mouth', exp.mouth);
  if(headOnly){ p.set('scale','110'); }
  return `${DICEBEAR_BASE}?${p.toString()}`;
}
/* Se mantiene el nombre chibiAvatarSVG para no tocar el resto del código:
   ahora devuelve un <img> apuntando al SVG generado por DiceBear. */
function chibiAvatarSVG(config, headOnly){
  const url = avataaarsUrl(config, headOnly);
  return `<img src="${url}" alt="avatar" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">`;
}

let avConfig = { cabello:'corto', ropa:'casual', accesorio:'none', vello:'none', expresion:'😊', piel:'#edb98a', colorCabello:'#4a312c' };
let avConfigCargado = false;
const AV_CABELLOS=[{id:'none',label:'Ninguno',icon:'—'},{id:'corto',label:'Corto',icon:'🪮'},{id:'largo',label:'Largo',icon:'💇'},{id:'rizado',label:'Rizado',icon:'🌀'},{id:'ondulado',label:'Ondulado',icon:'〰️'},{id:'trenzas',label:'Trenzas',icon:'🎀'},{id:'mohawk',label:'Undercut',icon:'⚡'},{id:'cola',label:'Cola de caballo',icon:'🔛'},{id:'bob',label:'Bob',icon:'✂️'},{id:'afro',label:'Afro',icon:'🌸'},{id:'flequillo',label:'Flequillo',icon:'✨'},{id:'moño',label:'Moño',icon:'🎗️'},{id:'voluminoso',label:'Voluminoso',icon:'💁'},{id:'rastas',label:'Rastas',icon:'🎵'},{id:'afrodiadema',label:'Afro c/diadema',icon:'🌼'},{id:'melena',label:'Media melena',icon:'💫'},{id:'rapado',label:'Despeinado',icon:'🥴'},{id:'lisocorto',label:'Liso corto',icon:'📏'},{id:'rizadocorto',label:'Rizado corto',icon:'🌪️'},{id:'redondocorto',label:'Redondo corto',icon:'⚪'},{id:'onduladocorto',label:'Ondulado corto',icon:'🌊'},{id:'cesar',label:'César',icon:'👑'},{id:'cesarraya',label:'César c/raya',icon:'➰'},{id:'gorro',label:'Gorro',icon:'🧢'},{id:'turbante',label:'Turbante',icon:'🪭'},{id:'hiyab',label:'Hiyab',icon:'🧕'},{id:'gorroinvierno',label:'Gorro de invierno',icon:'⛄'}];
const AV_ROPAS=[{id:'none',label:'Ninguna',icon:'—'},{id:'casual',label:'Casual',icon:'👕'},{id:'formal',label:'Formal',icon:'👔'},{id:'deporte',label:'Deporte',icon:'🧤'},{id:'kawaii',label:'Kawaii',icon:'🌸'},{id:'space',label:'Espacial',icon:'🚀'},{id:'magico',label:'Mágico',icon:'🔮'},{id:'pijama',label:'Pijama',icon:'🌙'},{id:'verano',label:'Verano',icon:'☀️'},{id:'invierno',label:'Invierno',icon:'❄️'},{id:'oficina',label:'Oficina',icon:'💼'},{id:'floral',label:'Floral',icon:'🌼'},{id:'escote',label:'Escote redondo',icon:'👚'},{id:'rockera',label:'Rockera',icon:'💀'},{id:'divertida',label:'Divertida',icon:'🍕'},{id:'vintage',label:'Vintage',icon:'🕰️'},{id:'jardinero',label:'Jardinero',icon:'🌱'},{id:'fiesta',label:'De fiesta',icon:'🎉'},{id:'rebelde',label:'Rebelde',icon:'✊'},{id:'elegante',label:'Elegante',icon:'🖤'},{id:'playera',label:'Playera',icon:'🏖️'},{id:'suavecita',label:'Suavecita',icon:'☁️'}];
const AV_ACCESORIOS=[{id:'none',label:'Ninguno',icon:'—'},{id:'gafas',label:'Redondas',icon:'👓'},{id:'sol',label:'De sol',icon:'🕶️'},{id:'pasta',label:'De pasta',icon:'🤓'},{id:'kurt',label:'Estilo Kurt',icon:'😎'},{id:'receta1',label:'Fina',icon:'👓'},{id:'receta2',label:'Ovalada',icon:'👓'},{id:'parche',label:'Parche pirata',icon:'🏴‍☠️'}];
const AV_VELLO=[{id:'none',label:'Ninguno',icon:'—'},{id:'bigotefino',label:'Bigote fino',icon:'👨'},{id:'bigotegrueso',label:'Bigote grueso',icon:'👨‍🦳'},{id:'barbaligera',label:'Barba ligera',icon:'🧔'},{id:'barbamedia',label:'Barba media',icon:'🧔‍♂️'},{id:'barbaimponente',label:'Barba imponente',icon:'🧙'}];
const AV_EXPRESIONES=[{id:'😊',label:'Feliz'},{id:'🥰',label:'Enamorado'},{id:'😴',label:'Dormido'},{id:'😎',label:'Cool'},{id:'🥺',label:'Tímido'},{id:'😂',label:'Riendo'},{id:'😢',label:'Triste'},{id:'😤',label:'Enojado'},{id:'🤗',label:'Tierno'},{id:'😲',label:'Sorprendido'},{id:'😵',label:'Mareado'},{id:'🥱',label:'Cansado'},{id:'😋',label:'Antojo'},{id:'🤪',label:'Bromista'},{id:'🧐',label:'Serio'}];
/* Solo estos tonos son válidos para Avataaars (paleta oficial "skin" / "hair") */
const AV_COLORES_PIEL=['#614335','#d08b5b','#ae5d29','#edb98a','#ffdbb4','#fd9841','#f8d25c'];
const AV_COLORES_CABELLO=['#a55728','#2c1b18','#b58143','#d6b370','#724133','#4a312c','#f59797','#ecdcbf','#c93305','#e8e1e1'];
let avStudioTab='cabello';

function perfilChibiConfig(perfil){
  const base = { cabello:'corto', ropa:'casual', accesorio:'none', vello:'none', expresion:'😊', piel:'#edb98a', colorCabello:'#4a312c' };
  if(perfil && perfil.avatar_config && Object.keys(perfil.avatar_config).length){ Object.assign(base, perfil.avatar_config); }
  return base;
}
async function renderAvatar(){
  const main = document.getElementById('main');
  if(!avConfigCargado){
    const miPerfil = CACHE.perfiles[SESSION.slot]||{};
    if(miPerfil.avatar_config && Object.keys(miPerfil.avatar_config).length){ avConfig = Object.assign({}, avConfig, miPerfil.avatar_config); }
    avConfigCargado = true;
  }
  const miPerfil = CACHE.perfiles[SESSION.slot]||{};
  const suPerfil = CACHE.perfiles[otroSlot()]||{};
  main.innerHTML = `
    <div class="card">
      <h2>Estudio de avatar 👤</h2>
      <div class="av-preview-wrap">
        <div class="av-chibi-frame" id="avPreviewBig">${chibiAvatarSVG(avConfig)}</div>
        <div style="margin-top:8px;font-size:13px;color:var(--tinta-suave)">Vista previa de tu avatar chibi</div>
      </div>
    </div>

    <div class="card">
      <h3>Personalización avanzada</h3>
      <div class="av-layer-tabs" id="avLayerTabs">
        ${[['cabello','💇 Cabello'],['ropa','👕 Ropa'],['accesorio','👓 Gafas'],['vello','🧔 Vello facial'],['expresion','😊 Expresión'],['piel','🎨 Color piel'],['colCab','🎨 Color cabello']].map(([k,l])=>`<button class="av-layer-btn ${avStudioTab===k?'active':''}" data-av="${k}">${l}</button>`).join('')}
      </div>
      <div id="avOptions"></div>
      <div style="margin-top:12px">
        <button class="btn btn-primary btn-block" onclick="guardarAvatar()">Guardar avatar 💗</button>
      </div>
    </div>

    <div class="card">
      <h3>Avatares en pareja 💑</h3>
      <div style="display:flex;justify-content:center;align-items:flex-end;gap:16px;padding:20px;background:radial-gradient(circle,var(--rosa),var(--lila));border-radius:16px">
        <div style="text-align:center">
          <div class="av-chibi-mini">${chibiAvatarSVG(perfilChibiConfig(miPerfil), true)}</div>
          <div class="small" style="margin-top:4px">${esc(miPerfil.nombre||'Tú')}</div>
        </div>
        <div style="font-size:22px;padding-bottom:30px">💗</div>
        <div style="text-align:center;cursor:pointer" onclick="verPerfilPareja()">
          <div class="av-chibi-mini">${chibiAvatarSVG(perfilChibiConfig(suPerfil), true)}</div>
          <div class="small" style="margin-top:4px">${esc(suPerfil.nombre||'Pareja')} 👀</div>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('#avLayerTabs button').forEach(b=>b.onclick=()=>{ avStudioTab=b.dataset.av; renderAvatar(); });
  pintarAvOptions();
}
function pintarAvOptions(){
  const container = document.getElementById('avOptions'); if(!container) return;
  if(avStudioTab==='cabello'){
    container.innerHTML = `<div class="av-options">${AV_CABELLOS.map(c=>`<div class="av-opt ${avConfig.cabello===c.id?'active':''}" onclick="setAvConfig('cabello','${c.id}')"><span class="ao-icon">${c.icon}</span><span>${c.label}</span></div>`).join('')}</div>`;
  } else if(avStudioTab==='ropa'){
    container.innerHTML = `<div class="av-options">${AV_ROPAS.map(r=>`<div class="av-opt ${avConfig.ropa===r.id?'active':''}" onclick="setAvConfig('ropa','${r.id}')"><span class="ao-icon">${r.icon}</span><span>${r.label}</span></div>`).join('')}</div>`;
  } else if(avStudioTab==='accesorio'){
    container.innerHTML = `<div class="av-options">${AV_ACCESORIOS.map(a=>`<div class="av-opt ${avConfig.accesorio===a.id?'active':''}" onclick="setAvConfig('accesorio','${a.id}')"><span class="ao-icon">${a.icon}</span><span>${a.label}</span></div>`).join('')}</div>`;
  } else if(avStudioTab==='vello'){
    container.innerHTML = `<div class="av-options">${AV_VELLO.map(v=>`<div class="av-opt ${avConfig.vello===v.id?'active':''}" onclick="setAvConfig('vello','${v.id}')"><span class="ao-icon">${v.icon}</span><span>${v.label}</span></div>`).join('')}</div>`;
  } else if(avStudioTab==='expresion'){
    container.innerHTML = `<div class="av-options">${AV_EXPRESIONES.map(e=>`<div class="av-opt ${avConfig.expresion===e.id?'active':''}" onclick="setAvConfig('expresion','${e.id}')"><span class="ao-icon">${e.id}</span><span>${e.label}</span></div>`).join('')}</div>`;
  } else if(avStudioTab==='piel'){
    container.innerHTML = `<div style="margin-bottom:8px;font-size:13px;color:var(--tinta-suave)">Tono de piel</div><div class="av-color-row">${AV_COLORES_PIEL.map(c=>`<div class="av-color-dot ${avConfig.piel===c?'active':''}" style="background:${c}" onclick="setAvConfig('piel','${c}')"></div>`).join('')}</div>`;
  } else if(avStudioTab==='colCab'){
    container.innerHTML = `<div style="margin-bottom:8px;font-size:13px;color:var(--tinta-suave)">Color de cabello</div><div class="av-color-row">${AV_COLORES_CABELLO.map(c=>`<div class="av-color-dot ${avConfig.colorCabello===c?'active':''}" style="background:${c}" onclick="setAvConfig('colorCabello','${c}')"></div>`).join('')}</div>`;
  }
}
function setAvConfig(key,val){
  avConfig[key]=val;
  const prev = document.getElementById('avPreviewBig');
  if(prev){ prev.innerHTML = chibiAvatarSVG(avConfig); }
  pintarAvOptions();
}
async function guardarAvatar(){
  if(isDemoMode()){ toast('Inicia sesión real para guardar tu avatar'); return; }
  const { error } = await sb.from('profiles').update({avatar_config:avConfig, updated_at:new Date().toISOString()}).eq('user_id', SESSION.user.id);
  if(error){ toast('No se pudo guardar'); console.error(error); return; }
  await cargarPerfiles();
  pintarAvatarHeader(CACHE.perfiles[SESSION.slot]||{}); pintarAvatarHeaderPareja();
  toast('Avatar guardado 💗');
}

/* ================= CONFIGURACIÓN ================= */
let configTab='general';
const configToggles={notifMensajes:true,notifAniversario:true,notifEmergencia:true,notifCartas:true,notifBuenosDias:true,notifBuenasNoches:true,notifRomantico:true,notifRecuerdo:true,notifWidgets:true,modoOscuro:false,efectosPetals:true};

function renderConfig(){
  const main = document.getElementById('main');
  const secciones = [
    {id:'general',icon:'⚙️',label:'General'},
    {id:'personalizacion',icon:'🎨',label:'Personalización'},
    {id:'notif',icon:'🔔',label:'Notificaciones'},
    {id:'sonidos',icon:'🎵',label:'Sonidos'},
    {id:'accesibilidad',icon:'♿',label:'Accesibilidad'},
    {id:'exportar',icon:'☁️',label:'Copias'},
    {id:'cuenta',icon:'👤',label:'Cuenta'},
    {id:'privacidad',icon:'🔒',label:'Privacidad'},
    {id:'bloqueopin',icon:'🔐',label:'Bloqueo PIN'},
    {id:'manual',icon:'📘',label:'Manual'},
    {id:'legal',icon:'📄',label:'Legal'},
  ];
  main.innerHTML = `
    <div class="card" style="padding:12px">
      <div class="subtabs" style="flex-wrap:wrap">
        ${secciones.map(s=>`<button data-cfg="${s.id}" class="${configTab===s.id?'active':''}" style="font-size:12px">${s.icon} ${s.label}</button>`).join('')}
      </div>
    </div>
    <div id="configBody"></div>`;
  document.querySelectorAll('[data-cfg]').forEach(b=>b.onclick=()=>{ configTab=b.dataset.cfg; renderConfig(); });
  const body = document.getElementById('configBody');
  if(configTab==='general') renderConfigGeneral(body);
  else if(configTab==='personalizacion') renderConfigPersonalizacion(body);
  else if(configTab==='notif') renderConfigNotif(body);
  else if(configTab==='sonidos') renderConfigSonidos(body);
  else if(configTab==='accesibilidad') renderConfigAccesibilidad(body);
  else if(configTab==='exportar') renderConfigExportar(body);
  else if(configTab==='cuenta') renderConfigCuenta(body);
  else if(configTab==='privacidad') renderConfigPrivacidad(body);
  else if(configTab==='bloqueopin') renderConfigBloqueoPin(body);
  else if(configTab==='manual') renderConfigManual(body);
  else if(configTab==='legal') renderConfigLegal(body);
}
function renderConfigGeneral(body){
  body.innerHTML = `
    <div class="card">
      <h3>General</h3>
      <div class="config-list">
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">🌸</div><div><label>Pétalos animados</label><div class="sub">Animación decorativa de fondo</div></div></div><button class="config-toggle ${configToggles.efectosPetals?'on':''}" onclick="toggleConfig('efectosPetals',this)"></button></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">🌙</div><div><label>Modo oscuro</label><div class="sub">Paleta oscura para toda la app</div></div></div><button class="config-toggle ${configToggles.modoOscuro?'on':''}" onclick="toggleModoOscuro(this)"></button></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">🌍</div><div><label>Nombre del mundo</label><div class="sub">${esc(PERSONALIZACION.nombreMundo||'Nuestro mundo')}</div></div></div><button class="btn btn-sm btn-outline" onclick="renombrarMundo()">Cambiar</button></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">🔗</div><div><label>Código del hogar</label><div class="sub">Ver el código para invitar a tu pareja</div></div></div><button class="btn btn-sm btn-outline" onclick="verCodigo()">Ver código</button></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon red">↪</div><div><label>Cerrar sesión</label><div class="sub">Salir de la aplicación</div></div></div><button class="btn btn-sm btn-danger" onclick="cerrarSesion()">Salir</button></div>
      </div>
    </div>`;
}
async function renombrarMundo(){
  const actual = PERSONALIZACION.nombreMundo || 'Nuestro mundo';
  const nuevo = prompt('¿Cómo quieren llamar a su mundo?', actual);
  if(nuevo===null) return; // canceló
  const limpio = nuevo.trim() || 'Nuestro mundo';
  await guardarPersonalizacion({ nombreMundo: limpio });
  toast('Nombre del mundo actualizado 🌍');
  renderConfig();
}
function renderConfigPersonalizacion(body){
  const WIDGETS = [
    {id:'animo', icon:'🥰', label:'Estado de ánimo', sub:'Tarjeta para compartir cómo se sienten hoy'},
    {id:'calendario', icon:'📅', label:'Próximo evento', sub:'Vista rápida del calendario'},
    {id:'accesos', icon:'⚡', label:'Accesos rápidos', sub:'Botones a cartas, chat y emergencia'},
  ];
  body.innerHTML = `
    <div class="card">
      <h3>🖌️ Decoración</h3>
      <p class="muted small">Washi tape, marcos, sellos, pegatinas y colores para toda la app.</p>
      <button class="btn btn-outline btn-block" onclick="switchTab('decoracion')">Abrir Decoración</button>
    </div>
    <div class="card">
      <h3>🎨 Temas</h3>
      <p class="muted small">Elige la paleta de colores de la app.</p>
      <div class="grid2" style="gap:10px;margin-top:8px">
        ${Object.entries(TEMAS).map(([id,t])=>`
          <button class="btn ${PERSONALIZACION.tema===id?'btn-primary':'btn-outline'}" style="justify-content:flex-start;gap:10px" onclick="guardarPersonalizacion({tema:'${id}'}).then(()=>renderConfig())">
            <span style="width:18px;height:18px;border-radius:50%;display:inline-block;background:linear-gradient(135deg,${t.rosa},${t.lila});border:1px solid rgba(0,0,0,.1)"></span>
            ${t.label}
          </button>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3>🔤 Fuentes</h3>
      <p class="muted small">Elige el estilo de letra de la app.</p>
      <div class="grid2" style="gap:10px;margin-top:8px">
        ${Object.entries(FUENTES).map(([id,f])=>`
          <button class="btn ${PERSONALIZACION.fuente===id?'btn-primary':'btn-outline'}" style="font-family:${f.body}" onclick="guardarPersonalizacion({fuente:'${id}'}).then(()=>renderConfig())">${f.label}</button>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3>🌤️ Fondo dinámico</h3>
      <p class="muted small">El fondo cambia según la hora del día y la estación del año.</p>
      <div class="config-item">
        <div class="config-item-info"><div class="config-item-icon lila">🌤️</div><div><label>Activar fondo dinámico</label><div class="sub">Se desactiva si el modo oscuro está encendido</div></div></div>
        <button class="config-toggle ${PERSONALIZACION.fondo_dinamico?'on':''}" onclick="toggleFondoDinamico(this)"></button>
      </div>
    </div>
    <div class="card">
      <h3>🧩 Widgets del Inicio</h3>
      <p class="muted small">Elige qué tarjetas quieres ver en Inicio.</p>
      <div class="config-list">
        ${WIDGETS.map(w=>`<div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">${w.icon}</div><div><label>${w.label}</label><div class="sub">${w.sub}</div></div></div><button class="config-toggle ${widgetActivo(w.id)?'on':''}" onclick="toggleWidgetInicio('${w.id}',this)"></button></div>`).join('')}
      </div>
    </div>`;
}
async function toggleFondoDinamico(btn){
  const nuevo = !PERSONALIZACION.fondo_dinamico;
  btn.classList.toggle('on', nuevo);
  await guardarPersonalizacion({fondo_dinamico: nuevo});
  toast(nuevo ? 'Fondo dinámico activado 🌤️' : 'Fondo dinámico desactivado');
}
async function toggleWidgetInicio(id, btn){
  const activos = new Set(PERSONALIZACION.widgets||[]);
  if(activos.has(id)) activos.delete(id); else activos.add(id);
  btn.classList.toggle('on', activos.has(id));
  await guardarPersonalizacion({widgets: Array.from(activos)});
  if(activeTab==='inicio') renderInicio();
}
function descargarArchivo(nombre, contenido, tipo){
  const blob = new Blob([contenido], {type:tipo});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=nombre; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1000);
}
// Abre el documento en una pestaña nueva y dispara el diálogo de impresión del navegador,
// para que la persona elija "Guardar como PDF" (funciona en cualquier celular o computadora,
// sin depender de librerías extra). Se usa en vez de descargar un .html suelto.
function abrirParaGuardarComoPDF(html){
  const ventana = window.open('', '_blank');
  if(!ventana){ toast('Permite las ventanas emergentes para poder guardar como PDF'); return; }
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  const dispararImpresion = ()=>{ try{ ventana.focus(); ventana.print(); }catch(e){} };
  const imagenes = ventana.document.images;
  if(imagenes.length){
    let cargadas = 0;
    const revisar = ()=>{ cargadas++; if(cargadas>=imagenes.length) dispararImpresion(); };
    Array.from(imagenes).forEach(img=>{ if(img.complete) revisar(); else { img.onload = revisar; img.onerror = revisar; } });
    setTimeout(dispararImpresion, 2500); // por si alguna imagen nunca dispara load/error
  } else {
    setTimeout(dispararImpresion, 300);
  }
}
function libroHTML(titulo, secciones, opciones){
  const op = opciones||{};
  const portadaColores = {clasica:'linear-gradient(135deg,#ffe4ef,#ffd0e0)', dorada:'linear-gradient(135deg,#fff2d6,#ffe2a0)', lila:'linear-gradient(135deg,#e6d8fb,#d4bdf5)', noche:'linear-gradient(135deg,#2c2a4a,#5b4b8a)'};
  const portadaBg = portadaColores[op.portadaColor] || portadaColores.clasica;
  const portadaClara = op.portadaColor!=='noche';
  const indice = secciones.map((s,i)=>`<li><a href="#sec${i}">${s.titulo}</a></li>`).join('');
  const marcapaginas = (op.marcapaginas||[]).length ? `<h2 id="marcapaginas">🔖 Marcapáginas</h2>${op.marcapaginas.map(m=>`<div class="item"><p><b>${esc(m.titulo)}</b></p>${m.nota?`<p>${esc(m.nota)}</p>`:''}</div>`).join('')}` : '';
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${titulo}</title>
  <style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 20px;color:#4a3550;background:#fffaf6;line-height:1.6}
  h1{text-align:center;color:#c3527a;border-bottom:2px solid #eeb1cd;padding-bottom:16px}
  h2{color:#8a5ad0;margin-top:40px}.item{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 4px 14px rgba(120,70,110,.12)}
  .fecha{font-size:12px;color:#8a7690}img{max-width:100%;border-radius:10px;margin-top:8px}
  .portada{background:${portadaBg};color:${portadaClara?'#4a3550':'#fff'};border-radius:20px;padding:60px 20px;text-align:center;margin-bottom:30px}
  .portada .emoji{font-size:52px}
  .dedicatoria{font-style:italic;text-align:center;padding:24px;color:#8a5ad0}
  .indice{background:#fff;border-radius:14px;padding:20px}.indice li{margin:6px 0}
  @media print{body{margin:0}}</style></head><body>
  <div class="portada"><div class="emoji">${op.portadaEmoji||'💗'}</div><h1 style="border:none">${titulo}</h1></div>
  ${op.dedicatoria ? `<div class="dedicatoria">"${esc(op.dedicatoria)}"</div>` : ''}
  <h2>📑 Índice</h2><ul class="indice">${indice}</ul>
  ${secciones.map((s,i)=>`<h2 id="sec${i}">${s.titulo}</h2>${s.items.length? s.items.join('') : '<p><i>Sin contenido aún.</i></p>'}`).join('')}
  ${marcapaginas}
  <p style="text-align:center;margin-top:50px;color:#8a7690">Exportado desde Notre petit monde el ${new Date().toLocaleDateString('es-ES')}</p>
  </body></html>`;
}
async function renderConfigExportar(body){
  body.innerHTML = `
    <div class="card">
      <h3>☁️ Copias y exportación</h3>
      <p class="muted small">Se abrirá una vista lista para imprimir; en el diálogo de impresión elige "Guardar como PDF" (así funciona en cualquier celular o computadora).</p>
    </div>
    <div class="config-list">
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">💖</div><div><label>Exportar recuerdos</label><div class="sub">Banco de recuerdos, preguntas y conversaciones</div></div></div><button class="btn btn-sm btn-outline" onclick="exportarRecuerdos()">Ver / Guardar PDF</button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">🖼️</div><div><label>Exportar álbum completo</label><div class="sub">Fotos y descripciones</div></div></div><button class="btn btn-sm btn-outline" onclick="exportarAlbumCompleto()">Ver / Guardar PDF</button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon blue">💬</div><div><label>Descargar conversaciones</label><div class="sub">Historial del chat en texto</div></div></div><button class="btn btn-sm btn-outline" onclick="exportarChat()">Descargar</button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">💌</div><div><label>Descargar cartas</label><div class="sub">Todas las cartas abiertas</div></div></div><button class="btn btn-sm btn-outline" onclick="exportarCartasArchivo()">Ver / Guardar PDF</button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">📔</div><div><label>Descargar diario</label><div class="sub">Entradas de diario personal y compartido</div></div></div><button class="btn btn-sm btn-outline" onclick="exportarDiarioArchivo()">Ver / Guardar PDF</button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">📖</div><div><label>Libro digital de la relación</label><div class="sub">Un solo documento con lo más especial</div></div></div><div class="row" style="gap:6px"><button class="btn btn-sm btn-outline" onclick="renderLibroPersonalizar()">🎨 Portada</button><button class="btn btn-sm btn-gold" onclick="exportarLibroDigital()">Crear libro (PDF)</button></div></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">📈</div><div><label>Línea de tiempo</label><div class="sub">Hitos y fechas importantes en orden</div></div></div><button class="btn btn-sm btn-outline" onclick="exportarLineaTiempo()">Ver / Guardar PDF</button></div>
    </div>`;
}
async function exportarRecuerdos(){
  toast('Preparando archivo...');
  const [br, cr, pd] = await Promise.all([
    sb.from('banco_recuerdos').select('*').eq('couple_id',SESSION.coupleId).order('created_at'),
    sb.from('conversaciones_respuestas').select('*').eq('couple_id',SESSION.coupleId).order('created_at'),
    sb.from('pregunta_dia_respuestas').select('*').eq('couple_id',SESSION.coupleId).order('fecha'),
  ]);
  const html = libroHTML('Nuestros recuerdos', [
    {titulo:'💖 Banco de recuerdos', items:(br.data||[]).map(i=>`<div class="item"><div class="fecha">${new Date(i.created_at).toLocaleDateString('es-ES')} · ${i.categoria}</div><p>${esc(i.texto)}</p></div>`)},
    {titulo:'💬 Conversaciones profundas', items:(cr.data||[]).map(i=>`<div class="item"><div class="fecha">${new Date(i.created_at).toLocaleDateString('es-ES')}</div><p><b>${esc(i.pregunta_texto)}</b></p><p>${esc(i.respuesta)}</p></div>`)},
    {titulo:'🌸 Preguntas del día', items:(pd.data||[]).map(i=>`<div class="item"><div class="fecha">${new Date(i.fecha).toLocaleDateString('es-ES')}</div><p><b>${esc(i.pregunta_texto)}</b></p><p>${esc(i.respuesta)}</p></div>`)},
  ]);
  abrirParaGuardarComoPDF(html);
}
async function exportarAlbumCompleto(){
  toast('Preparando archivo...');
  const { data } = await sb.from('album').select('*').eq('couple_id',SESSION.coupleId).order('created_at');
  const items = (data||[]).filter(a=>a.img_url).map(a=>`<div class="item"><img src="${a.img_url}"><p>${esc(a.texto||'')}</p><div class="fecha">${new Date(a.created_at).toLocaleDateString('es-ES')}</div></div>`);
  const html = libroHTML('Nuestro álbum', [{titulo:'🖼️ Fotos y momentos', items}]);
  abrirParaGuardarComoPDF(html);
}
async function exportarChat(){
  toast('Preparando archivo...');
  const { data } = await sb.from('chat_mensajes').select('*').eq('couple_id',SESSION.coupleId).order('created_at');
  const texto = (data||[]).filter(m=>!m.eliminado).map(m=>`[${new Date(m.created_at).toLocaleString('es-ES')}] ${m.autor_id===SESSION.user.id?'Tú':'Pareja'}: ${m.texto||'(multimedia)'}`).join('\n');
  descargarArchivo('conversaciones.txt', texto || 'Sin mensajes aún.', 'text/plain');
}
async function exportarCartasArchivo(){
  toast('Preparando archivo...');
  const { data } = await sb.from('cartas').select('*').eq('couple_id',SESSION.coupleId).eq('borrador',false).order('created_at');
  const items = (data||[]).map(c=>`<div class="item"><div class="fecha">${new Date(c.created_at).toLocaleDateString('es-ES')}</div><h3 style="margin:4px 0">${esc(c.titulo)}</h3><p>${esc(c.cuerpo||'')}</p></div>`);
  const html = libroHTML('Nuestras cartas', [{titulo:'💌 Cartas', items}]);
  abrirParaGuardarComoPDF(html);
}
async function exportarDiarioArchivo(){
  toast('Preparando archivo...');
  const { data } = await sb.from('diario').select('*').eq('couple_id',SESSION.coupleId).order('created_at');
  const items = (data||[]).map(d=>`<div class="item"><div class="fecha">${new Date(d.created_at).toLocaleDateString('es-ES')} · ${d.tipo}</div><p>${esc(d.texto)}</p></div>`);
  const html = libroHTML('Nuestro diario', [{titulo:'📔 Entradas de diario', items}]);
  abrirParaGuardarComoPDF(html);
}
async function exportarLibroDigital(){
  toast('Creando su libro digital...');
  const p = await getPareja();
  const [br, cal, album, { data: config }] = await Promise.all([
    sb.from('banco_recuerdos').select('*').eq('couple_id',SESSION.coupleId).eq('favorito',true),
    sb.from('calendario').select('*').eq('couple_id',SESSION.coupleId).eq('tipo','hito').order('fecha'),
    sb.from('album').select('*').eq('couple_id',SESSION.coupleId).eq('favorito',true).limit(20),
    sb.from('libro_config').select('*').eq('couple_id',SESSION.coupleId).maybeSingle(),
  ]);
  const html = libroHTML('Nuestra historia', [
    {titulo:'💞 Nosotros', items:[`<div class="item"><p><b>Comenzamos:</b> ${p.inicio?new Date(p.inicio+'T00:00:00').toLocaleDateString('es-ES'):'—'}</p><p><b>Aniversario:</b> ${p.aniversario?new Date(p.aniversario+'T00:00:00').toLocaleDateString('es-ES'):'—'}</p><p><b>Nuestra canción:</b> ${esc(p.cancion||'—')}</p><p><b>Frase favorita:</b> ${esc(p.frase||'—')}</p></div>`]},
    {titulo:'💫 Fechas importantes', items:(cal.data||[]).map(h=>`<div class="item"><p>${h.icono||'💞'} <b>${esc(h.titulo)}</b> — ${new Date(h.fecha+'T00:00:00').toLocaleDateString('es-ES')}</p></div>`)},
    {titulo:'💖 Recuerdos favoritos', items:(br.data||[]).map(i=>`<div class="item"><p>${esc(i.texto)}</p></div>`)},
    {titulo:'🖼️ Fotos favoritas', items:(album.data||[]).filter(a=>a.img_url).map(a=>`<div class="item"><img src="${a.img_url}"><p>${esc(a.texto||'')}</p></div>`)},
  ], config ? {portadaColor:config.portada_color, portadaEmoji:config.portada_emoji, dedicatoria:config.dedicatoria, marcapaginas:config.marcapaginas} : null);
  abrirParaGuardarComoPDF(html);
}
async function exportarLineaTiempo(){
  toast('Preparando línea de tiempo...');
  const [cal, album] = await Promise.all([
    sb.from('calendario').select('*').eq('couple_id',SESSION.coupleId).eq('tipo','hito'),
    sb.from('album').select('*').eq('couple_id',SESSION.coupleId),
  ]);
  const eventos = [
    ...(cal.data||[]).map(h=>({fecha:h.fecha, texto:`${h.icono||'💞'} ${h.titulo}`})),
    ...(album.data||[]).filter(a=>a.img_url).map(a=>({fecha:a.created_at.slice(0,10), texto:`🖼️ ${a.texto||'Un recuerdo en el álbum'}`})),
  ].sort((a,b)=> new Date(a.fecha) - new Date(b.fecha));
  const items = eventos.map(e=>`<div class="item"><div class="fecha">${new Date(e.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div><p>${esc(e.texto)}</p></div>`);
  const html = libroHTML('Nuestra línea de tiempo', [{titulo:'📈 Cronología', items}]);
  abrirParaGuardarComoPDF(html);
}

async function renderConfigNotif(body){
  await cargarNotifPrefs();
  const items=[
    {key:'notifMensajes',icon:'💬',color:'blue',label:'Mensajes del chat',sub:'Nuevos mensajes de tu pareja'},
    {key:'notifAniversario',icon:'💑',color:'gold',label:'Fechas especiales',sub:'Recordatorios de aniversarios y citas'},
    {key:'notifEmergencia',icon:'📣',color:'red',label:'Botón de emergencia',sub:'Cuando tu pareja necesita apoyo'},
    {key:'notifCartas',icon:'💌',color:'pink',label:'Avisos de cartas',sub:'Cuando te dejan una carta nueva'},
    {key:'notifBuenosDias',icon:'☀️',color:'gold',label:'Buenos días automáticos',sub:'Un saludo cada mañana'},
    {key:'notifBuenasNoches',icon:'🌙',color:'lila',label:'Buenas noches automáticas',sub:'Un saludo cada noche'},
    {key:'notifRomantico',icon:'💕',color:'pink',label:'Mensajes románticos programados',sub:'Una frase bonita al azar cada día'},
    {key:'notifRecuerdo',icon:'📸',color:'gold',label:'Recuerdos "Hace un año"',sub:'Cuando se cumple un aniversario de algo en su álbum'},
    {key:'notifWidgets',icon:'🥺',color:'pink',label:'"Te extraño" y widgets compartidos',sub:'Cuando tu pareja toca un widget o edita la nota/dibujo compartido'},
  ];
  // BUG REAL en celulares iPhone: Safari en iOS solo permite notificaciones push si la
  // app está agregada a la pantalla de inicio (instalada como PWA) — en una pestaña
  // normal de Safari, Notification.requestPermission() ni siquiera existe o no sirve de
  // nada, así que el botón "Activar" parecía no hacer nada y la persona pensaba que la
  // app estaba rota. Lo detectamos aquí y mostramos instrucciones claras en vez del botón.
  const enIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const iosSinInstalar = enIOS && !instalada;
  if(iosSinInstalar){
    body.innerHTML = `
      <div class="card">
        <h3>Notificaciones push</h3>
        <p class="muted small">📵 En iPhone, Safari solo permite notificaciones si agregan la app a la pantalla de inicio primero.</p>
        <div style="margin-top:8px;padding:12px;background:rgba(238,177,205,.2);border-radius:12px;font-size:13px;color:var(--tinta-suave);line-height:1.6">
          <b>Para activarlas en este iPhone:</b><br>
          1. Toca el botón <b>Compartir</b> (□↑) en la barra de Safari.<br>
          2. Elige <b>"Agregar a pantalla de inicio"</b>.<br>
          3. Abre "Notre petit monde" desde el ícono que aparece en tu pantalla de inicio (no desde Safari).<br>
          4. Vuelve aquí a Ajustes → Notificaciones y toca "Activar".
        </div>
      </div>
      <div class="card">
        <h3>¿Qué quieres recibir?</h3>
        <p class="muted small">Puedes configurar tus preferencias desde ya; se aplicarán en cuanto actives las notificaciones.</p>
        <div class="config-list">
          ${items.map(it=>`<div class="config-item"><div class="config-item-info"><div class="config-item-icon ${it.color}">${it.icon}</div><div><label>${it.label}</label><div class="sub">${it.sub}</div></div></div><button class="config-toggle ${configToggles[it.key]?'on':''}" onclick="toggleConfig('${it.key}',this)"></button></div>`).join('')}
        </div>
      </div>`;
    return;
  }
  const permiso = estadoPermisoPush();
  // No basta con mirar el permiso del navegador: puede decir "granted" y aun así no
  // existir (o haberse perdido) el token guardado en el servidor. Verificamos/renovamos
  // el token real antes de decidir qué mostrar, y de paso esto autorepara el dispositivo
  // (salvo que la persona lo haya desactivado a propósito aquí, ver pushDesactivadoManualmente).
  const tokenActivo = permiso==='granted' ? await verificarYRenovarTokenPush() : false;
  const desactivadoAProposito = permiso==='granted' && !tokenActivo && pushDesactivadoManualmente();
  const estadoTxt = permiso==='denied' ? '🔕 Bloqueadas por el navegador'
    : (permiso!=='granted' || desactivadoAProposito) ? '🔕 No activadas en este dispositivo'
    : tokenActivo ? '🔔 Activadas en este dispositivo'
    : '⚠️ Permiso concedido, pero este dispositivo no está registrado. Toca el botón para repararlo.';
  body.innerHTML = `
    <div class="card">
      <h3>Notificaciones push</h3>
      <p class="muted small">${estadoTxt}</p>
      ${permiso==='denied'
        ? `<div style="margin-top:8px;padding:12px;background:rgba(230,150,150,.15);border-radius:12px;font-size:12.5px;color:var(--tinta-suave)">Bloqueaste los permisos de notificación en el navegador. Actívalos desde los ajustes del sitio en tu navegador para poder recibir avisos con la app cerrada.</div>`
        : (permiso==='granted' && tokenActivo)
          ? `<button class="btn btn-sm btn-outline" style="margin-top:8px" onclick="desactivarNotificacionesPush()">Desactivar en este dispositivo</button>`
          : `<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="activarNotificacionesPush()">${(permiso==='granted' && !desactivadoAProposito) ? 'Reparar / reactivar notificaciones push 🔔' : 'Activar notificaciones push 🔔'}</button>`
      }
    </div>
    <div class="card">
      <h3>¿Qué quieres recibir?</h3>
      <p class="muted small">Administra qué notificaciones recibes.</p>
      <div class="config-list">
        ${items.map(it=>`<div class="config-item"><div class="config-item-info"><div class="config-item-icon ${it.color}">${it.icon}</div><div><label>${it.label}</label><div class="sub">${it.sub}</div></div></div><button class="config-toggle ${configToggles[it.key]?'on':''}" onclick="toggleConfig('${it.key}',this)"></button></div>`).join('')}
      </div>
      <div style="margin-top:12px;padding:12px;background:rgba(201,230,242,.3);border-radius:12px;font-size:12.5px;color:var(--tinta-suave)">
        ℹ️ Con las notificaciones push activadas, estas alertas llegan incluso con la app cerrada.
      </div>
    </div>`;
}
function renderConfigCuenta(body){
  const user = SESSION?.user||{};
  body.innerHTML = `
    <div class="card">
      <h3>Información de cuenta</h3>
      <div class="config-list">
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">📧</div><div><label>Correo electrónico</label><div class="sub">${esc(user.email||'—')}</div></div></div></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">🔑</div><div><label>Contraseña</label><div class="sub">Cambiar contraseña</div></div></div><button class="btn btn-sm btn-outline" onclick="cambiarContrasena()">Cambiar</button></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">💾</div><div><label>Sincronización</label><div class="sub">Datos sincronizados automáticamente</div></div></div><span style="color:var(--ok);font-size:13px;font-weight:700">✓ Activa</span></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon blue">👤</div><div><label>Mi perfil</label><div class="sub">Editar nombre, avatar y datos personales</div></div></div><button class="btn btn-sm btn-outline" onclick="verPerfil()">Editar</button></div>
      </div>
    </div>
    <div class="card">
      <div class="danger-zone">
        <h3>Zona de peligro</h3>
        <p class="small" style="color:var(--tinta-suave);margin:0 0 12px">Estas acciones son irreversibles.</p>
        <div class="config-list">
          <div class="config-item"><div class="config-item-info"><div class="config-item-icon red">🔓</div><div><label>Desvincular pareja</label><div class="sub">Salir del hogar compartido</div></div></div><button class="btn btn-sm btn-danger" onclick="confirmarDesvincular()">Desvincular</button></div>
          <div class="config-item" style="margin-top:8px"><div class="config-item-info"><div class="config-item-icon red">🗑️</div><div><label>Eliminar cuenta</label><div class="sub">Eliminar todos tus datos permanentemente</div></div></div><button class="btn btn-sm btn-danger" onclick="confirmarEliminarCuenta()">Eliminar</button></div>
        </div>
      </div>
    </div>`;
}
async function cambiarContrasena(){
  const email = SESSION?.user?.email;
  if(!email||isDemoMode()){ toast('Inicia sesión real para cambiar contraseña'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, {redirectTo:window.location.href});
  if(error){ toast('Error: '+error.message); return; }
  toast('Se envió un enlace a tu correo 📩');
}
async function confirmarDesvincular(){
  if(isDemoMode()){ toast('Inicia sesión real para desvincularte de un hogar'); return; }
  if(!confirm('¿Seguro que quieres salir de este hogar compartido? Tu pareja conservará el contenido compartido, y podrás crear o unirte a otro hogar a continuación.')){ toast('Cancelado'); return; }
  try{
    const { error } = await sb.from('couple_members').delete().eq('couple_id', SESSION.coupleId).eq('user_id', SESSION.user.id);
    if(error){ toast('No se pudo desvincular: ' + error.message); return; }
    if(window._hogarChannel){ sb.removeChannel(window._hogarChannel); window._hogarChannel = null; }
    if(window._chatPollInterval){ clearInterval(window._chatPollInterval); window._chatPollInterval = null; }
    MEMBERS = {}; CACHE.perfiles = {};
    SESSION = { user: SESSION.user };
    document.getElementById('app').style.display='none';
    document.getElementById('onboarding').style.display='flex';
    toast('Te has desvinculado del hogar 💔');
    pantallaHogar();
  }catch(e){
    console.error(e);
    toast('No se pudo desvincular. Intenta de nuevo.');
  }
}
async function confirmarEliminarCuenta(){
  if(isDemoMode()){ toast('Inicia sesión real para eliminar tu cuenta'); return; }
  if(!confirm('¿Seguro que quieres eliminar tu cuenta de forma permanente? Esta acción no se puede deshacer.')){ toast('Cancelado'); return; }
  toast('Eliminando tu cuenta…');
  try{
    const { data:{ session } } = await sb.auth.getSession();
    if(!session){ toast('Tu sesión expiró, vuelve a iniciar sesión'); return; }
    const res = await fetch(SUPABASE_URL + '/functions/v1/delete-account', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY }
    });
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.error){ toast('No se pudo eliminar la cuenta: ' + (json.error || res.status)); return; }
    toast('Cuenta eliminada. Gracias por haber estado aquí 💔');
    await sb.auth.signOut();
    setTimeout(()=>location.reload(), 1400);
  }catch(e){
    console.error(e);
    toast('No se pudo eliminar la cuenta. Intenta de nuevo.');
  }
}
function renderConfigPrivacidad(body){
  body.innerHTML = `
    <div class="card">
      <h3>Privacidad y seguridad</h3>
      <p class="muted small">Tu información está protegida y es solo para ustedes dos.</p>
      <div class="config-list">
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon green">🔒</div><div><label>Cifrado de mensajes</label><div class="sub">Todos los mensajes viajan por conexión cifrada (HTTPS)</div></div></div><span style="color:var(--ok);font-size:13px;font-weight:700">✓ Activo</span></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon green">🛡️</div><div><label>Seguridad de sesión</label><div class="sub">Sesiones protegidas con tokens seguros de Supabase</div></div></div><span style="color:var(--ok);font-size:13px;font-weight:700">✓ Activo</span></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">🖼️</div><div><label>Fotos privadas</label><div class="sub">Solo accesibles por su pareja (reglas de acceso a nivel de fila)</div></div></div><span style="color:var(--ok);font-size:13px;font-weight:700">✓ Privadas</span></div>
        <div class="config-item"><div class="config-item-info"><div class="config-item-icon blue">📊</div><div><label>Datos compartidos</label><div class="sub">Ver qué datos están sincronizados</div></div></div><button class="btn btn-sm btn-outline" onclick="toast('Chat, álbum, cartas y recuerdos están sincronizados entre ambos')">Ver</button></div>
      </div>
      <div style="margin-top:12px;padding:12px;background:rgba(143,191,159,.2);border-radius:12px;font-size:12.5px;color:var(--tinta-suave)">
        🔐 Notre Petit Monde nunca vende ni comparte tus datos. Tu mundo es exclusivamente suyo.
      </div>
    </div>`;
}
function renderConfigManual(body){
  const secciones=[
    {icon:'🏡',titulo:'Inicio',desc:'Pantalla principal con racha de días, estado de ánimo, próximo evento y accesos rápidos.'},
    {icon:'💭',titulo:'Conóceme',desc:'Su enciclopedia de pareja: gustos, disgustos, deseos, tallas, alergias, regalos ideales, sueños, redes sociales y fechas importantes para que se conozcan mejor.'},
    {icon:'💞',titulo:'Nosotros',desc:'Todo lo que gira en torno a ustedes como pareja.',subs:[
      {titulo:'Resumen',desc:'Datos de la relación: fecha de inicio, aniversario, contadores, metas en pareja y frasco de recuerdos.'},
      {titulo:'Universo',desc:'"Nuestro Universo": un cielo nocturno donde cada recuerdo favorito es una estrella, cada aniversario una luna, cada carta una constelación y cada dibujo o postal un pequeño planeta.'},
      {titulo:'Muro de momentos',desc:'Tablero libre para arrastrar fotos, cartas, dibujos, postales y notas y acomodarlos como quieran.'},
      {titulo:'Nuestro perfil',desc:'Tarjeta compartida con los avatares y apodos de ambos, los días juntos, el aniversario, su canción y frase de pareja, y una vista rápida al perfil individual de cada uno.'},
    ]},
    {icon:'🌸',titulo:'Conexión',desc:'Espacio para fortalecer el vínculo emocional día a día.',subs:[
      {titulo:'Recuerdos',desc:'Banco de anécdotas, frases, promesas, primeras veces, apodos y lugares especiales.'},
      {titulo:'Love Language',desc:'Descubre y registra el lenguaje del amor de cada uno.'},
      {titulo:'Pregunta del día',desc:'Una pregunta nueva cada día para conocerse más a fondo.'},
      {titulo:'Conversar',desc:'Temas guiados para tener conversaciones profundas en pareja.'},
      {titulo:'Check-in',desc:'Revisión semanal de cómo va la relación.'},
    ]},
    {icon:'💌',titulo:'Cartas',desc:'Correspondencia escrita y visual entre ambos.',subs:[
      {titulo:'Cartas',desc:'Escribe cartas selladas, elige sobre y sello, agrega una canción, bloquéalas hasta una fecha o prográmalas. Organízalas como un correo real: Buzón, Enviados, Importantes, Archivo y Papelera.'},
      {titulo:'Postales',desc:'Constructor de postales avanzado con capas: elige el fondo, añade texto y pegatinas, arrástralos donde quieras y guarda el resultado en el Álbum.'},
    ]},
    {icon:'🎨',titulo:'Crear',desc:'Herramientas para hacer cosas juntos a mano.',subs:[
      {titulo:'Dibujo',desc:'Dibujen juntos en un lienzo compartido, se guarda en el álbum.'},
      {titulo:'Escritura a mano',desc:'Escribe mensajes con trazo a mano libre.'},
      {titulo:'Firma',desc:'Crea tu firma personal para dejar en cartas y tarjetas.'},
      {titulo:'Tarjeta romántica',desc:'Arma una tarjeta con plantillas y mensajes prediseñados.'},
    ]},
    {icon:'🖼️',titulo:'Álbum',desc:'Todo su contenido visual y multimedia guardado en un solo lugar.',subs:[
      {titulo:'Fotos',desc:'Fotos, videos, audios, dibujos, collages, firmas y tarjetas organizados por carpetas y tipo, con "Hace un tiempo" para revivir recuerdos. Incluye cámara integrada con marcos, filtros, fecha automática y temporizador.'},
      {titulo:'Multimedia',desc:'Contenido multimedia especial de la pareja: cápsulas de voz, videos de recuerdos e historias tipo galería.'},
      {titulo:'Película',desc:'Une fotos favoritas, videos, cartas importantes y dibujos en una secuencia reproducible, con música de fondo opcional. Sin inteligencia artificial: solo organiza lo que ya guardan.'},
      {titulo:'Biblioteca',desc:'Todo su álbum en un solo lugar, con filtros por favoritos, más vistos, recientes, aleatorio, persona, emoción y etiqueta.'},
    ]},
    {icon:'📅',titulo:'Calendario',desc:'Agrega hitos y fechas especiales con emoji, con recordatorio anual automático opcional.'},
    {icon:'💬',titulo:'Chat',desc:'Chat privado con fotos, videos, audios, archivos, stickers, GIFs y emojis NPM; permite responder, editar, reaccionar, buscar, programar y enviar mensajes temporales. Los botones 📞 y 🎥 de la esquina superior inician una llamada de voz o videollamada en vivo con tu pareja (con aviso de llamada entrante para contestar o rechazar), y cada llamada queda registrada en la conversación con su hora y duración.'},
    {icon:'🎵',titulo:'Música',desc:'Playlist compartida con canciones de Spotify, YouTube, Apple Music, SoundCloud u otra fuente.'},
    {icon:'🎬',titulo:'Entretenimiento',desc:'Lista de películas, series, juegos, libros y otros planes que quieren disfrutar juntos.'},
    {icon:'🎁',titulo:'Regalos',desc:'Detalles digitales para sorprender a tu pareja.',subs:[
      {titulo:'Cupones',desc:'Cupones canjeables por favores o detalles especiales.'},
      {titulo:'Caja sorpresa',desc:'Sorpresas ocultas que se revelan al abrirlas.'},
      {titulo:'Caja de regalos',desc:'Guarda los regalos que se han dado y recibido, con fecha, notas, foto y valor sentimental.'},
    ]},
    {icon:'🎲',titulo:'Juegos',desc:'Minijuegos para divertirse en pareja.',subs:[
      {titulo:'Verdad o reto',desc:'El clásico juego de preguntas y retos.'},
      {titulo:'Nunca nunca',desc:'Descubran hábitos y anécdotas del otro.'},
      {titulo:'Ruleta de retos',desc:'Gira la ruleta y cumple el reto que salga.'},
      {titulo:'Preguntas rápidas',desc:'Ronda ágil de preguntas para conocerse mejor.'},
      {titulo:'4 en línea',desc:'Conecta cuatro fichas antes que tu pareja.'},
      {titulo:'Trivia',desc:'Preguntas de cultura general para competir juntos.'},
      {titulo:'Memorama',desc:'Encuentra las parejas de cartas iguales.'},
      {titulo:'Ahorcado',desc:'Adivina la palabra letra por letra.'},
      {titulo:'Bingo',desc:'Bingo temático de pareja.'},
      {titulo:'Rompecabezas',desc:'Arma un rompecabezas con una imagen elegida.'},
      {titulo:'Adivina quién',desc:'Adivina de quién o qué se trata con pistas.'},
    ]},
    {icon:'🧩',titulo:'Compatibilidad',desc:'Herramientas para conocer qué tan compatibles son.',subs:[
      {titulo:'Test de compatibilidad',desc:'Cuestionario que compara respuestas de ambos.'},
      {titulo:'MBTI',desc:'Registra y compara los tipos de personalidad de la pareja.'},
    ]},
    {icon:'🎯',titulo:'Elecciones',desc:'Herramientas para decidir y celebrar juntos (antes llamada Pareja+).',subs:[
      {titulo:'Decisiones',desc:'Escriban opciones (restaurante, película, etc.) y la app sortea una por ustedes.'},
      {titulo:'Ruleta',desc:'Ruletas personalizadas y guardables para girar y decidir juntos.'},
      {titulo:'Perfil de la relación',desc:'Un perfil compartido (no individual): nombre de la pareja, biografía, foto principal, color favorito y metas.'},
    ]},
    {icon:'💕',titulo:'Colecciones',desc:'Guarda y organiza recuerdos por categorías temáticas de la relación (incluye el Muro de agradecimientos).',subs:[
      {titulo:'Recetas',desc:'Libro de recetas con favoritas, pendientes y preparadas, calificación de 1 a 5, foto, tiempo e ingredientes.'},
      {titulo:'Ver colecciones',desc:'Lugares, restaurantes, cafés, series, libros, wishlist y demás colecciones temáticas guardadas.'},
    ]},
    {icon:'📖',titulo:'Recuerdos',desc:'Espacio para guardar momentos con más profundidad.',subs:[
      {titulo:'Diario',desc:'Diario personal (privado) o compartido con tu pareja.'},
      {titulo:'Scrapbook',desc:'Álbum de recortes digital. Vista en cuadrícula clásica o "Páginas libres": arrastra fotos, cartas, dibujos, postales, notas, stickers, washi tape y flores donde quieras, con textura de papel elegible y varias páginas.'},
      {titulo:'Cápsula',desc:'Cápsulas del tiempo que se sellan y abren en una fecha futura.'},
    ]},
    {icon:'🗂️',titulo:'Organización',desc:'Herramientas para organizar la vida en pareja.',subs:[
      {titulo:'Finanzas',desc:'Presupuesto y gastos compartidos.'},
      {titulo:'Compras',desc:'Lista de compras compartida.'},
      {titulo:'Eventos',desc:'Planeación de eventos con detalles y presupuesto.'},
      {titulo:'Checklists',desc:'Listas de tareas para organizar planes juntos.'},
      {titulo:'Planes',desc:'Planificador de citas por categoría (restaurante, cafetería, picnic, cine, museo, parque, viaje o personalizado), con fecha, lugar y notas.'},
    ]},
    {icon:'😊',titulo:'Emojis NPM',desc:'Galería de emojis exclusivos; tócalos para copiarlos o envíalos directo desde el chat.'},
    {icon:'🎭',titulo:'Emociones',desc:'Registra cómo te sientes cada día con emoji, intensidad, motivo y nota; guarda el historial de ambos.'},
    {icon:'👤',titulo:'Avatar',desc:'Personaliza tu avatar chibi (cabello, ropa, accesorios, vello, expresiones y colores) y mira el avatar combinado de la pareja.'},
    {icon:'✨',titulo:'Extras',desc:'Funciones adicionales para el día a día.',subs:[
      {titulo:'Botón de emergencia',desc:'Envía una señal instantánea cuando necesitas apoyo.'},
      {titulo:'Notas motivacionales',desc:'Genera frases de motivación, apoyo o cariño al instante.'},
      {titulo:'Pregunta para conocerse',desc:'Pregunta aleatoria para profundizar en la relación.'},
      {titulo:'Cuenta regresiva',desc:'Cuentas regresivas personalizadas para planes o fechas especiales.'},
      {titulo:'Notas',desc:'Notas rápidas compartidas, personales, fijadas o con recordatorio.'},
      {titulo:'Línea del tiempo',desc:'Todos sus eventos importantes, fotos favoritas, cartas destacadas y notas de diario compartido, en orden cronológico, con filtro por año y buscador.'},
    ]},
    {icon:'📍',titulo:'Mapa de Recuerdos',desc:'Guarden lugares especiales en un mapa, a mano, sin ubicación en tiempo real.',subs:[
      {titulo:'Lugares',desc:'Guarda un recuerdo con nombre, categoría, fecha, fotos, videos y una ubicación que tú eliges en el mapa (o con "Usar mi ubicación actual", una sola vez).'},
      {titulo:'Lista',desc:'Todos los lugares guardados, con filtros por categoría, favoritos, etiqueta y texto.'},
      {titulo:'Por visitar',desc:'Lugares pendientes con prioridad y fecha planeada; conviértelos en recuerdo cuando los visiten.'},
      {titulo:'Rutas',desc:'Recorridos con paradas, fotos y notas, mostrados como una secuencia.'},
      {titulo:'Resumen',desc:'Estadísticas simples de los lugares que han guardado a mano.'},
      {titulo:'Nuestra Distancia',desc:'Función 100% opcional y desactivada por defecto: si ambos aceptan compartir una ubicación aproximada, ven una distancia aproximada entre ustedes (por ejemplo "a pocos minutos" o "aproximadamente a 12 km"), nunca la ubicación exacta ni un historial. Se puede pausar, renovar o dejar de compartir en cualquier momento desde esta misma pestaña.'},
      {titulo:'Privacidad',desc:'Confirma, dentro de la propia app, qué sí y qué no hace el Mapa de Recuerdos con la ubicación.'},
    ]},
    {icon:'⚙️',titulo:'Ajustes',desc:'Configuración general de la cuenta y la app.',subs:[
      {titulo:'General',desc:'Preferencias generales de la app.'},
      {titulo:'Personalización',desc:'Temas, fuentes, música ambiental, widgets del inicio, efecto de partículas (pétalos, lluvia, nieve, estrellas, corazones o burbujas), fondo vivo según la hora del día y Decoración (washi tape, marcos, sellos, pegatinas y colores). Aquí también eligen, en "Ocultar funciones que no usen", qué pestañas quieren tener activas en el menú: las que oculten desaparecen de la barra y del menú ☰, y pueden volver a mostrarlas cuando quieran.'},
      {titulo:'Notificaciones',desc:'Activa o desactiva avisos de mensajes, cartas, fechas y más.'},
      {titulo:'Sonidos',desc:'Efectos de sonido de la app.'},
      {titulo:'Accesibilidad',desc:'Ajustes para facilitar el uso de la app.'},
      {titulo:'Copias',desc:'Exporta o respalda la información de la pareja.'},
      {titulo:'Cuenta',desc:'Datos de tu cuenta y opción de eliminarla.'},
      {titulo:'Privacidad',desc:'Controla qué comparte la app y con quién.'},
      {titulo:'Bloqueo PIN',desc:'Protege el acceso a la app con un PIN.'},
      {titulo:'Manual',desc:'Esta guía con todas las funciones de la app.'},
      {titulo:'Legal',desc:'Términos, política de privacidad y derechos de contenido.'},
    ]},
  ];
  body.innerHTML = `
    <div class="card">
      <h2>📘 Manual de funciones</h2>
      <p class="muted small">Todo lo que necesitan saber para usar su pequeño mundo.</p>
      <div class="manual-section">
        ${secciones.map(s=>`<div class="manual-item">
          <div class="manual-item-head"><div class="manual-icon">${s.icon}</div><div><div class="manual-title">${s.titulo}</div><div class="manual-desc">${s.desc}</div></div></div>
          ${s.subs?`<ul class="manual-subs">${s.subs.map(sub=>`<li><b>${sub.titulo}:</b> ${sub.desc}</li>`).join('')}</ul>`:''}
        </div>`).join('')}
      </div>
      <div style="margin-top:16px;padding:14px;background:linear-gradient(135deg,rgba(246,207,224,.4),rgba(220,208,242,.4));border-radius:14px;text-align:center">
        <div style="font-size:20px">💗</div>
        <div style="font-size:13.5px;font-family:'Fraunces',serif">Notre Petit Monde</div>
        <div class="small muted">Su pequeño mundo, solo para ustedes dos.</div>
      </div>
    </div>`;
}
function renderConfigLegal(body){
  body.innerHTML = `
    <div class="card">
      <h2>📄 Legal</h2>
      <p class="muted small">Última actualización: ${new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long'})}</p>
    </div>
    <div class="legal-block">
      <div class="legal-title">📋 Términos y condiciones de uso</div>
      <div class="legal-body">${terminosCondicionesHTML()}</div>
    </div>
    <div class="legal-block">
      <div class="legal-title">🔒 Política de privacidad</div>
      <div class="legal-body">
        <ul>
          <li><b>Datos que recopilamos:</b> Correo electrónico, mensajes del chat, fotos y videos subidos y configuración del perfil.</li>
          <li><b>Uso de datos:</b> Tus datos se usan exclusivamente para proveer el servicio. Nunca vendemos ni compartimos tu información con terceros.</li>
          <li><b>Seguridad de datos:</b> Usamos Supabase con cifrado en tránsito (HTTPS/TLS) y en reposo. Tu información está protegida con autenticación segura.</li>
          <li><b>Almacenamiento:</b> Los archivos multimedia se almacenan en servidores seguros. Solo tú y tu pareja pueden acceder a ellos.</li>
          <li><b>Retención:</b> Tus datos se conservan mientras tu cuenta esté activa. Al eliminar tu cuenta, todos tus datos son eliminados permanentemente.</li>
          <li><b>Derechos:</b> Tienes derecho a acceder, rectificar y eliminar tus datos en cualquier momento desde Ajustes → Cuenta.</li>
        </ul>
      </div>
    </div>
    <div class="legal-block">
      <div class="legal-title">📍 Nuestra Distancia</div>
      <div class="legal-body">
        <ul>
          <li><b>Es opcional y está apagada por defecto:</b> vive dentro de Mapa de Recuerdos y nunca se activa por sí sola.</li>
          <li><b>Requiere consentimiento mutuo:</b> solo funciona si ambos miembros de la pareja la activan de forma explícita. Si uno no acepta, o revoca su permiso, la función queda apagada para los dos.</li>
          <li><b>Nunca es exacta:</b> jamás se muestra ni se guarda la dirección, la calle, el número o las coordenadas exactas de nadie; solo una distancia aproximada (por ejemplo "a pocos minutos" o "aproximadamente a 12 km").</li>
          <li><b>Sin historial ni vigilancia:</b> no se guarda historial de ubicaciones ni de rutas, no hay geocercas, no hay alertas de llegada o salida y no hay seguimiento en segundo plano. El GPS del dispositivo solo se lee cuando la persona pulsa un botón explícito para activarla o actualizarla.</li>
          <li><b>Con límite de tiempo:</b> se comparte solo por el tiempo que la persona elige (1 hora, 8 horas, hasta el final del día, o hasta desactivarla a mano), y se apaga sola al vencer.</li>
          <li><b>Reversible al instante:</b> se puede pausar, renovar o dejar de compartir en cualquier momento desde la propia función.</li>
          <li><b>Solo para su pareja:</b> esta información nunca se comparte con terceros ni se usa con fines publicitarios.</li>
        </ul>
      </div>
    </div>
    <div class="legal-block">
      <div class="legal-title">🖼️ Derechos del contenido</div>
      <div class="legal-body">
        <ul>
          <li>Las fotos, videos, dibujos y mensajes que creas dentro de la app son de tu propiedad.</li>
          <li>Al subirlos, otorgas a Notre Petit Monde una licencia limitada y no exclusiva para almacenar y mostrar el contenido únicamente a los usuarios vinculados en el hogar.</li>
          <li>No tienes derecho a descargar ni redistribuir el contenido de tu pareja sin su consentimiento.</li>
        </ul>
      </div>
    </div>
    <div class="legal-block">
      <div class="legal-title">🗑️ Eliminación de cuenta</div>
      <div class="legal-body">
        <p>Para eliminar tu cuenta ve a <b>Ajustes → Cuenta → Eliminar cuenta</b>. Al hacerlo:</p>
        <ul>
          <li>Se eliminan permanentemente todos tus datos personales.</li>
          <li>Los mensajes, cartas, fotos y demás contenido compartido con tu pareja permanecen visibles para ella, mostrando "cuenta eliminada" en lugar de tu nombre.</li>
          <li>Tu diario personal (privado) se borra por completo, ya que nadie más podía leerlo.</li>
          <li>El hogar compartido puede continuar si tu pareja decide crear uno nuevo.</li>
          <li>Esta acción es inmediata y no puede deshacerse.</li>
        </ul>
      </div>
    </div>`;
}
async function toggleConfig(key,btn){
  configToggles[key]=!configToggles[key];
  btn.classList.toggle('on', configToggles[key]);
  if(key==='efectosPetals'){ const p=document.getElementById('petals'); if(p) p.style.display = configToggles[key]?'':'none'; }
  toast(configToggles[key]?'Activado ✓':'Desactivado');
  const NOTIF_KEY_MAP = {notifMensajes:'mensajes', notifAniversario:'aniversario', notifEmergencia:'emergencia', notifCartas:'cartas', notifBuenosDias:'buenosdias', notifBuenasNoches:'buenasnoches', notifRomantico:'romantico', notifRecuerdo:'recuerdo', notifWidgets:'widgets'};
  if(NOTIF_KEY_MAP[key] && SESSION?.user?.id && !isDemoMode()){
    const prefs = {
      mensajes: configToggles.notifMensajes,
      aniversario: configToggles.notifAniversario,
      emergencia: configToggles.notifEmergencia,
      cartas: configToggles.notifCartas,
      buenosdias: configToggles.notifBuenosDias,
      buenasnoches: configToggles.notifBuenasNoches,
      romantico: configToggles.notifRomantico,
      recuerdo: configToggles.notifRecuerdo,
      widgets: configToggles.notifWidgets,
      mascota: true,
    };
    const { error } = await sb.from('profiles').update({notif_prefs:prefs}).eq('user_id', SESSION.user.id);
    if(error) console.error('No se pudo guardar preferencia de notificación', error);
  }
}
async function cargarNotifPrefs(){
  if(isDemoMode() || !SESSION?.user?.id) return;
  const { data } = await sb.from('profiles').select('notif_prefs').eq('user_id', SESSION.user.id).maybeSingle();
  const p = data?.notif_prefs;
  if(p){
    configToggles.notifMensajes = p.mensajes !== false;
    configToggles.notifAniversario = p.aniversario !== false;
    configToggles.notifEmergencia = p.emergencia !== false;
    configToggles.notifCartas = p.cartas !== false;
    configToggles.notifBuenosDias = p.buenosdias !== false;
    configToggles.notifBuenasNoches = p.buenasnoches !== false;
    configToggles.notifRomantico = p.romantico !== false;
    configToggles.notifRecuerdo = p.recuerdo !== false;
    configToggles.notifWidgets = p.widgets !== false;
  }
}
function estadoPermisoPush(){
  if(!('Notification' in window)) return 'no-soportado';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}
// El permiso de notificaciones del navegador NO se puede revocar por código una vez
// concedido (por diseño de los navegadores). Por eso "desactivar" en la app no puede
// depender de que Notification.permission vuelva a 'default': necesitamos nuestra propia
// bandera para recordar "esta persona apagó las notificaciones en este dispositivo a
// propósito", y que tanto la reparación automática como la pantalla de Configuración la
// respeten en vez de volver a activar todo solas.
const PUSH_DESACTIVADO_KEY = 'npm_push_desactivado_manualmente';
function marcarPushDesactivadoManualmente(valor){
  try{
    if(valor) localStorage.setItem(PUSH_DESACTIVADO_KEY, '1');
    else localStorage.removeItem(PUSH_DESACTIVADO_KEY);
  }catch(e){ /* si localStorage no está disponible, seguimos sin bloquear nada */ }
}
function pushDesactivadoManualmente(){
  try{ return localStorage.getItem(PUSH_DESACTIVADO_KEY)==='1'; }catch(e){ return false; }
}
async function activarNotificacionesPush(){
  if(isDemoMode()){ toast('Inicia sesión real para activar notificaciones'); return; }
  if(!('Notification' in window) || !('serviceWorker' in navigator)){
    toast('Este navegador no soporta notificaciones push'); return;
  }
  marcarPushDesactivadoManualmente(false); // la persona está reactivando explícitamente
  try{
    const permiso = await Notification.requestPermission();
    if(permiso !== 'granted'){ toast('No diste permiso para las notificaciones'); renderConfig(); return; }
    const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    const messaging = initFirebaseMessaging();
    let token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
    if(!token){ toast('No se pudo generar el token de notificaciones'); return; }
    let { error } = await sb.from('push_tokens').upsert(
      { user_id: SESSION.user.id, couple_id: SESSION.coupleId, token, plataforma:'web', updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );
    if(error){
      // BUG REAL: el token de FCM está atado al navegador/dispositivo físico, no a la
      // cuenta. Si antes otra persona inició sesión en este MISMO navegador y activó
      // notificaciones, Firebase nos devuelve exactamente el mismo token de siempre — y
      // como esa fila en push_tokens le pertenece a la otra cuenta, RLS bloquea que la
      // reescribamos con nuestro user_id (el upsert intenta un UPDATE sobre una fila que
      // no es nuestra). Antes esto fallaba en silencio y la persona se quedaba sin
      // notificaciones sin saber por qué. Ahora, si el guardado falla, invalidamos el
      // token viejo con deleteToken() y pedimos uno NUEVO (que sí podremos insertar como
      // fila propia), y reintentamos una vez automáticamente.
      console.error('Fallo al guardar el token (posible token de otra cuenta en este dispositivo), reintentando con uno nuevo', error);
      try{ await messaging.deleteToken(); }catch(e){}
      token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
      if(token){
        ({ error } = await sb.from('push_tokens').upsert(
          { user_id: SESSION.user.id, couple_id: SESSION.coupleId, token, plataforma:'web', updated_at: new Date().toISOString() },
          { onConflict: 'token' }
        ));
      }
    }
    if(error || !token){ console.error(error); toast('No se pudo guardar el token en el servidor'); return; }
    toast('Notificaciones push activadas en este dispositivo 🔔');
    renderConfig();
  }catch(e){
    console.error(e);
    toast('No se pudieron activar las notificaciones: '+(e.message||e));
  }
}
// ================= AUTO-REPARACIÓN DE NOTIFICACIONES PUSH =================
// Bug real encontrado: la pantalla de Configuración solo miraba Notification.permission
// ('granted'/'denied'/'default') para decidir si mostraba "Activadas" o el botón para
// activarlas. Pero ese permiso vive en el navegador y NO garantiza que el token de FCM
// se haya guardado en push_tokens (pudo fallar el guardado, se pudo borrar el token por
// inválido, o el permiso se concedió en una sesión vieja que nunca completó el registro).
// Resultado: la app decía "🔔 Activadas en este dispositivo" sin que hubiera ningún token
// real en la base de datos, así que nunca llegaba nada aunque "estuvieran activadas".
// Esta función revisa/renueva el token en silencio cada vez que hay permiso concedido,
// así el dispositivo se "autorepara" sin que la persona tenga que hacer nada — EXCEPTO
// si la persona lo desactivó a propósito en este dispositivo (ver PUSH_DESACTIVADO_KEY):
// en ese caso, respetamos su elección y no reactivamos nada solos.
async function verificarYRenovarTokenPush(){
  if(isDemoMode() || !SESSION?.user?.id) return false;
  if(!('Notification' in window) || Notification.permission!=='granted') return false;
  if(!('serviceWorker' in navigator)) return false;
  if(pushDesactivadoManualmente()) return false;
  try{
    const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    const messaging = initFirebaseMessaging();
    let token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
    if(!token) return false;
    let { error } = await sb.from('push_tokens').upsert(
      { user_id: SESSION.user.id, couple_id: SESSION.coupleId, token, plataforma:'web', updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );
    if(error){
      // Mismo caso que en activarNotificacionesPush(): el token puede pertenecer a otra
      // cuenta que usó este dispositivo antes. Invalidamos y pedimos uno nuevo.
      console.error('No se pudo renovar el token push, reintentando con uno nuevo', error);
      try{ await messaging.deleteToken(); }catch(e){}
      token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
      if(token){
        ({ error } = await sb.from('push_tokens').upsert(
          { user_id: SESSION.user.id, couple_id: SESSION.coupleId, token, plataforma:'web', updated_at: new Date().toISOString() },
          { onConflict: 'token' }
        ));
      }
    }
    if(error || !token){ console.error('No se pudo renovar el token push', error); return false; }
    return true;
  }catch(e){
    console.error('No se pudo verificar/renovar el token push', e);
    return false;
  }
}
async function desactivarNotificacionesPush(){
  if(isDemoMode() || !SESSION?.user?.id) return;
  try{
    const messaging = initFirebaseMessaging();
    const reg = await navigator.serviceWorker.getRegistration();
    let token = null;
    try{ token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg }); }catch(e){}
    if(token) await sb.from('push_tokens').delete().eq('token', token);
    // No basta con borrar el token del servidor: Firebase lo sigue teniendo guardado en
    // este navegador, y como el permiso de notificaciones ya está concedido (no se puede
    // "quitar" con código), la próxima vez que algo pidiera el token —incluida nuestra
    // propia autoreparación— recibiría este MISMO token y lo volvería a guardar solo,
    // deshaciendo la desactivación sin avisar. deleteToken() invalida la suscripción real.
    try{ await messaging.deleteToken(); }catch(e){ /* no crítico si ya no había token */ }
    marcarPushDesactivadoManualmente(true);
    toast('Notificaciones push desactivadas en este dispositivo');
    renderConfig();
  }catch(e){ console.error(e); toast('No se pudo desactivar'); }
}
