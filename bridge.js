const express = require('express');
const axios = require('axios');
const mime = require('mime-types');
const cheerio = require('cheerio');
const app = express();

// Usar import dinâmico para o WebTorrent pois as versões novas são ESM
let client;
(async () => {
    const { default: WebTorrent } = await import('webtorrent-hybrid');
    client = new WebTorrent({ maxConns: 100 });
    console.log('WebTorrent Client iniciado com sucesso.');
})();

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

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).send('Query is required');

    console.log('Buscando para:', query);

    try {
        // Busca via SolidTorrents API (mais estável para bibliotecas)
        const response = await axios.get(`https://solidtorrents.net/api/v1/search?q=${encodeURIComponent(query)}&category=all`, { timeout: 8000 });
        
        if (!response.data || !response.data.results) {
            return res.json([]);
        }

        const results = response.data.results.map(item => ({
            name: item.title,
            info_hash: item.infoHash,
            size: item.size,
            seeders: item.swarm.seeders,
            source: item.title.toLowerCase().includes('dublado') || item.title.toLowerCase().includes('legendado') ? 'Biblioteca BR' : 'Global'
        }));

        res.json(results);
    } catch (error) {
        console.error('Erro na busca:', error.message);
        res.status(500).send('Erro ao realizar busca');
    }
});

app.get('/stream', (req, res) => {
    const magnet = req.query.magnet;
    if (!magnet) return res.status(400).send('Magnet link is required');
    if (!client) return res.status(503).send('Servidor iniciando, tente novamente em instantes');

    let torrent = client.get(magnet);
    if (!torrent) {
        torrent = client.add(magnet, (t) => {
            serveFile(t, req, res);
        });
    } else {
        if (torrent.ready) serveFile(torrent, req, res);
        else torrent.on('ready', () => serveFile(torrent, req, res));
    }
});

function serveFile(torrent, req, res) {
    const file = torrent.files.find(f => f.name.match(/\.(mp4|mkv|webm|mp3|wav|ogg)$/i)) 
                 || torrent.files.reduce((a, b) => a.length > b.length ? a : b);

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
    console.log(`Servidor Bridge Corrigido rodando na porta ${PORT}`);
});
