const express = require('express');
const axios = require('axios');
const mime = require('mime-types');
const helmet = require('helmet'); // Adicionado para segurança
const app = express();

let client = null;

// Gestão de Memória: Limite de torrents ativos
const MAX_TORRENTS = 5; 

(async () => {
    try {
        const { default: WebTorrent } = await import('webtorrent');
        client = new WebTorrent({ maxConns: 30 });
        console.log('WebTorrent Client iniciado.');
    } catch (e) {
        console.error('WebTorrent falhou (módulos nativos).');
    }
})();

// Segurança: Helmet protege contra várias vulnerabilidades HTTP
app.use(helmet({
    contentSecurityPolicy: false, // Desativado para permitir streaming de várias fontes
}));
app.use(express.json());

// CORS Seguro
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Teste 1: Limpeza Automática Agressiva
setInterval(() => {
    if (client && client.torrents.length > MAX_TORRENTS) {
        console.log('Limite de memória atingido. Limpando torrent mais antigo...');
        client.torrents[0].destroy();
    }
}, 60000);

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 3) return res.status(400).send('Busca muito curta');
    
    // Segurança: Sanitização básica da query
    const safeQuery = query.replace(/[^\w\s]/gi, '');

    try {
        const response = await axios.get(`https://apibay.org/q.php?q=${encodeURIComponent(safeQuery)}`, { timeout: 10000 });
        if (!response.data || response.data[0].id === '0') return res.json([]);
        
        const results = response.data.map(item => ({
            name: item.name,
            info_hash: item.info_hash,
            size: item.size,
            seeders: item.seeders
        }));
        res.json(results);
    } catch (error) {
        res.status(500).send('Erro na busca');
    }
});

app.get('/stream', (req, res) => {
    const magnet = req.query.magnet;
    // Segurança: Validação de Magnet Link
    if (!magnet || !magnet.startsWith('magnet:?xt=urn:btih:')) {
        return res.status(400).send('Link Magnet inválido');
    }

    if (!client) return res.status(503).send('Streaming indisponível');

    let torrent = client.get(magnet);
    if (!torrent) {
        torrent = client.add(magnet, (t) => serveFile(t, req, res));
    } else {
        if (torrent.ready) serveFile(torrent, req, res);
        else torrent.on('ready', () => serveFile(torrent, req, res));
    }
});

function serveFile(torrent, req, res) {
    const file = torrent.files.find(f => f.name.match(/\.(mp4|mkv|webm|mp3|wav|ogg)$/i)) 
                 || torrent.files.reduce((a, b) => a.length > b.length ? a : b);
    
    if (!file) return res.status(404).send('Arquivo não encontrado');

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
app.listen(PORT, () => console.log(`Servidor Blindado rodando na porta ${PORT}`));
