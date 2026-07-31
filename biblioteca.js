/* ================= Navegación por categorías =================
   Este archivo NO cambia el funcionamiento de ninguna pestaña existente.
   Sólo agrega accesos rápidos ("chips") dentro de las pestañas que ahora
   funcionan como categoría principal, para llegar a las subcategorías
   que se reorganizaron (ver docs/REORGANIZACION.md). El Calendario no
   se toca en ningún punto de este archivo. */

function chipsCategoria(items){
  return `<div class="cat-chip-row" style="overflow-x:auto">${items.map(it=>{
    const accion = it.accion ? it.accion : `switchTab('${it.tab}')`;
    return `<button class="cat-chip" onclick="${accion}">${it.icon||''} ${esc(it.label)}</button>`;
  }).join('')}</div>`;
}

/* ---- Popover de subcategorías para la barra de escritorio ---- */
function cerrarPopovers(){
  const pop = document.getElementById('tabbarPopover');
  if(pop){ pop.classList.remove('abierto'); pop.innerHTML=''; }
}
function toggleCatPopover(ev, catId){
  ev.stopPropagation();
  const pop = document.getElementById('tabbarPopover');
  if(!pop) return;
  const yaAbiertoParaEsta = pop.classList.contains('abierto') && pop.dataset.cat===catId;
  cerrarPopovers();
  if(yaAbiertoParaEsta) return;
  const cat = (typeof CATEGORIAS_NAV!=='undefined' ? CATEGORIAS_NAV : []).find(c=>c.id===catId);
  if(!cat || !cat.subs) return;
  const ocultas = new Set((typeof PERSONALIZACION!=='undefined' && PERSONALIZACION.tabsOcultas) || []);
  const visibles = cat.subs.filter(s=>!s.tab || !ocultas.has(s.tab));
  pop.innerHTML = visibles.map(s=>`<button type="button" class="${s.tab===activeTab?'active':''}" onclick="${s.accion?s.accion+';cerrarPopovers();':`switchTab('${s.tab}');cerrarPopovers();`}">${s.ic||''} ${esc(s.label)}</button>`).join('');
  pop.dataset.cat = catId;
  const r = ev.currentTarget.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth-198)) + 'px';
  pop.style.bottom = (window.innerHeight - r.top + 8) + 'px';
  pop.classList.add('abierto');
}
document.addEventListener('click', (ev)=>{
  if(!ev.target.closest('.tabbar-cat-btn') && !ev.target.closest('#tabbarPopover')) cerrarPopovers();
});
window.addEventListener('resize', cerrarPopovers);

/* Envuelve una función de render existente para insertar los chips justo
   después de su primera tarjeta ".card", sin modificar el HTML original. */
function agregarChipsA(nombreFn, items){
  let intentos = 0;
  const t = setInterval(()=>{
    intentos++;
    if(typeof window[nombreFn] === 'function'){
      clearInterval(t);
      const original = window[nombreFn];
      window[nombreFn] = async function(...args){
        await original.apply(this, args);
        const main = document.getElementById('main');
        if(!main || main.querySelector('.chips-categoria')) return;
        const wrap = document.createElement('div');
        wrap.className = 'chips-categoria';
        wrap.style.marginBottom = '10px';
        wrap.innerHTML = chipsCategoria(items);
        main.insertBefore(wrap, main.firstChild);
      };
    } else if(intentos>150){ clearInterval(t); }
  }, 60);
}

agregarChipsA('renderNosotros', [
  {label:'Universo', icon:'🌌', tab:'universo'},
  {label:'Muro de momentos', icon:'💕', tab:'muro'},
  {label:'Nuestro perfil', icon:'💗', accion:'verPerfilPareja()'},
]);

agregarChipsA('renderCartas', [
  {label:'Postales', icon:'🎨', tab:'postalavanzada'},
]);

agregarChipsA('renderAlbum', [
  {label:'Multimedia', icon:'🎥', tab:'multimedia'},
  {label:'Biblioteca', icon:'📖', tab:'biblioteca'},
]);

agregarChipsA('renderMultimedia', [
  {label:'Película', icon:'🎞️', tab:'pelicula'},
]);

agregarChipsA('renderColecciones', [
  {label:'Recetas', icon:'🍳', tab:'recetario'},
]);

agregarChipsA('renderOrganizacion', [
  {label:'Planes', icon:'🍿', tab:'planificador'},
]);

agregarChipsA('renderExtras', [
  {label:'Notas', icon:'📝', tab:'notas'},
  {label:'Línea del tiempo', icon:'📈', tab:'lineatiempo'},
]);
