const express = require('express');
const axios   = require('axios');
const app     = express();
const PORT    = 3000;

const TMDB_API_KEY   = '59ff19f0c822abdfb0c3b41bfd6b92b0';
const TMDB_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWZmMTlmMGM4MjJhYmRmYjBjM2I0MWJmZDZiOTJiMCIsIm5iZiI6MTc3OTcxNTY2Ni41NzEsInN1YiI6IjZhMTQ0ZTUyODM4ZGNiYzhmNDAyZDY5MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pFS9ydcOA40ekPL09mC8DiNns6RK_j26KrRIGAt1HCg';
const TMDB_BASE      = 'https://api.themoviedb.org/3';

// Headers padrão com Bearer token (método oficial mais seguro)
const TMDB_HEADERS = {
    Authorization: `Bearer ${TMDB_API_TOKEN}`,
    'Content-Type': 'application/json'
};

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const cache = new Map();

// ── /search?q=nome&type=movie|tv ──────────────────────────────────────────────
app.get('/search', async (req, res) => {
    const query = req.query.q;
    const type  = req.query.type || 'movie';
    if (!query || query.length < 2) return res.json([]);

    const cacheKey = `search:${type}:${query}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    try {
        const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
        const response = await axios.get(`${TMDB_BASE}/${endpoint}`, {
            params:  { query, language: 'pt-BR', page: 1 },
            headers: TMDB_HEADERS,
            timeout: 8000
        });

        const results = response.data.results.slice(0, 20).map(item => ({
            id:       item.id,
            name:     item.title || item.name,
            year:     (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A',
            poster:   item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : null,
            backdrop: item.backdrop_path
                        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
                        : null,
            synopsis: item.overview || 'Sinopse não disponível.',
            rating:   item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
            type
        }));

        cache.set(cacheKey, results);
        res.json(results);
    } catch (e) {
        console.error('Erro TMDB /search:', e.message);
        res.status(500).json([]);
    }
});

// ── /movie/:id?type=movie|tv ──────────────────────────────────────────────────
app.get('/movie/:id', async (req, res) => {
    const { id } = req.params;
    const type   = req.query.type || 'movie';
    const cacheKey = `detail:${type}:${id}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    try {
        const endpoint = type === 'tv' ? `tv/${id}` : `movie/${id}`;
        const response = await axios.get(`${TMDB_BASE}/${endpoint}`, {
            params:  { language: 'pt-BR', append_to_response: 'external_ids' },
            headers: TMDB_HEADERS,
            timeout: 8000
        });

        const m = response.data;
        const result = {
            id:       m.id,
            imdb_id:  m.external_ids?.imdb_id || null,
            name:     m.title || m.name,
            year:     (m.release_date || m.first_air_date || '').split('-')[0] || 'N/A',
            poster:   m.poster_path
                        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                        : null,
            backdrop: m.backdrop_path
                        ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`
                        : null,
            synopsis: m.overview || 'Sinopse não disponível.',
            rating:   m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
            runtime:  m.runtime || null,
            genres:   (m.genres || []).map(g => g.name),
            type
        };

        cache.set(cacheKey, result);
        res.json(result);
    } catch (e) {
        console.error('Erro TMDB /movie/:id:', e.message);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor Pureflix rodando na porta ${PORT}`);
});
