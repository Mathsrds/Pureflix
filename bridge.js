const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const TMDB_API_KEY = '59ff19f0c822abdfb0c3b41bfd6b92b0';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWZmMTlmMGM4MjJhYmRmYjBjM2I0MWJmZDZiOTJiMCIsIm5iZiI6MTc3OTcxNTY2Ni41NzEsInN1YiI6IjZhMTQ0ZTUyODM4ZGNiYzhmNDAyZDY5MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pFS9ydcOA40ekPL09mC8DiNns6RK_j26KrRIGAt1HCg';

const BASE_URL = 'https://api.themoviedb.org/3';

const DEFAULT_PARAMS = {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
    region: 'BR',
    include_adult: false
};

const AXIOS_CONFIG = {
    headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        accept: 'application/json'
    }
};

// 1. CARROSSEIS E ENDPOINTS GERAIS
app.get('/tmdb/:type/:action', async (req, res, next) => {
    try {
        const { type, action } = req.params;
        
        // CORREÇÃO CRÍTICA: Se a "action" for um número (ID do filme), passa para a próxima rota.
        if (!isNaN(action)) {
            return next();
        }

        const response = await axios.get(`${BASE_URL}/${type}/${action}`, {
            params: DEFAULT_PARAMS,
            ...AXIOS_CONFIG
        });
        
        const filtered = response.data.results?.filter(item => item.backdrop_path && item.overview) || [];
        res.json(filtered);
    } catch (error) {
        console.error(`Erro em /tmdb/${req.params.type}/${req.params.action}:`, error.message);
        res.status(500).json({ error: "Erro ao carregar listas do TMDB" });
    }
});

// 2. DETALHES DA MÍDIA (Agora funciona isoladamente)
app.get('/tmdb/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const response = await axios.get(`${BASE_URL}/${type}/${id}`, {
            params: DEFAULT_PARAMS,
            ...AXIOS_CONFIG
        });
        res.json(response.data);
    } catch (error) {
        console.error(`Erro ao buscar detalhes da mídia ${req.params.id}:`, error.message);
        res.status(500).json({ error: "Erro ao carregar metadados do filme/série" });
    }
});

// 3. DISCOVER POR GÊNERO
app.get('/discover/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const response = await axios.get(`${BASE_URL}/discover/${type}`, {
            params: {
                ...DEFAULT_PARAMS,
                watch_region: 'BR',
                with_original_language: 'pt|en|es|ja',
                ...req.query
            },
            ...AXIOS_CONFIG
        });
        res.json(response.data.results);
    } catch (error) {
        console.error("Erro no discover:", error.message);
        res.status(500).json({ error: "Erro ao descobrir conteúdos" });
    }
});

// 4. BUSCA
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const response = await axios.get(`${BASE_URL}/search/multi`, {
            params: { ...DEFAULT_PARAMS, query: query },
            ...AXIOS_CONFIG
        });

        const filtered = response.data.results.filter(item => 
            (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
        );
        res.json(filtered);
    } catch (error) {
        console.error("Erro na busca:", error.message);
        res.status(500).json({ error: "Erro ao executar busca" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✓ Servidor rodando na porta ${PORT}`));
