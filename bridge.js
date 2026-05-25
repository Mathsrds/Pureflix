const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configurações TMDB
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWZmMTlmMGM4MjJhYmRmYjBjM2I0MWJmZDZiOTJiMCIsIm5iZiI6MTc3OTcxNTY2Ni41NzEsInN1YiI6IjZhMTQ0ZTUyODM4ZGNiYzhmNDAyZDY5MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pFS9ydcOA40ekPL09mC8DiNns6RK_j26KrRIGAt1HCg';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Proxy para TMDB (Resolve erro de CORS e protege o Token)
// Corrigido para Express 5.x: usa middleware para capturar tudo que começa com /tmdb/
app.use('/tmdb', async (req, res) => {
    try {
        const path = req.path; // req.path em app.use('/tmdb') já é o subcaminho
        const query = req.query;
        const response = await axios.get(`${TMDB_BASE}${path}`, {
            headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
            params: { ...query, language: 'pt-BR' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro TMDB Proxy:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Erro ao consultar TMDB' });
    }
});

// Busca de Filmes/Séries (Agregador)
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    
    try {
        const response = await axios.get(`${TMDB_BASE}/search/multi`, {
            headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
            params: { query, language: 'pt-BR', include_adult: false }
        });
        
        const results = response.data.results.map(item => ({
            id: item.id,
            name: item.title || item.name,
            type: item.media_type || (item.title ? 'movie' : 'tv'),
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            rating: item.vote_average,
            year: (item.release_date || item.first_air_date || '').split('-')[0],
            overview: item.overview
        }));
        
        res.json(results);
    } catch (error) {
        console.error('Erro na busca:', error.message);
        res.json([]);
    }
});

// Rota de Tendências (Home)
app.get('/trending', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE}/trending/all/day`, {
            headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
            params: { language: 'pt-BR' }
        });
        res.json(response.data.results);
    } catch (error) {
        res.json([]);
    }
});

app.listen(port, () => {
    console.log(`Servidor Pureflix Pro v23 rodando na porta ${port}`);
});
