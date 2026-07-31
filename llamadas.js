/* ================= ESTADO PERSONALIZADO ================= */
const ESTADOS_PREDEF = [
  {id:'disponible', icon:'🟢', label:'Disponible'},
  {id:'ocupado', icon:'🔴', label:'Ocupado'},
  {id:'durmiendo', icon:'😴', label:'Durmiendo'},
  {id:'estudiando', icon:'📚', label:'Estudiando'},
  {id:'trabajando', icon:'💼', label:'Trabajando'},
];
async function abrirSelectorEstado(){
  const { data: mio } = await sb.from('profiles').select('estado').eq('user_id', SESSION.user.id).maybeSingle();
  const actual = (mio && mio.estado) || {};
  const existente = document.getElementById('estadoOverlay'); if(existente) existente.remove();
  const overlay = document.createElement('div');
  overlay.id = 'estadoOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(30,20,30,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--crema);border-radius:22px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;padding:20px;position:relative">
      <button onclick="document.getElementById('estadoOverlay').remove()" style="position:absolute;top:12px;right:12px;border:none;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:16px">✕</button>
      <h3>💭 Tu estado</h3>
      <div class="av-options">
        ${ESTADOS_PREDEF.map(e=>`<div class="av-opt ${actual.id===e.id?'active':''}" onclick="guardarEstadoPersonalizado('${e.id}','${e.icon}','${e.label}')"><span class="ao-icon">${e.icon}</span><span>${e.label}</span></div>`).join('')}
        <div class="av-opt ${!actual.id||actual.id==='ninguno'?'active':''}" onclick="guardarEstadoPersonalizado('ninguno','','Sin estado')"><span class="ao-icon">🚫</span><span>Sin estado</span></div>
      </div>
      <div class="field"><label>Estado personalizado</label>
        <div class="row" style="gap:8px">
          <input id="estadoCustomEmoji" maxlength="2" placeholder="✨" style="width:56px;text-align:center" value="${(actual.id==='personalizado'?actual.icon:'')||''}">
          <input id="estadoCustomTexto" placeholder="Escribe tu estado..." style="flex:1" value="${(actual.id==='personalizado'?actual.label:'')||''}">
        </div>
        <button class="btn btn-sm btn-gold btn-block" style="margin-top:8px" onclick="guardarEstadoCustom()">Guardar estado personalizado</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
async function guardarEstadoPersonalizado(id, icon, label){
  const estado = id==='ninguno' ? {} : {id, icon, label, at:Date.now()};
  await sb.from('profiles').update({estado, updated_at:new Date().toISOString()}).eq('user_id', SESSION.user.id);
  const o = document.getElementById('estadoOverlay'); if(o) o.remove();
  toast('Estado actualizado 💭');
  pintarEstadoHeader();
}
async function guardarEstadoCustom(){
  const icon = document.getElementById('estadoCustomEmoji').value.trim() || '✨';
  const label = document.getElementById('estadoCustomTexto').value.trim();
  if(!label){ toast('Escribe un texto para tu estado'); return; }
  await guardarEstadoPersonalizado('personalizado', icon, label);
}
async function pintarEstadoHeader(){
  try{
    const { data: pareja } = await sb.from('profiles').select('estado').eq('couple_id', SESSION.coupleId).eq('slot', otroSlot()).maybeSingle();
    const el = document.getElementById('estadoParejaTag');
    if(!el) return;
    const est = pareja && pareja.estado;
    if(est && est.label){ el.style.display='inline-flex'; el.innerHTML = `${est.icon||''} ${esc(est.label)}`; }
    else { el.style.display='none'; }
  }catch(e){ /* silencioso */ }
}
(function pollEstadoInicial(){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof SESSION!=='undefined' && SESSION && SESSION.coupleId){ clearInterval(t); pintarEstadoHeader(); }
    else if(intentos>120){ clearInterval(t); }
  }, 1000);
})();
