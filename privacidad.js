export default function Home() {
  return (
    <>
      {/* ======= Markup EXACTO del body original (index.html) ======= */}
      <div id="petals" />

      <div id="onboarding">
        <div className="ob-card" id="obCard" />
      </div>

      <div id="app" style={{ display: 'none' }}>
        <header className="top">
          <button
            className="icon-btn"
            id="hamburgerBtn"
            onClick={() => window.toggleMenuMovil && window.toggleMenuMovil()}
            title="Menú"
            aria-label="Abrir menú"
            style={{ display: 'none' }}
          >
            ☰
          </button>
          <div className="brand">
            <div className="mark" id="appMark">💗</div>
            <span>Notre petit monde</span>
          </div>
          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => window.abrirBusquedaGlobal && window.abrirBusquedaGlobal()}
              title="Buscar (o presiona /)"
            >
              🔎
            </button>
            <button
              className="icon-btn"
              onClick={() => window.verCodigo && window.verCodigo()}
              title="Código del hogar"
            >
              🔗
            </button>
            <span
              id="estadoParejaTag"
              className="small"
              style={{
                display: 'none',
                background: 'var(--superficie)',
                borderRadius: 12,
                padding: '4px 8px',
                whiteSpace: 'nowrap',
              }}
            />
            <button
              className="icon-btn"
              onClick={() => window.abrirSelectorEstado && window.abrirSelectorEstado()}
              title="Tu estado"
            >
              💭
            </button>
            <button
              className="icon-btn"
              id="suAvatarBtn"
              onClick={() => window.verPerfilPareja && window.verPerfilPareja()}
              title="Nuestro perfil (pareja)"
            >
              <span id="suAvatar">💗</span>
            </button>
            <button
              className="icon-btn"
              id="miAvatarBtn"
              onClick={() => window.verPerfil && window.verPerfil()}
              title="Perfil"
            >
              <span id="miAvatar">🐰</span>
            </button>
            <button
              className="icon-btn"
              onClick={() => window.cerrarSesion && window.cerrarSesion()}
              title="Cerrar sesión"
            >
              ↪
            </button>
          </div>
        </header>
        <main id="main" />
        <nav className="tabbar" id="tabbar" />
        <div className="tabbar-popover" id="tabbarPopover" />
        <div
          id="menuMovilOverlay"
          className="menu-movil-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && window.toggleMenuMovil) {
              window.toggleMenuMovil(false);
            }
          }}
        >
          <div className="menu-movil-panel" id="menuMovilPanel" />
        </div>
      </div>

      <div className="toast" id="toast" />
    </>
  );
}
