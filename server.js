const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DE CHAVES
const TMDB_API_KEY = '59ff19f0c822abdfb0c3b41bfd6b92b0';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWZmMTlmMGM4MjJhYmRmYjBjM2I0MWJmZDZiOTJiMCIsIm5iZiI6MTc3OTcxNTY2Ni41NzEsInN1YiI6IjZhMTQ0ZTUyODM4ZGNiYzhmNDAyZEY5MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pFS9ydcOA40ekPL09mC8DiNns6RK_j26KrRIGAt1HCg';

const BASE_URL = 'https://api.themoviedb.org/3';

// Força o TMDB a entregar metadados brasileiros (títulos, capas locais e sinopses)
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

// 1. LISTAGENS INICIAIS (Populares, Tendências, Em Cartaz)
app.get('/api/list/:type/:action', async (req, res) => {
    try {
        const { type, action } = req.params;
        const response = await axios.get(`${BASE_URL}/${type}/${action}`, {
            params: DEFAULT_PARAMS,
            ...AXIOS_CONFIG
        });
        
        // Remove lixo ou mídias que faltam imagens no TMDB
        const filtered = response.data.results?.filter(item => item.backdrop_path || item.poster_path) || [];
        res.json(filtered);
    } catch (error) {
        console.error(`Erro ao processar lista: ${error.message}`);
        res.status(500).json({ error: "Falha na resposta do catálogo" });
    }
});

// 2. DESCOBERTA INTELIGENTE POR GÊNERO (Focado em dublados e mercado BR)
app.get('/api/discover/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const response = await axios.get(`${BASE_URL}/discover/${type}`, {
            params: {
                ...DEFAULT_PARAMS,
                watch_region: 'BR',
                sort_by: 'popularity.desc',
                ...req.query // Pega filtros extras de gênero passados pelo front
            },
            ...AXIOS_CONFIG
        });
        
        const filtered = response.data.results?.filter(item => item.backdrop_path || item.poster_path) || [];
        res.json(filtered);
    } catch (error) {
        console.error(`Erro no modulo discover: ${error.message}`);
        res.status(500).json({ error: "Falha ao mapear gêneros" });
    }
});

// 3. CAPTURA DE METADADOS DA MÍDIA ESPECÍFICA
app.get('/api/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const response = await axios.get(`${BASE_URL}/${type}/${id}`, {
            params: DEFAULT_PARAMS,
            ...AXIOS_CONFIG
        });
        res.json(response.data);
    } catch (error) {
        console.error(`Erro nos detalhes da mídia ${id}: ${error.message}`);
        res.status(500).json({ error: "Erro ao requisitar metadados" });
    }
});

// 4. PESQUISA MULTI-GÊNERO
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const response = await axios.get(`${BASE_URL}/search/multi`, {
            params: { ...DEFAULT_PARAMS, query: query },
            ...AXIOS_CONFIG
        });

        const filtered = response.data.results.filter(item => 
            (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)
        );
        res.json(filtered);
    } catch (error) {
        console.error(`Erro na busca: ${error.message}`);
        res.status(500).json({ error: "Erro no serviço de pesquisas" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✓ Servidor Pureflix sincronizado com TMDB-BR na porta ${PORT}`));
