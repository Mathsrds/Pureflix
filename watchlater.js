/* ═══════════════════════════════════════
   watchlater.js — Gerencia "Assistir Mais Tarde"
   Usado por: assistir-mais-tarde.html, calendario.html, detalhes.html
═══════════════════════════════════════ */

const WL_KEY = 'pf_watchlater';

function getWatchLater(){
  try{ return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); }
  catch(e){ return []; }
}

function saveWatchLater(list){
  localStorage.setItem(WL_KEY, JSON.stringify(list));
}

function isInWatchLater(id){
  return getWatchLater().some(x => String(x.id) === String(id));
}

function addWatchLater(item){
  const list = getWatchLater();
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
  saveWatchLater(list);
  return true;
}

function removeWatchLater(id){
  const list = getWatchLater().filter(x => String(x.id) !== String(id));
  saveWatchLater(list);
}

function toggleWatchLater(item){
  if(isInWatchLater(item.id)){
    removeWatchLater(item.id);
    return false; // removido
  } else {
    addWatchLater(item);
    return true;  // adicionado
  }
}
