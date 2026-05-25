require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const NodeCache = require('node-cache');

const app = express();

const cache = new NodeCache({
  stdTTL: 3600
});

app.use(cors());
app.use(compression());
app.use(helmet());

const api = axios.create({
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`
  }
});

app.get('/trending', async(req,res)=>{
  try {

    if(cache.has('trending')) {
      return res.json(cache.get('trending'));
    }

    const response = await api.get(
      'https://api.themoviedb.org/3/trending/all/day?language=pt-BR'
    );

    cache.set('trending', response.data.results);

    res.json(response.data.results);

  } catch(err) {
    console.error(err.message);
    res.status(500).json([]);
  }
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log('Bridge online');
});
