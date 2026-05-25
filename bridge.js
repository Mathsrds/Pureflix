require('dotenv').config();
    } catch (error) {
        console.error('Erro Search:', error.message);

        res.status(500).json({
            error: 'Erro na busca'
        });
    }
});

// =========================
// TRENDING
// =========================
app.get('/trending', async (req, res) => {
    try {
        const cacheKey = 'trending_day';

        if (cache.has(cacheKey)) {
            return res.json(cache.get(cacheKey));
        }

        const response = await api.get(`${TMDB_BASE}/trending/all/day`, {
            headers: {
                Authorization: `Bearer ${TMDB_TOKEN}`
            },
            params: {
                language: 'pt-BR'
            }
        });

        cache.set(cacheKey, response.data.results, 1800);

        res.json(response.data.results);
    } catch (error) {
        console.error('Erro Trending:', error.message);

        res.status(500).json([]);
    }
});

// =========================
// FALLBACK 404
// =========================
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada'
    });
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
    console.log(`Servidor Pureflix Ultra Pro rodando na porta ${PORT}`);
});
