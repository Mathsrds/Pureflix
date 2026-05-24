const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Cache simples para buscas
const searchCache = new Map();

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json([]);

    if (searchCache.has(query)) {
        return res.json(searchCache.get(query));
    }

    console.log(`Buscando: ${query}`);
    
    const searchApis = [
        `https://apibay.org/q.php?q=${encodeURIComponent(query)}`,
        `https://torrent-api-py.vercel.app/api/v1/all/search?query=${encodeURIComponent(query)}`
    ];

    for (const api of searchApis) {
        try {
            const response = await axios.get(api, { timeout: 8000 });
            let results = [];
            
            if (api.includes('apibay')) {
                if (Array.isArray(response.data)) {
                    results = response.data.map(i => ({
                        name: i.name,
                        info_hash: i.info_hash,
                        seeders: i.seeders,
                        size: i.size
                    })).filter(i => i.name !== 'No results found' && i.info_hash !== '0000000000000000000000000000000000000000');
                }
            } else {
                if (Array.isArray(response.data)) {
                    results = response.data.map(i => ({
                        name: i.title || i.name,
                        info_hash: i.info_hash || i.hash,
                        seeders: i.seeds || i.seeders,
                        size: i.size
                    }));
                }
            }

            if (results.length > 0) {
                searchCache.set(query, results);
                return res.json(results);
            }
        } catch (e) {
            console.error(`Erro na API ${api}:`, e.message);
        }
    }

    res.json([]);
});

app.get('/stream', (req, res) => {
    const magnet = req.query.magnet;
    if (!magnet) return res.status(400).send('Magnet link necessário');
    // Redirecionamento direto para o Webtor como serviço de streaming estável
    res.redirect(`https://webtor.io/show?magnet=${encodeURIComponent(magnet)}`);
});

app.listen(PORT, () => {
    console.log(`Servidor PureFlix v18 rodando na porta ${PORT}`);
});
