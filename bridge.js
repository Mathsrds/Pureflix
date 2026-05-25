const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DE CHAVES DO SEU PROJETO
const TMDB_API_KEY = '59ff19f0c822abdfb0c3b41bfd6b92b0';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWZmMTlmMGM4MjJhYmRmYjBjM2I0MWJmZDZiOTJiMCIsIm5iZiI6MTc3OTcxNTY2Ni41NzEsInN1YiI6IjZhMTQ0ZTUyODM4ZGNiYzhmNDAyZEY5MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pFS9ydcOA40ekPL09mC8DiNns6RK_j26KrRIGAt1HCg';
const BASE_URL = 'https://api.themoviedb.org/3';

// Middleware para interceptar todas as requisições para o TMDB e injetar a localização BR
app.get('/tmdb/*', async (req, res) => {
    try {
        const path = req.params[0]; // Pega o resto da URL digitada pelo front-end
        
        // Injeta os parâmetros nativos de Tradução e Região do Brasil
        const queryParams = {
            ...req.query,
            api_key: TMDB_API_KEY,
            language: 'pt-BR',
            region: 'BR',
            include_adult: false
        };

        const response = await axios.get(`${BASE_URL}/${path}`, {
            params: queryParams,
            headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                accept: 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(`[Erro Bridge] Falha ao consultar TMDB: ${error.message}`);
        res.status(500).json({ error: "Erro na ponte de dados do TMDB" });
    }
});

// Rota de Tendências (Bombando) - Adaptada para tradução automática
app.get('/trending', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/trending/all/week`, {
            params: { api_key: TMDB_API_KEY, language: 'pt-BR' },
            headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }
        });
        res.json(response.data.results || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota de Pesquisa direta unificada - Adaptada com localização brasileira
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await axios.get(`${BASE_URL}/search/multi`, {
            params: { api_key: TMDB_API_KEY, language: 'pt-BR', query: query, include_adult: false },
            headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }
        });

        // Converte o formato do TMDB para o esperado pelo seu grid original
        const formatted = (response.data.results || [])
            .filter(i => i.media_type === 'movie' || i.media_type === 'tv')
            .map(i => ({
                id: i.id,
                name: i.title || i.name,
                type: i.media_type,
                poster: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : null
            }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✓ Proxy bridge.js ativo na porta ${PORT} - Integrado com TMDB em Português-BR`));
