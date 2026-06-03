// decode_urls.js - PureFlix Direct URL Decoder v2.0
// Versão com cache-busting e detecção automática de formato

function decodeDirectLinks(raw) {
  // Se os URLs já estão em formato decodificado (começam com AD6v5d...)
  // apenas retorna os dados sem alteração

  for (const id in raw) {
    const entry = raw[id];

    // Verificar filmes
    if (entry.type === 'movie') {
      if (entry.dubbed_url && entry.dubbed_url.includes('AD6v5d')) {
        // Já está decodificado - não fazer nada
        continue;
      }
      if (entry.dubbed_url && entry.dubbed_url.startsWith('QUQ2djVk')) {
        // Está codificado - decodificar
        entry.dubbed_url = decodeToken(entry.dubbed_url);
      }
      if (entry.subbed_url && entry.subbed_url.startsWith('QUQ2djVk')) {
        entry.subbed_url = decodeToken(entry.subbed_url);
      }
    }

    // Verificar séries
    if (entry.episodes) {
      for (const ep of entry.episodes) {
        if (ep.dubbed_url && ep.dubbed_url.startsWith('QUQ2djVk')) {
          ep.dubbed_url = decodeToken(ep.dubbed_url);
        }
        if (ep.subbed_url && ep.subbed_url.startsWith('QUQ2djVk')) {
          ep.subbed_url = decodeToken(ep.subbed_url);
        }
      }
    }
  }

  return raw;
}

function decodeToken(url) {
  try {
    // Extrair token do URL
    const tokenMatch = url.match(/token=([^&]+)/);
    if (!tokenMatch) return url;

    let token = tokenMatch[1];

    // Adicionar padding se necessário
    const padding = 4 - (token.length % 4);
    if (padding !== 4) {
      token += '='.repeat(padding);
    }

    // Decodificar Base64 URL-safe
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));

    // Reconstruir URL com token decodificado
    return url.replace(/token=[^&]+/, 'token=' + decoded);
  } catch (e) {
    console.error('[PureFlix Direct] Erro ao decodificar token:', e);
    return url;
  }
}
