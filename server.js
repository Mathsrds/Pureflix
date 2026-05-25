const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// SUAS CHAVES DO TMDB CONFIGURADAS COM SUCESSO
const TMDB_API_KEY = '59ff19f0c822abdfb0c3b41bfd6b92b0';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWZmMTlmMGM4MjJhYmRmYjBjM2I0MWJmZDZiOTJiMCIsIm5iZiI6MTc3OTcxNTY2Ni41NzEsInN1YiI6IjZhMTQ0ZTUyODM4ZGNiYzhmNDAyZDY5MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pFS9ydcOA40ekPL09mC8DiNns6RK_j26KrRIGAt1HCg';

const BASE_URL = 'https://api.themoviedb.org/3';

// Parâmetros para forçar áudio/dados em Português e relevância no Brasil (BR)
const DEFAULT_PARAMS = {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
    region: 'BR',
    include_adult: false
};

// Configuração dos cabeçalhos usando o seu Token de Leitura
const AXIOS_CONFIG = {
    headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        accept: 'application/json'
    }
};

// 1. CARROSSEIS E ENDPOINTS GERAIS DO TMDB (Filmes em Cartaz, Populares, Séries Populares, etc)
app.get('/tmdb/:type/:endpoint', async (req, res) => {
    try {
        const { type, endpoint } = req.params; // ex: movie/popular ou movie/now_playing
        const response = await axios.get(`${BASE_URL}/${type}/${endpoint}`, {
            params: DEFAULT_PARAMS,
            ...AXIOS_CONFIG
        });
        
        // Filtra para garantir que apenas venham títulos com imagens e sinopses preenchidas em PT-BR
        const filtered = response.data.results.filter(item => item.backdrop_path && item.overview);
        res.json(filtered);
    } catch (error) {
        console.error(`Erro ao buscar tmdb/${req.params.type}/${req.params.endpoint}:`, error.message);
        res.status(500).json({ error: "Erro na API do TMDB" });
    }
});

// 2. DISCOVER POR GÊNERO (Ação, Comédia, Animes, Terror, Suspense, Documentários)
app.get('/discover/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const queryParams = req.query; // Pega o with_genres enviado pelo javascript
        
        const response = await axios.get(`${BASE_URL}/discover/${type}`, {
            params: {
                ...DEFAULT_PARAMS,
                watch_region: 'BR',
                with_original_language: 'pt|en|es|ja', // Prioriza Brasil, EUA/Inglês e Japonês (para Animes)
                ...queryParams
            },
            ...AXIOS_CONFIG
        });
        res.json(response.data.results);
    } catch (error) {
        console.error("Erro no discover:", error.message);
        res.status(500).json({ error: "Erro ao descobrir conteúdos" });
    }
});

// 3. BUSCA MULTI TRADUZIDA (Input de pesquisa)
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

// 4. DETALHES DE UMA MÍDIA ESPECÍFICA (Sincronizado perfeitamente com /tmdb/:type/:id para abrir o Player)
app.get('/tmdb/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        // Evita conflito se o frontend chamar 'popular' ou 'now_playing' acidentalmente aqui
        if (id === 'popular' || id === 'now_playing' || id === 'top_rated') return;

        const response = await axios.get(`${BASE_URL}/${type}/${id}`, {
            params: DEFAULT_PARAMS,
            ...AXIOS_CONFIG
        });
        res.json(response.data);
    } catch (error) {
        console.error(`Erro ao buscar detalhes da mídia ${req.params.id}:`, error.message);
        res.status(500).json({ error: "Erro ao carregar metadados" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✓ Pureflix Backend rodando com segurança total na porta ${PORT}`));
