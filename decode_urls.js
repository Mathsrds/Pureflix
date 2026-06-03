// decode_urls.js - PureFlix Direct URL Decoder v3.1 (FIXED)
// Corrige bug do continue que pulava processamento de outros campos

function decodeDirectLinks(raw) {
  for (const id in raw) {
    const entry = raw[id];

    // Verificar filmes
    if (entry.type === 'movie') {
      entry.dubbed_url = processUrl(entry.dubbed_url);
      entry.subbed_url = processUrl(entry.subbed_url);
    }

    // Verificar séries
    if (entry.episodes) {
      for (const ep of entry.episodes) {
        ep.dubbed_url = processUrl(ep.dubbed_url);
        ep.subbed_url = processUrl(ep.subbed_url);
      }
    }
  }

  return raw;
}

function processUrl(url) {
  if (!url) return url;

  // Se já está decodificado (começa com AD6v5d), retorna como está
  if (url.includes('AD6v5d')) {
    return url;
  }

  // Se está codificado (começa com QUQ2djVk), decodifica
  if (url.startsWith('QUQ2djVk')) {
    return decodeToken(url);
  }

  // Outros formatos (HLS, meusdoramas, etc.) - retorna como está
  return url;
}

function decodeToken(url) {
  try {
    const tokenMatch = url.match(/token=([^&]+)/);
    if (!tokenMatch) return url;

    let token = tokenMatch[1];
    const padding = 4 - (token.length % 4);
    if (padding !== 4) {
      token += '='.repeat(padding);
    }

    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    return url.replace(/token=[^&]+/, 'token=' + decoded);
  } catch (e) {
    console.error('[PureFlix Direct] Erro ao decodificar token:', e);
    return url;
  }
}
