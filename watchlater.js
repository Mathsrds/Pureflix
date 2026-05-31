/* ═══════════════════════════════════════
   watchlater.js — Gerencia "Assistir Mais Tarde"
   Usado por: assistir-mais-tarde.html, calendario.html, detalhes.html
═══════════════════════════════════════ */

// Guard contra redeclaração em múltiplos carregamentos
if(typeof window._wlLoaded === 'undefined'){
  window._wlLoaded = true;

  window.WL_KEY = 'pf_watchlater';

  window.getWatchLater = function(){
    try{ return JSON.parse(localStorage.getItem(window.WL_KEY) || '[]'); }
    catch(e){ return []; }
  };

  window.saveWatchLater = function(list){
    localStorage.setItem(window.WL_KEY, JSON.stringify(list));
  };

  window.isInWatchLater = function(id){
    return window.getWatchLater().some(x => String(x.id) === String(id));
  };

  window.addWatchLater = function(item){
    const list = window.getWatchLater();
    if(list.some(x => String(x.id) === String(item.id))){
      return false; // já existe
    }
    list.unshift({
      id:       item.id,
      type:     item.type || item.media_type || 'movie',
      title:    item.title || item.name || '',
      poster:   item.poster || item.poster_path || '',
      backdrop: item.backdrop || item.backdrop_path || '',
      release:  item.release || item.release_date || item.first_air_date || '',
      overview: item.overview || '',
      rating:   item.rating || item.vote_average || '',
      savedAt:  Date.now()
    });
    window.saveWatchLater(list);
    return true;
  };

  window.removeWatchLater = function(id){
    const list = window.getWatchLater().filter(x => String(x.id) !== String(id));
    window.saveWatchLater(list);
  };

  window.toggleWatchLater = function(item){
    if(window.isInWatchLater(item.id)){
      window.removeWatchLater(item.id);
      return false; // removido
    } else {
      window.addWatchLater(item);
      return true;  // adicionado
    }
  };

}
