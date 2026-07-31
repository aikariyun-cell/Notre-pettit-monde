/* ================= REGISTRO DE NUEVAS PESTAÑAS ================= */
/* Añade las pestañas nuevas del checklist sin modificar el router original. */
(function registrarNuevasPestanas(){
  const nuevas = [
    {id:'organizacion', ic:'🗂️', label:'Organización'},
    {id:'coleccion', ic:'💕', label:'Colecciones'},
    {id:'multimedia', ic:'🎥', label:'Multimedia'},
    {id:'decoracion', ic:'🎨', label:'Decoración'},
    {id:'notas', ic:'📝', label:'Notas'},
    {id:'emociones', ic:'🎭', label:'Emociones'},
    {id:'biblioteca', ic:'📖', label:'Biblioteca'},
    {id:'muro', ic:'💕', label:'Muro'},
    {id:'universo', ic:'🌌', label:'Universo'},
    {id:'parejaplus', ic:'🎯', label:'Elecciones'},
    {id:'planificador', ic:'🍿', label:'Planes'},
    {id:'recetario', ic:'📖', label:'Recetas'},
    {id:'lineatiempo', ic:'📈', label:'Línea del tiempo'},
    {id:'pelicula', ic:'🎞️', label:'Película'},
    {id:'postalavanzada', ic:'🎨', label:'Postales+'},
  ];
  const idxConfig = TABS.findIndex(t=>t.id==='config');
  const idxInsercion = idxConfig>=0 ? idxConfig : TABS.length;
  TABS.splice(idxInsercion, 0, ...nuevas);

  const NUEVOS_HANDLERS = {
    organizacion: renderOrganizacion,
    coleccion: renderColecciones,
    multimedia: renderMultimedia,
    decoracion: renderPersonalizacionVisual,
    notas: renderNotas,
    emociones: renderEmociones,
    biblioteca: renderBiblioteca,
    muro: renderMuro,
    universo: renderUniverso,
    parejaplus: renderPareja,
    planificador: renderPlanificador,
    recetario: renderRecetario,
    lineatiempo: renderLineaTiempo,
    pelicula: renderPelicula,
    postalavanzada: renderConstructorPostales,
  };
  const renderOriginal = render;
  render = function(){
    if(NUEVOS_HANDLERS[activeTab]) return NUEVOS_HANDLERS[activeTab]();
    return renderOriginal();
  };
})();
