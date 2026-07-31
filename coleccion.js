/* ================= 📈 LÍNEA DEL TIEMPO (completa, con filtros) ================= */
let lineaTiempoAnio = 'todos';
let lineaTiempoBusqueda = '';
async function renderLineaTiempo(){
  const main = document.getElementById('main');
  const [{data:hitos}, {data:fotos}, {data:cartas}, {data:diario}] = await Promise.all([
    sb.from('calendario').select('*').eq('couple_id',SESSION.coupleId).eq('tipo','hito'),
    sb.from('album').select('id,img_url,texto,created_at').eq('couple_id',SESSION.coupleId).eq('favorito', true).eq('eliminado', false),
    sb.from('cartas').select('id,titulo,created_at').eq('couple_id',SESSION.coupleId).eq('importante', true).eq('eliminada', false),
    sb.from('diario').select('id,texto,created_at,tipo').eq('couple_id',SESSION.coupleId).eq('tipo','compartido'),
  ]);
  let eventos = [
    ...(hitos||[]).map(h=>({fecha:h.fecha, icono:h.icono_personalizado||h.icono||'💞', titulo:h.titulo, tipo:'Fecha importante'})),
    ...(fotos||[]).map(f=>({fecha:f.created_at.slice(0,10), icono:'🖼️', titulo:f.texto||'Una foto favorita', tipo:'Foto', img:f.img_url})),
    ...(cartas||[]).map(c=>({fecha:c.created_at.slice(0,10), icono:'💌', titulo:c.titulo||'Una carta importante', tipo:'Carta'})),
    ...(diario||[]).map(d=>({fecha:d.created_at.slice(0,10), icono:'📔', titulo:(d.texto||'').slice(0,80), tipo:'Nota de diario'})),
  ];
  const anios = [...new Set(eventos.map(e=>e.fecha.slice(0,4)))].sort((a,b)=>b-a);
  if(lineaTiempoAnio!=='todos') eventos = eventos.filter(e=>e.fecha.slice(0,4)===lineaTiempoAnio);
  if(lineaTiempoBusqueda) eventos = eventos.filter(e=>e.titulo.toLowerCase().includes(lineaTiempoBusqueda.toLowerCase()));
  eventos.sort((a,b)=> new Date(a.fecha)-new Date(b.fecha));

  main.innerHTML = `
    <div class="card">
      <h2>📈 Línea del tiempo</h2>
      <p class="muted small">Todo lo importante de su historia, en orden. Fechas manuales, fotos favoritas, cartas importantes y notas de diario compartido.</p>
      <div class="grid2">
        <div class="field"><label>Año</label>
          <select id="lineaAnioSel" onchange="lineaTiempoAnio=this.value;renderLineaTiempo()">
            <option value="todos">Todos</option>
            ${anios.map(a=>`<option value="${a}" ${lineaTiempoAnio===a?'selected':''}>${a}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Buscar</label><input id="lineaBuscarInput" value="${esc(lineaTiempoBusqueda)}" placeholder="Buscar evento..." oninput="lineaTiempoBusqueda=this.value;renderLineaTiempo()"></div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="switchTab('calendario')">+ Agregar fecha importante manualmente</button>
    </div>
    <div style="position:relative;padding-left:24px;margin-top:10px">
      <div style="position:absolute;left:9px;top:0;bottom:0;width:2px;background:var(--linea)"></div>
      ${eventos.length ? eventos.map(e=>`
        <div style="position:relative;margin-bottom:16px">
          <div style="position:absolute;left:-24px;top:2px;width:20px;height:20px;border-radius:50%;background:var(--superficie);border:2px solid var(--rosa-int);display:flex;align-items:center;justify-content:center;font-size:11px">${e.icono}</div>
          <div class="card" style="margin-left:4px">
            <div class="small muted">${new Date(e.fecha+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})} · ${e.tipo}</div>
            <b>${esc(e.titulo)}</b>
            ${e.img?`<img src="${e.img}" style="width:100%;border-radius:10px;margin-top:6px;max-height:160px;object-fit:cover">`:''}
          </div>
        </div>`).join('') : '<div class="empty small">No hay eventos con estos filtros.</div>'}
    </div>
  `;
}
