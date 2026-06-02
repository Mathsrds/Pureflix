// ─────────────────────────────────────────────────────────────────────────────
// decode_urls.js
// Decodifica tokens Blogger (Base64) antes de usar as URLs do direct_links.json
// Inclua este script no seu HTML antes de qualquer uso do direct_links.json
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decodifica o token Base64 de uma URL do Blogger.
 * URLs de outros provedores (anivideo, vidsrc, etc.) passam sem alteração.
 *
 * Antes : https://www.blogger.com/video.g?token=QUQ2djVkd3Az...
 * Depois: https://www.blogger.com/video.g?token=AD6v5dwp3xXY...
 */
function decodeVideoUrl(url) {
  if (!url || !url.includes('blogger.com/video.g?token=')) return url;
  try {
    return url.replace(
      /blogger\.com\/video\.g\?token=([A-Za-z0-9+/=_\-]+)/,
      (_, b64) => 'blogger.com/video.g?token=' + atob(b64)
    );
  } catch (e) {
    console.warn('[PureFlix] Falha ao decodificar URL do Blogger:', e);
    return url; // retorna original em caso de erro
  }
}

/**
 * Aplica decodeVideoUrl nos campos dubbed_url e subbed_url de um episódio ou filme.
 * Uso: const ep = decodeEntry(rawEntry);
 */
function decodeEntry(entry) {
  if (!entry) return entry;
  const out = { ...entry };
  if (out.dubbed_url) out.dubbed_url = decodeVideoUrl(out.dubbed_url);
  if (out.subbed_url) out.subbed_url = decodeVideoUrl(out.subbed_url);
  if (out.episodes) {
    out.episodes = out.episodes.map(ep => ({
      ...ep,
      dubbed_url: decodeVideoUrl(ep.dubbed_url),
      subbed_url: decodeVideoUrl(ep.subbed_url),
    }));
  }
  return out;
}

/**
 * Decodifica o JSON inteiro do direct_links.json após o fetch.
 * Uso:
 *   const raw  = await fetch('direct_links.json').then(r => r.json());
 *   const data = decodeDirectLinks(raw);
 *   // Agora data['85937'].episodes[0].dubbed_url já está decodificada
 */
function decodeDirectLinks(raw) {
  const out = {};
  for (const [id, entry] of Object.entries(raw)) {
    out[id] = decodeEntry(entry);
  }
  return out;
}
