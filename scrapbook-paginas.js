/* ================= PERSONALIZACIÓN DE CLIMA + FONDO VIVO ================= */
const EFECTOS_CLIMA = [
  {id:'petalos', label:'🌸 Pétalos', clase:'petal'},
  {id:'lluvia', label:'🌧️ Lluvia', clase:'particula-lluvia'},
  {id:'nieve', label:'❄️ Nieve', clase:'particula-nieve'},
  {id:'estrellas', label:'✨ Estrellas', clase:'particula-estrella', emoji:'✨'},
  {id:'corazones', label:'💗 Corazones', clase:'particula-corazon', emoji:'💗'},
  {id:'burbujas', label:'🫧 Burbujas', clase:'particula-burbuja'},
];
function aplicarParticulasElegidas(){
  const wrap = document.getElementById('petals');
  if(!wrap) return;
  wrap.innerHTML = '';
  const activo = (typeof PERSONALIZACION!=='undefined' && PERSONALIZACION.efectosPetals!==false);
  if(!activo) return;
  const tipoId = (typeof PERSONALIZACION!=='undefined' && PERSONALIZACION.tipoParticula) || 'petalos';
  const cfg = EFECTOS_CLIMA.find(e=>e.id===tipoId) || EFECTOS_CLIMA[0];
  const esBurbuja = cfg.id==='burbujas';
  for(let i=0;i<14;i++){
    const p = document.createElement('div');
    p.className = cfg.clase;
    p.style.left = Math.random()*100+'%';
    p.style.animationDuration = (14+Math.random()*12)+'s';
    p.style.animationDelay = (Math.random()*12)+'s';
    p.style.opacity = 0.3+Math.random()*0.4;
    if(cfg.id==='nieve'){ const s=6+Math.random()*8; p.style.width=s+'px'; p.style.height=s+'px'; }
    if(cfg.id==='burbujas'){ const s=8+Math.random()*18; p.style.width=s+'px'; p.style.height=s+'px'; }
    if(cfg.emoji) p.textContent = cfg.emoji;
    wrap.appendChild(p);
  }
}
async function elegirEfectoClima(id){
  await guardarPersonalizacion({tipoParticula:id});
  aplicarParticulasElegidas();
  const cfgPanel = document.getElementById('configBody');
  if(cfgPanel && typeof renderConfig==='function') renderConfig();
}

/* ---------- Fondo vivo ---------- */
function calcularFranjaHorario(){
  const h = new Date().getHours();
  if(h>=6 && h<12) return 'manana';
  if(h>=12 && h<19) return 'tarde';
  return 'noche';
}
function aplicarFondoVivo(){
  const activo = (typeof PERSONALIZACION!=='undefined' && PERSONALIZACION.fondoVivo);
  if(!activo){ document.documentElement.removeAttribute('data-fondovivo'); return; }
  document.documentElement.setAttribute('data-fondovivo', calcularFranjaHorario());
}
async function toggleFondoVivo(btn){
  const nuevo = !(PERSONALIZACION && PERSONALIZACION.fondoVivo);
  btn.classList.toggle('on', nuevo);
  await guardarPersonalizacion({fondoVivo: nuevo});
  aplicarFondoVivo();
}
setInterval(aplicarFondoVivo, 10*60*1000);

/* ---------- Panel de configuración ---------- */
(function envolverConfigPersonalizacionClima(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof window.renderConfigPersonalizacion==='function'){
      clearInterval(t);
      const original = window.renderConfigPersonalizacion;
      window.renderConfigPersonalizacion = function(body){
        original(body);
        body.insertAdjacentHTML('beforeend', bloqueClimaYFondoVivo());
      };
    } else if(intentos>150){ clearInterval(t); }
  }, 800);
})();
function bloqueClimaYFondoVivo(){
  const tipoActual = (PERSONALIZACION && PERSONALIZACION.tipoParticula) || 'petalos';
  return `
    <div class="card">
      <h3>🌦️ Efecto de partículas</h3>
      <div class="av-options">
        ${EFECTOS_CLIMA.map(e=>`<div class="av-opt ${tipoActual===e.id?'active':''}" onclick="elegirEfectoClima('${e.id}')"><span class="ao-icon">${e.label.split(' ')[0]}</span><span>${e.label.split(' ').slice(1).join(' ')}</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3>🌅 Fondo vivo</h3>
      <p class="small muted">El fondo de la app cambia suavemente según la hora del día (mañana, tarde, noche).</p>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">🌅</div><div><label>Activar fondo vivo</label></div></div><button class="config-toggle ${(PERSONALIZACION&&PERSONALIZACION.fondoVivo)?'on':''}" onclick="toggleFondoVivo(this)"></button></div>
    </div>`;
}
(function aplicarClimaInicial(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof PERSONALIZACION!=='undefined' && PERSONALIZACION && SESSION && SESSION.coupleId){
      clearInterval(t);
      aplicarParticulasElegidas();
      aplicarFondoVivo();
    } else if(intentos>150){ clearInterval(t); }
  }, 1000);
})();
