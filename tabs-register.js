:root{
  --rosa:#f6cfe0;
  --rosa-int:#eeb1cd;
  --lila:#dcd0f2;
  --lila-int:#c3aef0;
  --cielo:#c9e6f2;
  --dorado:#d9a655;
  --dorado-suave:#f0dbb0;
  --crema:#fffaf6;
  --tinta:#4a3550;
  --tinta-suave:#8a7690;
  --linea:rgba(74,53,80,0.12);
  --superficie:#ffffff;
  --superficie-2:rgba(255,255,255,0.68);
  --superficie-borde:rgba(255,255,255,0.7);
  --ok:#8fbf9f;
  --radio:22px;
  --radio-sm:14px;
  --sombra:0 10px 30px -12px rgba(120,70,110,0.28);
}
html[data-oscuro="1"]{
  --rosa:rgba(238,177,205,0.22);
  --rosa-int:#e58fb3;
  --lila:rgba(195,174,240,0.22);
  --lila-int:#af92ee;
  --cielo:rgba(150,200,225,0.22);
  --dorado:#e3b45f;
  --dorado-suave:rgba(224,166,63,0.28);
  --crema:#1a1420;
  --tinta:#f3e9f6;
  --tinta-suave:#c9b7d3;
  --linea:rgba(255,255,255,0.14);
  --superficie:rgba(255,255,255,0.07);
  --superficie-2:rgba(255,255,255,0.05);
  --superficie-borde:rgba(255,255,255,0.1);
  --ok:#7fce97;
  --sombra:0 10px 30px -12px rgba(0,0,0,0.55);
}
html[data-oscuro="1"] body{
  background:
    radial-gradient(circle at 15% 8%, color-mix(in srgb, var(--rosa-int) 16%, transparent) 0%, transparent 45%),
    radial-gradient(circle at 85% 5%, color-mix(in srgb, var(--lila-int) 16%, transparent) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--cielo) 16%, transparent) 0%, transparent 45%),
    linear-gradient(180deg, var(--crema) 0%, color-mix(in srgb, var(--crema) 88%, black) 100%);
}
html[data-oscuro="1"] header.top{background:rgba(20,15,25,0.85);}
html[data-oscuro="1"] nav.tabbar{background:rgba(20,15,25,0.92);}
html[data-oscuro="1"] .hero{background:linear-gradient(135deg, rgba(238,177,205,0.14), rgba(195,174,240,0.14));}
html[data-oscuro="1"] .emergency-banner{background:linear-gradient(135deg,rgba(255,120,140,0.18),rgba(255,140,160,0.14));border:1px solid rgba(255,150,170,0.3);color:#ffd7de;}
html[data-oscuro="1"] .petal{opacity:0.25;}
html[data-oscuro="1"] ::selection{background:var(--rosa-int);color:#1a1420;}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{margin:0;padding:0;}
body{
  font-family:'Quicksand',sans-serif;
  color:var(--tinta);
  background:
    radial-gradient(circle at 15% 8%, color-mix(in srgb, var(--rosa-int) 30%, transparent) 0%, transparent 45%),
    radial-gradient(circle at 85% 5%, color-mix(in srgb, var(--lila-int) 28%, transparent) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--cielo) 40%, transparent) 0%, transparent 45%),
    linear-gradient(180deg, var(--crema) 0%, var(--crema) 100%);
  min-height:100vh;
  min-height:100dvh;
  transition:background .3s ease;
  overflow-x:hidden;
}
h1,h2,h3,.display{font-family:'Fraunces',serif;font-weight:600;letter-spacing:.2px;}
.script{font-family:'Cormorant Garamond',serif;font-style:italic;}
button{font-family:inherit;cursor:pointer;}
input,textarea,select{font-family:inherit;background:var(--superficie);color:var(--tinta);border:1.5px solid var(--linea);border-radius:12px;padding:9px 11px;}
/* Los navegadores dibujan la lista desplegable de <select> con fondo blanco propio del
   sistema operativo, ignorando el fondo oscuro/translúcido de --superficie. Si no fijamos
   un color de texto oscuro para las <option>, heredan --tinta (casi blanco en modo oscuro)
   y quedan casi ilegibles sobre ese fondo blanco. Fijamos colores explícitos y estables. */
select option{color:#2a2030;background:#fffaf6;}
input::placeholder,textarea::placeholder{color:var(--tinta-suave);opacity:.85;}
input[type="checkbox"],input[type="radio"],input[type="range"],input[type="color"],input[type="file"]{background:none;border:none;padding:0;}
::selection{background:var(--rosa-int);color:#fff;}
a{color:inherit;}

/* petals ambient */
#petals{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
.petal{position:absolute;top:-5%;width:10px;height:10px;border-radius:50% 0 50% 50%;background:linear-gradient(135deg,var(--rosa-int),var(--dorado-suave));opacity:.55;animation:fall linear infinite;}
@keyframes fall{to{transform:translateY(115vh) rotate(300deg);}}
@media (prefers-reduced-motion:reduce){.petal{display:none;}*{animation-duration:0.001s !important;}}

/* ---- onboarding ---- */
#onboarding{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;z-index:1;}
.ob-card{background:rgba(255,255,255,0.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.6);border-radius:28px;box-shadow:var(--sombra);padding:36px 30px;max-width:420px;width:100%;text-align:center;}
.ob-seal{width:56px;height:56px;margin:0 auto 14px;border-radius:50%;background:radial-gradient(circle at 35% 30%, var(--dorado-suave), var(--dorado));display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 6px 16px -4px rgba(217,166,85,.6);}
.ob-card h1{font-size:28px;margin:0 0 4px;}
.ob-sub{color:var(--tinta-suave);font-size:14px;margin-bottom:22px;}
.field{text-align:left;margin-bottom:14px;}
.field label{display:block;font-size:12.5px;font-weight:700;color:var(--tinta-suave);margin-bottom:5px;letter-spacing:.3px;text-transform:uppercase;}
.field input,.field textarea,.field select{width:100%;padding:11px 14px;border-radius:14px;border:1.5px solid var(--linea);background:var(--superficie);font-size:15px;color:var(--tinta);outline:none;transition:border .15s;}
.field input:focus,.field textarea:focus,.field select:focus{border-color:var(--rosa-int);}
.btn{border:none;border-radius:16px;padding:13px 20px;font-weight:700;font-size:14.5px;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s, box-shadow .12s;}
.btn:active{transform:scale(.96);}
.btn-primary{background:linear-gradient(135deg,var(--rosa-int),var(--lila-int));color:#fff;box-shadow:0 8px 20px -8px rgba(180,110,180,.6);width:100%;}
.btn-gold{background:linear-gradient(135deg,var(--dorado-suave),var(--dorado));color:#5a3f18;box-shadow:0 8px 18px -8px rgba(217,166,85,.5);}
.btn-ghost{background:rgba(74,53,80,0.06);color:var(--tinta);}
.btn-outline{background:transparent;border:1.5px solid var(--linea);color:var(--tinta);}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:12px;}
.btn-block{width:100%;}
.ob-toggle{display:flex;gap:8px;margin-bottom:18px;background:rgba(74,53,80,0.06);padding:4px;border-radius:14px;}
.ob-toggle button{flex:1;border:none;background:transparent;padding:9px;border-radius:11px;font-weight:700;font-size:13.5px;color:var(--tinta-suave);}
.ob-toggle button.active{background:var(--superficie);color:var(--tinta);box-shadow:0 3px 10px -4px rgba(0,0,0,.15);}
.hint{font-size:12px;color:var(--tinta-suave);margin-top:10px;line-height:1.5;}
.code-badge{font-family:'Fraunces',serif;letter-spacing:3px;font-size:22px;background:var(--superficie);border:1.5px dashed var(--dorado);border-radius:14px;padding:10px;margin:10px 0;color:var(--dorado);}

/* ---- app shell ---- */
#app{display:none;min-height:100vh;min-height:100dvh;position:relative;z-index:1;padding-bottom:88px;}
header.top{position:sticky;top:0;z-index:5;background:rgba(255,250,246,0.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--linea);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;}
.brand{display:flex;align-items:center;gap:9px;min-width:0;overflow:hidden;}
.brand span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.brand .mark{width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--dorado-suave),var(--dorado));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.brand span{font-family:'Fraunces',serif;font-weight:600;font-size:17px;}
.top-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;}
#hamburgerBtn{flex-shrink:0;background:linear-gradient(135deg,var(--rosa-int),var(--lila-int));border:none;color:#fff;font-size:18px;box-shadow:0 3px 10px -3px rgba(120,70,110,0.45);}
.icon-btn{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--linea);background:var(--superficie);display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden;padding:0;}
.icon-btn img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.avatar-preview{width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 6px 16px -6px rgba(120,70,110,.4);}
.avatar-preview-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:6px;}
.avatar-emoji-preview{width:84px;height:84px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;background:linear-gradient(135deg,var(--rosa),var(--lila));border:3px solid #fff;box-shadow:0 6px 16px -6px rgba(120,70,110,.4);}

main{max-width:640px;margin:0 auto;padding:18px 16px 10px;}
.card{background:var(--superficie-2);backdrop-filter:blur(14px);border:1px solid var(--superficie-borde);border-radius:var(--radio);padding:20px;margin-bottom:16px;box-shadow:var(--sombra);}
.card h2{margin:0 0 12px;font-size:18px;}
.card h3{margin:0 0 8px;font-size:15px;}
.muted{color:var(--tinta-suave);font-size:13.5px;}
.row{display:flex;gap:10px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.chip{display:inline-flex;align-items:center;gap:6px;background:rgba(220,208,242,0.45);border:1px solid rgba(74,53,80,0.1);padding:6px 12px;border-radius:99px;font-size:13px;margin:3px 4px 3px 0;}
.chip button{border:none;background:none;color:var(--tinta-suave);font-size:12px;cursor:pointer;}
.tag-del{cursor:pointer;opacity:.6;}

/* home */
.hero{background:linear-gradient(135deg, rgba(246,207,224,0.55), rgba(220,208,242,0.55));border-radius:var(--radio);padding:26px 22px;margin-bottom:16px;position:relative;overflow:hidden;border:1px solid var(--superficie-borde);}
.hero .greet{font-size:22px;margin:0 0 2px;}
.hero .time{font-size:13px;color:var(--tinta-suave);}
.hero .days{margin-top:16px;display:flex;align-items:baseline;gap:8px;}
.hero .days b{font-family:'Fraunces',serif;font-size:34px;}
.hero .quote{margin-top:14px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:17px;line-height:1.4;}
.stat-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;margin:14px 0;}
.stat-box{flex:0 0 auto;background:var(--superficie);border-radius:14px;padding:10px 14px;text-align:center;min-width:78px;border:1px solid var(--linea);}
.badges-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px;margin-top:12px;}
.badge-item{position:relative;background:var(--superficie);border:1px solid var(--linea);border-radius:16px;padding:12px 6px;text-align:center;}
.badge-item.locked{opacity:.4;filter:grayscale(1);}
.badge-item.unlocked{box-shadow:0 2px 10px rgba(217,166,85,.25);border-color:var(--dorado);}
.badge-ic{font-size:26px;}
.badge-nombre{font-size:11px;font-weight:700;margin-top:4px;line-height:1.2;}
.badge-check{position:absolute;top:4px;right:6px;color:var(--ok);font-weight:900;font-size:13px;}
.badge-lock{position:absolute;top:4px;right:6px;font-size:11px;}
.msg-ticks{opacity:.55;font-size:11px;}
.msg-ticks.entregado{opacity:.75;}
.msg-ticks.leido{opacity:1;color:var(--cielo,#5aa7c7);}
.stat-box b{display:block;font-family:'Fraunces',serif;font-size:18px;}
.stat-box span{font-size:11px;color:var(--tinta-suave);}
.emergency-banner{background:linear-gradient(135deg,#ffd9dc,#ffc8d8);border:1px solid #ffb3c0;border-radius:16px;padding:14px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;}
.mood-row{display:flex;gap:8px;flex-wrap:wrap;}
.mood-btn{border:1.5px solid var(--linea);background:var(--superficie);border-radius:14px;padding:9px 12px;font-size:20px;}
.mood-btn.active{border-color:var(--dorado);background:var(--dorado-suave);}

/* tabs nav */
nav.tabbar{position:fixed;bottom:0;left:0;right:0;z-index:6;background:rgba(255,250,246,0.92);backdrop-filter:blur(16px);border-top:1px solid var(--linea);display:flex;overflow-x:auto;padding:6px 4px;}
nav.tabbar button{flex:1;min-width:64px;border:none;background:none;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 4px;color:var(--tinta-suave);font-size:10.5px;font-weight:700;border-radius:12px;}
nav.tabbar button .ic{font-size:19px;}
nav.tabbar button.active{color:var(--tinta);background:rgba(220,208,242,0.4);}

/* section switching */
.section{display:none;}
.section.active{display:block;animation:rise .35s ease;}
@keyframes rise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}

/* sub-tabs (P1/P2 style) */
.subtabs{display:flex;gap:6px;background:var(--linea);padding:4px;border-radius:13px;margin-bottom:14px;}
.subtabs button{flex:1;border:none;background:transparent;padding:8px;border-radius:10px;font-weight:700;font-size:13px;color:var(--tinta-suave);}
.subtabs button.active{background:var(--superficie);color:var(--tinta);}

/* accordion */
.acc{border:1px solid var(--linea);border-radius:14px;margin-bottom:8px;overflow:hidden;background:var(--superficie);}
.acc-h{padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:14px;}
.acc-b{padding:0 14px 14px;display:none;}
.acc.open .acc-b{display:block;}
.acc.open .acc-h .chev{transform:rotate(90deg);}
.chev{transition:transform .2s;color:var(--tinta-suave);}
.fav-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.fav-grid .field{margin-bottom:0;}
.fav-grid label{font-size:11px;}
.priv-medal{width:26px;height:26px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;font-size:13px;background:#f6cfe0;color:#8a4a63;}
.priv-medal.shared{background:#c9e6f2;color:#2d6a85;}

/* items lists */
.item-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed var(--linea);}
.item-row:last-child{border-bottom:none;}

/* letters */
.letter-card{position:relative;background:linear-gradient(160deg,#fff,#fdf2f6);border:1px solid var(--linea);border-radius:16px;padding:16px;margin-bottom:12px;color:#4a3550;}
.letter-card .muted,.letter-card .small{color:#8a7690;}
.letter-card.locked{background:linear-gradient(160deg,#f1ecf9,#e9e0f7);}
.letter-title{font-family:'Fraunces',serif;font-size:16px;margin:0 0 4px;}
.envelope{display:inline-block;font-size:22px;}
@keyframes sobreAbrir{0%{transform:scale(.9) rotate(-2deg);opacity:.4}60%{transform:scale(1.02) rotate(1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes confetiCae{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(360deg);opacity:.2}}
.letter-card.envelope-open{animation:sobreAbrir .45s ease-out;}

/* canvas */
.canvas-wrap{background:var(--superficie);border-radius:16px;border:1px solid var(--linea);overflow:hidden;touch-action:none;}
canvas{display:block;width:100%;touch-action:none;}
.tool-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0;}
.swatch{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px var(--linea);}
.swatch.active{box-shadow:0 0 0 2px var(--tinta);}

/* album grid */
.album-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.album-grid .a-item{position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1/1;background:#eee;border:1px solid var(--linea);}
.album-grid img{width:100%;height:100%;object-fit:cover;display:block;}
.album-grid .a-cap{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(0deg,rgba(0,0,0,.55),transparent);color:#fff;font-size:10px;padding:5px 6px;}

/* calendar */
.cal-item{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px dashed var(--linea);}
.cal-date{width:46px;text-align:center;flex:none;}
.cal-date b{display:block;font-family:'Fraunces',serif;font-size:18px;}
.cal-date span{font-size:10px;color:var(--tinta-suave);text-transform:uppercase;}
.status-dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:5px;}

/* pet */
.pet-stage{background:radial-gradient(circle at 50% 30%, #fff, #f7ecf5);border-radius:20px;padding:26px;text-align:center;border:1px solid var(--linea);}
.pet-face{font-size:64px;}
.pet-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
.bar{background:#eee0e9;border-radius:99px;height:8px;overflow:hidden;margin-top:4px;}
.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--rosa-int),var(--dorado));}
.pet-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}
.pet-home{display:grid;gap:10px;}
.pet-home-card{display:flex;gap:10px;align-items:center;padding:12px;border-radius:16px;background:linear-gradient(135deg,rgba(246,207,224,.45),rgba(220,208,242,.4));border:1px solid var(--linea);}
.pet-home-emoji{font-size:30px;}
.pet-home-title{font-weight:700;font-size:14px;}
.pet-home-meta{font-size:11.5px;color:var(--tinta-suave);margin-top:2px;}
.pet-hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.pet-hud-item{background:var(--superficie);border:1px solid var(--linea);border-radius:12px;padding:8px;text-align:center;}
.pet-hud-item b{display:block;font-size:15px;font-family:'Fraunces',serif;}
.pet-hud-item small{color:var(--tinta-suave);font-size:10px;}
.pet-section-title{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--tinta-suave);margin:12px 0 8px;}
.pet-chip-row{display:flex;flex-wrap:wrap;gap:8px;}
.pet-chip-row .chip{margin:0;}
.pet-pill-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.pet-pill{background:var(--superficie);border:1px solid var(--linea);border-radius:12px;padding:9px 7px;text-align:center;font-size:11px;font-weight:700;}
.pet-pill .emoji{display:block;font-size:18px;margin-bottom:3px;}
.pet-mini-list{display:grid;gap:8px;}
.pet-mini-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:12px;border:1px solid var(--linea);background:var(--superficie);font-size:13px;}
.pet-mini-item span{color:var(--tinta-suave);font-size:11px;}

/* chat */
.chat-scroll{max-height:52vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px;}
.msg{max-width:80%;padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.4;position:relative;}
.msg.me{align-self:flex-end;background:linear-gradient(135deg,var(--rosa-int),var(--lila-int));color:#fff;border-bottom-right-radius:5px;}
.msg.them{align-self:flex-start;background:var(--superficie);border:1px solid var(--linea);border-bottom-left-radius:5px;}
.msg .t{display:block;font-size:9.5px;opacity:.7;margin-top:3px;}
.msg.eliminado{opacity:.6;font-style:italic;}
.msg-actions{display:flex;gap:5px;position:absolute;top:-26px;background:var(--superficie);border:1px solid var(--linea);border-radius:99px;padding:3px 7px;box-shadow:var(--sombra);font-size:14px;opacity:0;pointer-events:none;transition:opacity .15s;z-index:10;}
.msg.me .msg-actions{right:0;}
.msg.them .msg-actions{left:0;}
.msg.actions-open .msg-actions{opacity:1;pointer-events:auto;}
.msg-actions span{cursor:pointer;}
.msg-media{max-width:220px;max-height:260px;border-radius:12px;margin-bottom:4px;display:block;object-fit:cover;}
.msg-audio{width:190px;}
.msg-file{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.5);border-radius:10px;padding:8px 10px;font-size:12.5px;text-decoration:none;color:inherit;}
.msg.me .msg-file{background:rgba(255,255,255,.25);}
.msg-reaction{display:inline-flex;align-items:center;gap:2px;font-size:12px;background:rgba(255,255,255,.55);border-radius:99px;padding:2px 6px;margin:4px 3px 0 0;}
.msg.them .msg-reaction{background:var(--rosa);}
.msg .replied{font-size:11px;border-left:3px solid rgba(255,255,255,.6);padding:4px 7px;margin-bottom:5px;opacity:.85;background:rgba(0,0,0,.08);border-radius:4px;}
.msg.them .replied{border-color:var(--rosa-int);}
.temp-badge{font-size:9px;opacity:.7;margin-left:4px;}
.chat-input{display:flex;gap:8px;margin-top:10px;align-items:flex-end;}
.chat-input input{flex:1;}
.chat-media-bar{display:flex;gap:8px;margin-top:6px;overflow-x:auto;padding-bottom:4px;}
.chat-media-btn{border:1.5px solid var(--linea);background:var(--superficie);border-radius:12px;padding:7px 12px;font-size:12.5px;font-weight:700;flex:none;white-space:nowrap;}
.chat-media-btn.active{border-color:var(--rosa-int);background:rgba(238,177,205,.15);}
.emoji-picker{background:var(--superficie);border:1px solid var(--linea);border-radius:16px;padding:12px;margin-bottom:8px;box-shadow:var(--sombra);}
.emoji-picker-cats{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;padding-bottom:4px;}
.emoji-cat-btn{border:1.5px solid var(--linea);background:var(--superficie);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;flex:none;}
.emoji-cat-btn.active{border-color:var(--rosa-int);background:rgba(238,177,205,.2);}
.emoji-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;max-height:170px;overflow-y:auto;}
.emoji-item{text-align:center;padding:6px 2px;font-size:20px;cursor:pointer;border-radius:8px;transition:background .1s;}
.emoji-item:hover{background:var(--rosa);}
.emoji-item .ei-label{font-size:8px;color:var(--tinta-suave);display:block;margin-top:2px;line-height:1.1;}
.sticker-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-height:180px;overflow-y:auto;}
.sticker-item{font-size:28px;text-align:center;cursor:pointer;padding:6px;border-radius:10px;transition:background .1s;}
.sticker-item:hover{background:var(--rosa);}
.gif-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:200px;overflow-y:auto;}
.gif-item{text-align:center;font-size:15px;font-weight:700;cursor:pointer;padding:14px 4px;border-radius:12px;background:linear-gradient(135deg,var(--rosa),var(--lila));border:1.5px solid var(--linea);}
.chat-bg-selector{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px;}
.chat-bg-opt{height:44px;border-radius:10px;border:2px solid transparent;cursor:pointer;}
.chat-bg-opt.active{border-color:var(--dorado);}
.chat-reply-bar{background:rgba(220,208,242,.35);border-radius:10px;padding:8px 12px;margin-bottom:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.search-bar{display:flex;gap:8px;margin-bottom:10px;}
.search-bar input{flex:1;}
.schedule-form{background:rgba(220,208,242,.2);border-radius:14px;padding:12px;margin-top:8px;}
.scheduled-item{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed var(--linea);font-size:13px;}
.scheduled-item:last-child{border-bottom:none;}

/* emojis gallery */
.emoji-gallery{padding:0;}
.eg-section{margin-bottom:20px;}
.eg-section-title{font-size:13px;font-weight:700;color:var(--tinta-suave);letter-spacing:.6px;text-transform:uppercase;margin:0 0 10px;display:flex;align-items:center;gap:8px;}
.eg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.eg-card{background:var(--superficie);border:1px solid var(--linea);border-radius:14px;padding:12px 8px;text-align:center;cursor:pointer;transition:transform .12s, border-color .12s;}
.eg-card:active{transform:scale(.94);}
.eg-card:hover{border-color:var(--rosa-int);}
.eg-card .ec-emoji{font-size:28px;display:block;margin-bottom:4px;}
.eg-card .ec-label{font-size:11px;color:var(--tinta-suave);line-height:1.2;}
.eg-badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#f6cfe0;color:#8a4a63;margin-left:6px;}

/* avatar studio */
.av-preview-wrap{text-align:center;padding:20px;background:radial-gradient(circle at 50% 30%,var(--rosa),var(--lila));border-radius:20px;}
.av-big{width:120px;height:120px;border-radius:50%;font-size:56px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--rosa),var(--lila));margin:0 auto;border:4px solid #fff;box-shadow:0 8px 24px -8px rgba(120,70,110,.4);position:relative;}
.av-chibi-frame{width:180px;height:200px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--rosa),var(--lila));margin:0 auto;border-radius:24px;border:4px solid #fff;box-shadow:0 8px 24px -8px rgba(120,70,110,.4);padding:8px;}
.av-chibi-mini{width:78px;height:88px;display:flex;align-items:flex-end;justify-content:center;margin:0 auto;overflow:hidden;}
.chibi-icon-mini{display:inline-flex;width:100%;height:100%;overflow:hidden;border-radius:50%;}
.chibi-icon-mini svg{transform:scale(1.6) translateY(6%);}
.av-layer-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:10px;}
.av-layer-btn{border:1.5px solid var(--linea);background:var(--superficie);border-radius:12px;padding:8px 14px;font-size:12px;font-weight:700;flex:none;}
.av-layer-btn.active{border-color:var(--dorado);background:var(--dorado-suave);}
.av-options{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.av-opt{border:1.5px solid var(--linea);background:var(--superficie);border-radius:12px;padding:10px 6px;text-align:center;font-size:11px;cursor:pointer;}
.av-opt.active{border-color:var(--dorado);background:var(--dorado-suave);}
.av-opt .ao-icon{font-size:22px;display:block;margin-bottom:3px;}
.av-color-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}
.av-color-dot{width:32px;height:32px;border-radius:50%;border:3px solid transparent;cursor:pointer;}
.av-color-dot.active{border-color:var(--tinta);}

/* config / settings */
.config-list{display:grid;gap:8px;}
.config-item{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;border-radius:16px;background:var(--superficie);border:1px solid var(--linea);gap:10px;flex-wrap:wrap;}
.config-item-info{display:flex;align-items:center;gap:12px;}
.config-item-icon{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none;}
.config-item-icon.pink{background:rgba(246,207,224,.6);}
.config-item-icon.lila{background:rgba(220,208,242,.6);}
.config-item-icon.blue{background:rgba(201,230,242,.6);}
.config-item-icon.gold{background:rgba(240,219,176,.6);}
.config-item-icon.red{background:rgba(255,205,210,.6);}
.config-item-icon.green{background:rgba(143,191,159,.25);}
.config-item label{font-weight:700;font-size:14px;}
.config-item .sub{font-size:11.5px;color:var(--tinta-suave);}
.config-toggle{width:46px;height:26px;border-radius:99px;background:var(--linea);border:none;position:relative;transition:background .2s;flex:none;}
.config-toggle.on{background:var(--rosa-int);}
.config-toggle::after{content:'';position:absolute;width:20px;height:20px;background:#fff;border-radius:50%;top:3px;left:3px;transition:left .2s;box-shadow:0 2px 6px rgba(0,0,0,.2);}
.config-toggle.on::after{left:23px;}
.manual-section{margin-bottom:16px;}
.manual-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px dashed var(--linea);}
.manual-item:last-child{border-bottom:none;}
.manual-icon{font-size:22px;flex:none;}
.manual-title{font-weight:700;font-size:14px;margin-bottom:2px;}
.manual-desc{font-size:12.5px;color:var(--tinta-suave);line-height:1.5;}
.manual-item{flex-direction:column;}
.manual-item-head{display:flex;gap:12px;align-items:flex-start;}
.manual-subs{list-style:none;margin:8px 0 0 34px;padding:0;display:flex;flex-direction:column;gap:6px;}
.manual-subs li{font-size:12px;color:var(--tinta-suave);line-height:1.5;}
.manual-subs b{color:var(--tinta);font-weight:700;}
.pasos-bloque{margin:8px 0 0 34px;}
.pasos-subtitulo{font-size:12.5px;font-weight:700;color:var(--tinta);margin:10px 0 4px;}
.pasos-subtitulo:first-child{margin-top:0;}
.pasos-lista{margin:0 0 4px;padding-left:18px;display:flex;flex-direction:column;gap:4px;}
.pasos-lista li{font-size:12.5px;color:var(--tinta-suave);line-height:1.5;}
.manual-inline summary{outline:none;}
.manual-inline summary::-webkit-details-marker{display:none;}
.manual-inline summary::before{content:'▸';display:inline-block;margin-right:6px;transition:transform .15s;}
.manual-inline[open] summary::before{transform:rotate(90deg);}
.manual-inline .card{margin-top:8px;margin-bottom:0;text-align:left;}
.legal-block{background:var(--superficie);border:1px solid var(--linea);border-radius:16px;padding:16px;margin-bottom:12px;}
.legal-title{font-family:'Fraunces',serif;font-size:16px;margin:0 0 8px;}
.legal-body{font-size:13px;color:var(--tinta-suave);line-height:1.6;}
.legal-body ul{margin:8px 0;padding-left:18px;}
.legal-body li{margin-bottom:4px;}
.danger-zone{border:1.5px solid rgba(239,154,154,.5);border-radius:16px;padding:16px;background:rgba(255,235,238,.4);}
.danger-zone h3{color:#c62828;margin:0 0 10px;}

.empty{text-align:center;padding:26px 10px;color:var(--tinta-suave);}
.empty .ic{font-size:30px;display:block;margin-bottom:8px;}
textarea{resize:vertical;min-height:70px;}
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#3a2942;color:#fff;padding:10px 18px;border-radius:99px;font-size:13px;z-index:50;opacity:0;pointer-events:none;transition:opacity .25s, transform .25s;box-shadow:0 8px 24px -8px rgba(0,0,0,.5);}
.toast.show{opacity:1;transform:translateX(-50%) translateY(-6px);}
.avatar-pick{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-height:180px;overflow-y:auto;}
.avatar-pick button{border:2px solid transparent;background:var(--superficie);border-radius:12px;font-size:20px;padding:6px 0;}
.avatar-pick button.active{border-color:var(--dorado);}
.section-title{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--tinta-suave);font-weight:700;margin:18px 0 8px;}
.small{font-size:12px;}

.error-text{color:#c0527a;font-size:12.5px;margin-top:8px;text-align:left;}
.ob-link{background:none;border:none;color:var(--tinta-suave);font-size:12.5px;text-decoration:underline;cursor:pointer;margin-top:14px;}
.spinner{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.divider{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--tinta-suave);font-size:12px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--linea);}
.pet-visual{width:120px;height:120px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:56px;position:relative;box-shadow:0 10px 26px -12px rgba(120,70,110,.4);}
.aura-ring{position:absolute;inset:-7px;border-radius:50%;border:2px dashed rgba(255,255,255,.75);animation:auraspin 7s linear infinite;}
@keyframes auraspin{to{transform:rotate(360deg);}}
.rarity-badge{display:inline-block;padding:3px 11px;border-radius:99px;font-size:10.5px;font-weight:700;color:#fff;letter-spacing:.3px;}
.xp-bar-wrap{margin-top:14px;text-align:left;}
.xp-bar-wrap .lbl{display:flex;justify-content:space-between;font-size:11px;color:var(--tinta-suave);margin-bottom:3px;}
.species-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.species-card{border:1.5px solid var(--linea);border-radius:14px;padding:12px 8px;text-align:center;background:var(--superficie);cursor:pointer;}
.species-card.selected{border-color:var(--dorado);background:var(--dorado-suave);}
.species-card .sp-emoji{font-size:30px;display:block;margin-bottom:4px;}
.species-card .sp-name{font-weight:700;font-size:12.5px;}
.cat-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
.cat-chip{border:1.5px solid var(--linea);background:var(--superficie);border-radius:99px;padding:8px 14px;font-size:13px;font-weight:700;color:var(--tinta);white-space:nowrap;transition:background .15s ease,border-color .15s ease;}
.cat-chip:hover{border-color:var(--rosa-int);background:color-mix(in srgb, var(--rosa-int) 12%, var(--superficie));}
.cat-chip.active{background:linear-gradient(135deg,var(--rosa-int),var(--lila-int));color:#fff;border-color:transparent;}
html[data-oscuro="1"] .cat-chip{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.24);}
html[data-oscuro="1"] .cat-chip:hover{background:rgba(255,255,255,0.15);}
.act-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.act-btn{border:1.5px solid var(--linea);background:var(--superficie);border-radius:12px;padding:9px 4px;font-size:10.5px;text-align:center;line-height:1.3;}
.act-btn .ae{font-size:19px;display:block;margin-bottom:2px;}
.item-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.item-card{border:1.5px solid var(--linea);border-radius:12px;padding:10px 6px;text-align:center;background:var(--superficie);font-size:11px;position:relative;}
.item-card.equipped{border-color:var(--dorado);background:var(--dorado-suave);}
.item-card.locked{opacity:.45;}
.item-card .lock{position:absolute;top:4px;right:6px;font-size:11px;}
.ability-box{background:rgba(240,219,176,.35);border-radius:12px;padding:10px 12px;font-size:12.5px;margin-top:10px;text-align:left;}

/* ---- Organización / Colecciones / Multimedia extra (nuevas funciones del checklist) ---- */
.progress-bar{width:100%;height:10px;border-radius:8px;background:var(--linea);overflow:hidden;margin-top:8px;}
.progress-fill{height:100%;background:var(--rosa-int);border-radius:8px;transition:width .3s ease;}
.deco-layer{position:absolute;inset:0;pointer-events:none;}
.deco-washi{position:absolute;width:70px;height:22px;opacity:.85;transform:rotate(-6deg);border-radius:2px;background:repeating-linear-gradient(45deg,var(--rosa-int),var(--rosa-int) 6px,var(--dorado-suave) 6px,var(--dorado-suave) 12px);}
.deco-frame{position:absolute;inset:-6px;border:10px solid transparent;border-image:linear-gradient(135deg,var(--dorado),var(--rosa-int)) 1;pointer-events:none;border-radius:8px;}
.deco-sello{position:absolute;bottom:6px;right:6px;font-size:22px;transform:rotate(-12deg);opacity:.9;}
.rec-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#e05a5a;margin-right:6px;animation:pulse-rec 1s infinite;}
@keyframes pulse-rec{0%,100%{opacity:1}50%{opacity:.3}}
.slideshow-frame{position:relative;border-radius:var(--radio);overflow:hidden;aspect-ratio:4/5;background:#000;display:flex;align-items:center;justify-content:center;}
.slideshow-frame img{width:100%;height:100%;object-fit:cover;}

/* Decoración visual activable (washi tape, marcos, sellos, pegatinas, temporadas) */
html[data-deco-washi] .card{position:relative;}
html[data-deco-washi] .card::before{content:'';position:absolute;top:-8px;left:16px;width:56px;height:18px;opacity:.85;transform:rotate(-5deg);border-radius:2px;background:repeating-linear-gradient(45deg,var(--rosa-int),var(--rosa-int) 6px,var(--dorado-suave) 6px,var(--dorado-suave) 12px);}
html[data-deco-marco] .card{outline:2px solid transparent;box-shadow:0 0 0 2px var(--dorado-suave), var(--sombra);}
html[data-deco-sello] .hero::after{content:'💌';position:absolute;bottom:10px;right:14px;font-size:22px;transform:rotate(-10deg);opacity:.9;}
html[data-deco-pegatinas] .top .brand::after{content:'✨';margin-left:6px;}
html[data-estacion="primavera"]{--rosa-int:#f2a6c9;--dorado:#e0b45f;}
html[data-estacion="verano"]{--rosa-int:#f0c26b;--cielo:#a9d9ec;}
html[data-estacion="otono"]{--rosa-int:#d98a55;--dorado:#c98a3a;}
html[data-estacion="invierno"]{--rosa-int:#a9c3e6;--lila-int:#b6a8e6;}
.album-list{display:flex;flex-direction:column;gap:8px;}
html[data-cursor-corazon] , html[data-cursor-corazon] button, html[data-cursor-corazon] a{cursor:pointer;}
html[data-cursor-corazon]{cursor:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2228%22%20height%3D%2228%22%3E%3Ctext%20y%3D%2222%22%20font-size%3D%2222%22%3E%F0%9F%92%97%3C%2Ftext%3E%3C%2Fsvg%3E') 12 12, auto;}

/* ---- Accesibilidad ---- */
html[data-a11y-texto-grande]{font-size:112%;}
html[data-a11y-alto-contraste]{--tinta-suave:#1a1420;--linea:#6b5a72;}
html[data-a11y-alto-contraste] .card, html[data-a11y-alto-contraste] .hero{border-width:2px;}
html[data-a11y-reducir-mov] *{animation-duration:0.001s !important;transition-duration:0.001s !important;}

/* ================= Popover de categorías (barra de escritorio) ================= */
.tabbar-cat-btn{flex:1;min-width:64px;}
.tabbar-popover{display:none;position:fixed;min-width:190px;background:var(--superficie);border:1.5px solid var(--linea);border-radius:14px;box-shadow:var(--sombra);padding:6px;z-index:15;flex-direction:column;}
.tabbar-popover.abierto{display:flex;}
.tabbar-popover button{display:flex;align-items:center;gap:8px;padding:9px 10px;border:none;background:none;border-radius:10px;font-size:13px;font-weight:600;color:var(--tinta);text-align:left;white-space:nowrap;}
.tabbar-popover button.active{background:var(--linea);}
.tabbar-popover button:hover{background:var(--linea);}

/* ================= Menú hamburguesa (solo móvil) ================= */
.menu-movil-overlay{display:none;position:fixed;inset:0;z-index:20;background:rgba(30,20,30,.55);}
.menu-movil-overlay.abierto{display:block;}
.menu-movil-panel{position:absolute;top:0;left:0;bottom:0;width:82%;max-width:320px;background:var(--crema);box-shadow:var(--sombra);overflow-y:auto;padding:16px 10px 90px;transform:translateX(-100%);transition:transform .22s ease;}
.menu-movil-overlay.abierto .menu-movil-panel{transform:translateX(0);}
.menu-movil-cat{margin-bottom:6px;border-radius:14px;overflow:hidden;}
.menu-movil-cat-btn{width:100%;display:flex;align-items:center;gap:10px;padding:12px 10px;background:var(--superficie);border:none;font-weight:700;font-size:14px;color:var(--tinta);text-align:left;border-radius:14px;}
.menu-movil-cat-btn .ic{font-size:18px;}
.menu-movil-cat-btn .chev{margin-left:auto;font-size:12px;opacity:.6;}
.menu-movil-subs{max-height:0;overflow:hidden;transition:max-height .2s ease;background:transparent;}
.menu-movil-cat.abierta .menu-movil-subs{max-height:600px;}
.menu-movil-subs button{width:100%;display:flex;align-items:center;gap:8px;padding:10px 10px 10px 34px;background:none;border:none;font-size:13px;color:var(--tinta-suave);text-align:left;}
.menu-movil-subs button.activa{color:var(--tinta);font-weight:700;}
/* ================= 📍 Mapa de Recuerdos ================= */
.mapa-leaflet-box{width:100%;height:320px;border-radius:18px;overflow:hidden;background:var(--superficie);border:1px solid var(--linea);}
.mapa-leaflet-box-mini{height:200px;}
.mapa-marker-pin{background:transparent;border:none;}
.mapa-marker-pin-inner{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px -3px rgba(0,0,0,.45);border:2.5px solid #fff;font-size:15px;position:relative;}
.mapa-marker-pin-inner::after{content:'';position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);border:5px solid transparent;border-top-color:#fff;}
.mapa-ruta-flecha{text-align:center;color:var(--tinta-suave);font-size:15px;line-height:1.4;}

@media (max-width:700px){
  nav.tabbar{display:none;}
  #hamburgerBtn{display:inline-flex !important;}
  #main{padding-bottom:24px;}
  /* Bug: en móvil el header mostraba el botón ☰ + todos los iconos de acción
     (buscar, código, estado, avatares, salir) en una sola fila sin espacio
     para todos, quedando amontonados/encimados sobre el borde de la pantalla.
     Solución: el header pasa a dos filas (marca+hamburguesa arriba, acciones
     abajo) y las acciones se hacen más compactas y deslizables si no caben. */
  header.top{flex-wrap:wrap;row-gap:8px;padding:12px 14px 10px;}
  .brand{flex:1 1 auto;}
  .top-actions{flex:1 1 100%;justify-content:flex-end;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;gap:6px;}
  .top-actions::-webkit-scrollbar{display:none;}
  .top-actions .icon-btn{width:32px;height:32px;font-size:14px;flex-shrink:0;}
}

/* ---- Optimización para tablet ---- */
@media (min-width:600px) and (max-width:1024px){
  #main{max-width:640px;margin:0 auto;}
  .album-grid{grid-template-columns:repeat(4,1fr);}
  .grid2{grid-template-columns:1fr 1fr;}
}

/* ---- Transiciones generales / apertura de cartas ---- */
#main{animation:fadeInMain .25s ease;}
@keyframes fadeInMain{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.letter-card{transition:transform .25s ease, box-shadow .25s ease;}
.letter-card:active{transform:scale(.97);}
@keyframes envelopeOpen{0%{transform:scale(1) rotate(0)}40%{transform:scale(1.04) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
.letter-card.opening{animation:envelopeOpen .4s ease;}

/* ---- Forma, transparencia y modo noche extra ---- */
html[data-esquinas-cuadradas] .card, html[data-esquinas-cuadradas] .hero, html[data-esquinas-cuadradas] .btn, html[data-esquinas-cuadradas] input, html[data-esquinas-cuadradas] textarea, html[data-esquinas-cuadradas] select{border-radius:4px !important;}
html[data-transparencias] .card{background:rgba(255,255,255,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
html[data-oscuro="1"][data-transparencias] .card{background:rgba(40,32,48,.55);}
html[data-oscurecer-imagenes][data-oscuro="1"] img{filter:brightness(.78);}
@keyframes twinkle{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}

/* ---- Personalización de clima (partículas) y fondo vivo ---- */
.particula-lluvia{position:absolute;top:-5%;width:2px;height:22px;background:linear-gradient(to bottom, rgba(150,190,230,0), rgba(150,190,230,.6));animation:fall linear infinite;}
.particula-nieve{position:absolute;top:-5%;width:8px;height:8px;border-radius:50%;background:#fff;opacity:.8;animation:fall linear infinite, drift 4s ease-in-out infinite alternate;}
.particula-estrella{position:absolute;top:-5%;font-size:14px;animation:fall linear infinite;filter:drop-shadow(0 0 3px #fff8d6);}
.particula-corazon{position:absolute;top:-5%;font-size:14px;animation:fall linear infinite;}
.particula-burbuja{position:absolute;bottom:-5%;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.08);animation:subir linear infinite;}
@keyframes drift{from{margin-left:-10px}to{margin-left:10px}}
@keyframes subir{from{transform:translateY(0)}to{transform:translateY(-110vh)}}

html[data-fondovivo="manana"] body{background:linear-gradient(180deg,#fff6ea,#fdeef2) !important;}
html[data-fondovivo="tarde"] body{background:linear-gradient(180deg,#ffe9d6,#ffd9e6) !important;}
html[data-fondovivo="noche"] body{background:linear-gradient(180deg,#221c3a,#3a2c52) !important;}
html[data-fondovivo="noche"][data-oscuro="0"] .card{background:rgba(255,255,255,.9);}


/* ================= ❤️ Nuestra Distancia (Mapa de Recuerdos) ================= */
.distancia-card{ text-align:center; }
.distancia-card h3{ text-align:left; }
.distancia-emoji{ font-size:40px; margin:6px 0; animation: distanciaLatido 2.4s ease-in-out infinite; }
.distancia-principal{ font-family:'Fraunces',serif; font-size:19px; margin-bottom:4px; }
@keyframes distanciaLatido{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }

/* ================= LLAMADAS (audio/video) ================= */
.chat-media-btn.llamada-btn-chat, .icon-btn.llamada-btn-chat{ background:var(--rosa-int,#eeb1cd); color:#fff; border-color:transparent; }
.msg-llamada-registro{ align-self:center; display:flex; align-items:center; gap:6px; background:var(--superficie); border:1px solid var(--linea); border-radius:99px; padding:6px 14px; font-size:12px; color:var(--tinta-suave); max-width:90%; }
.msg-llamada-icono{ font-size:14px; }
.msg-llamada-hora{ font-size:10px; opacity:.7; }
.llamada-panel{
  position:fixed; inset:0; z-index:900; display:none; flex-direction:column;
  background:linear-gradient(160deg,#2a1420,#120a10); color:#fff;
}
.llamada-video-wrap{ position:relative; flex:1; overflow:hidden; }
.llamada-video-remoto{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; }
.llamada-avatar-espera{ font-size:64px; animation:distanciaLatido 2.4s ease-in-out infinite; }
.llamada-video-local{
  position:absolute; right:14px; bottom:14px; width:96px; height:132px; border-radius:16px;
  overflow:hidden; border:2px solid rgba(255,255,255,.6); box-shadow:0 4px 16px rgba(0,0,0,.4); background:#000;
}
.llamada-info{ position:absolute; top:14px; left:0; right:0; text-align:center; font-weight:700; text-shadow:0 2px 6px rgba(0,0,0,.5); }
.llamada-controles{ display:flex; justify-content:center; gap:14px; padding:18px; background:rgba(0,0,0,.25); }
.llamada-btn{
  width:52px; height:52px; border-radius:50%; border:none; font-size:20px; cursor:pointer;
  background:rgba(255,255,255,.15); color:#fff; display:flex; align-items:center; justify-content:center;
}
.llamada-btn-colgar{ background:#e5484d; }
.llamada-btn-contestar{ background:#3cb46e; }
.llamada-banner{
  position:fixed; left:50%; top:14px; transform:translateX(-50%); z-index:950; display:none;
  align-items:center; gap:12px; background:var(--superficie,#fff); color:var(--texto,#333); border-radius:18px;
  padding:10px 14px; box-shadow:0 8px 24px rgba(0,0,0,.18); border:1.5px solid var(--linea,#eee); max-width:92vw;
}
.llamada-banner-texto{ font-weight:700; font-size:13.5px; white-space:nowrap; }
.llamada-banner-entrante{ background:var(--rosa-int,#eeb1cd); color:#fff; border-color:transparent; }
.llamada-banner-acciones{ display:flex; gap:8px; }
.llamada-banner .llamada-btn{ width:38px; height:38px; font-size:15px; }
