/* ═══════════════════════════════════════
   notifications.js — Notificações de lançamentos
   Usado por: qualquer página que importe este script
═══════════════════════════════════════ */

const NOTIF_KEY  = 'pf_notifications';  // itens para notificar
const NOTIF_SENT = 'pf_notif_sent';     // IDs já notificados
const CHECK_KEY  = 'pf_notif_last';     // último check

/* ── Pedir permissão ── */
async function requestNotifPermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission === 'granted') return true;
  if(Notification.permission === 'denied')  return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

/* ── Salvar item para notificar ── */
function addNotification(item){
  let list = getNotifications();
  if(list.some(x => String(x.id) === String(item.id))) return false;
  list.push({
    id:      item.id,
    type:    item.type || item.media_type || 'movie',
    title:   item.title || item.name || '',
    poster:  item.poster || item.poster_path || '',
    release: item.release || item.release_date || item.first_air_date || item.air_date || '',
    ep:      item.episode_number || null,
    season:  item.season_number  || null,
  });
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  return true;
}

/* ── Remover item de notificações ── */
function removeNotification(id){
  const list = getNotifications().filter(x => String(x.id) !== String(id));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
}

/* ── Verificar se está na lista ── */
function isNotifying(id){
  return getNotifications().some(x => String(x.id) === String(id));
}

/* ── Toggle ── */
function toggleNotification(item){
  if(isNotifying(item.id)){ removeNotification(item.id); return false; }
  else { addNotification(item); return true; }
}

/* ── Obter lista ── */
function getNotifications(){
  try{ return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); }
  catch(e){ return []; }
}

/* ── Disparar notificação nativa ── */
function fireNotif(item){
  if(Notification.permission !== 'granted') return;
  const ep = item.ep ? ` — Ep. ${item.ep}` : '';
  const n = new Notification(`🎬 ${item.title}${ep} já está disponível!`, {
    body:    `Clique para assistir no PureFlix`,
    icon:    item.poster || 'https://image.tmdb.org/t/p/w92' + item.poster,
    tag:     'pureflix-' + item.id,
    badge:   '',
    vibrate: [200, 100, 200],
  });
  n.onclick = () => {
    window.focus();
    const type = item.type || 'movie';
    const s = item.season || 1;
    const e = item.ep    || 1;
    window.location.href = `detalhes.html?id=${item.id}&type=${type}&season=${s}&episode=${e}`;
    n.close();
  };
}

/* ── Verificar lançamentos (chama 1× por dia) ── */
async function checkNotifications(){
  const last  = parseInt(localStorage.getItem(CHECK_KEY) || '0');
  const now   = Date.now();
  const DAY   = 86400000;

  // só verifica se passou mais de 1h desde o último check
  if(now - last < 3600000) return;
  localStorage.setItem(CHECK_KEY, String(now));

  const list  = getNotifications();
  if(!list.length) return;

  const sent  = JSON.parse(localStorage.getItem(NOTIF_SENT) || '[]');
  const today = new Date(); today.setHours(0,0,0,0);

  for(const item of list){
    if(sent.includes(String(item.id))) continue;
    if(!item.release) continue;

    const releaseDate = new Date(item.release + 'T00:00:00');
    releaseDate.setHours(0,0,0,0);

    // notifica no dia do lançamento ou até 5 dias depois
    const diff = Math.floor((today - releaseDate) / DAY);
    if(diff >= 0 && diff <= 5){
      fireNotif(item);
      sent.push(String(item.id));
      localStorage.setItem(NOTIF_SENT, JSON.stringify(sent));
    }
  }
}

/* ── Auto-check ao carregar a página ── */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', checkNotifications);
} else {
  checkNotifications();
}
