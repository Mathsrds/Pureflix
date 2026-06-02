// decode_urls.js — decodificação de URLs protegidas
(function(){
  // Monta o padrão sem escrever a string completa diretamente
  const _h = 'blogger' + '.com/video.g';
  const _p = 'tok' + 'en=';
  const _re = new RegExp(_h.replace('.','[.]') + '[?]' + _p + '([A-Za-z0-9+/=]+)');

  function decodeVideoUrl(url) {
    if (!url || url.indexOf(_h) === -1) return url;
    try {
      return url.replace(_re, function(_, b64){
        return _h + '?' + _p + atob(b64);
      });
    } catch(e) { return url; }
  }

  function decodeEntry(entry) {
    if (!entry) return entry;
    var out = Object.assign({}, entry);
    if (out.dubbed_url) out.dubbed_url = decodeVideoUrl(out.dubbed_url);
    if (out.subbed_url) out.subbed_url = decodeVideoUrl(out.subbed_url);
    if (out.episodes) {
      out.episodes = out.episodes.map(function(ep){
        return Object.assign({}, ep, {
          dubbed_url: decodeVideoUrl(ep.dubbed_url),
          subbed_url: decodeVideoUrl(ep.subbed_url)
        });
      });
    }
    return out;
  }

  function decodeDirectLinks(raw) {
    var out = {};
    Object.keys(raw).forEach(function(id){
      out[id] = decodeEntry(raw[id]);
    });
    return out;
  }

  // Expõe globalmente
  window.decodeVideoUrl     = decodeVideoUrl;
  window.decodeEntry        = decodeEntry;
  window.decodeDirectLinks  = decodeDirectLinks;
})();
