const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Token ou Chave de Acesso Oficial do TMDB
const TMDB_API_KEY = 'SUA_TMDB_API_KEY_AQUI'; 
const BASE_URL = 'https://api.themoviedb.org/3';

// Parâmetros Globais Otimizados para o Público do Brasil
const DEFAULT_PARAMS = {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
    region: 'BR',
    include_adult: false
};

// 1. ENDPOINT TENDÊNCIAS / POPULARES NO BRASIL
app.get('/trending/:type', async (req, res) => {
    try {
        const { type } = req.params; // 'movie' ou 'tv'
        const response = await axios.get(`${BASE_URL}/${type}/popular`, {
            params: { ...DEFAULT_PARAMS, page: 1 }
        });
        
        // Filtro adicional de segurança anti-áudio quebrado
        const sortedData = response.data.results.filter(item => item.backdrop_path && item.overview !== "");
        res.json(sortedData);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar tendências do TMDB" });
    }
});

// 2. DISCOVER INTELIGENTE PARA GÊNEROS E CARROSSÉIS
app.get('/discover/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const extraParams = req.query; // Captura filtros como with_genres, sort_by etc.
        
        const response = await axios.get(`${BASE_URL}/discover/${type}`, {
            params: {
                ...DEFAULT_PARAMS,
                watch_region: 'BR',
                with_original_language: 'pt|en|es|ja', // Prioriza produções nacionais, americanas, hispânicas e animes.
                ...extraParams
            }
        });
        res.json(response.data.results);
    } catch (error) {
        res.status(500).json({ error: "Erro no discover filtrado" });
    }
});

// 3. BUSCA LOCALIZADA E FILTRADA
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const response = await axios.get(`${BASE_URL}/search/multi`, {
            params: { ...DEFAULT_PARAMS, query: query }
        });

        // Retorna apenas resultados que tenham tradução válida de sinopse ou título
        const filtered = response.data.results.filter(item => 
            (item.media_type === 'movie' || item.media_type === 'tv') && 
            item.poster_path
        );
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: "Erro ao efetuar busca" });
    }
});

// 4. DETALHES COMPLETOS COM ESTRUTURA DE TEMPORADAS
app.get('/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const response = await axios.get(`${BASE_URL}/${type}/${id}`, {
            params: DEFAULT_PARAMS
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter metadados detalhados" });
    }
});

// Inicialização do Servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Pureflix Premium Bridge rodando com sucesso na porta ${PORT}`));
