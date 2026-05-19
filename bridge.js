const express = require('express');
const WebTorrent = require('webtorrent-hybrid');
const axios = require('axios');
const mime = require('mime-types');
const app = express();

const client = new WebTorrent({ maxConns: 100 });

app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// BUSCA MULTI-FONTE (Proxy para APIs de torrents populares)
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).send('Query is required');

    console.log('Buscando em múltiplas fontes para:', query);

    try {
        // Tentativa 1: API Bay (PirateBay)
        const response = await axios.get(`https://apibay.org/q.php?q=${encodeURIComponent(query)}`, { timeout: 5000 });
        let results = response.data;

        if (!results || results.length === 0 || results[0].id === '0') {
            // Tentativa 2: Fallback para outra fonte se a primeira falhar (ex: SolidTorrents ou similar via API pública)
            const fallback = await axios.get(`https://solidtorrents.net/api/v1/search?q=${encodeURIComponent(query)}&category=all`, { timeout: 5000 });
            results = fallback.data.results.map(item => ({
                name: item.title,
                info_hash: item.infoHash,
                size: item.size,
                seeders: item.swarm.seeders,
                leechers: item.swarm.leechers
            }));
        } else {
            // Formatar resultados da API Bay
            results = results.map(item => ({
                name: item.name,
                info_hash: item.info_hash,
                size: item.size,
                seeders: item.seeders,
                leechers: item.leechers
            }));
        }

        res.json(results);
    } catch (error) {
        console.error('Erro na busca multi-fonte:', error.message);
        res.status(500).send('Erro ao realizar busca');
    }
});

app.get('/stream', (req, res) => {
    const magnet = req.query.magnet;
    if (!magnet) return res.status(400).send('Magnet link is required');

    let torrent = client.get(magnet);
    
    if (!torrent) {
        torrent = client.add(magnet, (t) => {
            t._lastActive = Date.now();
            serveFile(t, req, res);
        });
    } else {
        torrent._lastActive = Date.now();
        if (torrent.ready) serveFile(torrent, req, res);
        else torrent.on('ready', () => serveFile(torrent, req, res));
    }
});

function serveFile(torrent, req, res) {
    const file = torrent.files.find(f => 
        f.name.match(/\.(mp4|mkv|webm|mp3|wav|ogg)$/i)
    ) || torrent.files.reduce((a, b) => a.length > b.length ? a : b);

    if (!file) return res.status(404).send('No playable file found');

    const contentType = mime.lookup(file.name) || 'video/mp4';
    const range = req.headers.range;

    if (!range) {
        res.header('Content-Length', file.length);
        res.header('Content-Type', contentType);
        res.header('Accept-Ranges', 'bytes');
        return file.createReadStream().pipe(res);
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
    });

    file.createReadStream({ start, end }).pipe(res);
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Bridge Multi-Fonte rodando na porta ${PORT}`);
});
