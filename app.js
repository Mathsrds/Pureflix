const BRIDGE_URL = 'COLOQUE_AQUI_SEU_BACKEND';

const grid = document.getElementById('movie-grid');

async function fetchTrending() {
  try {
    const res = await fetch(`${BRIDGE_URL}/trending`);
    const data = await res.json();

    if(data.length) {
      const hero = data[0];

      document.getElementById('hero-banner').style.backgroundImage =
        `url(https://image.tmdb.org/t/p/original${hero.backdrop_path})`;

      document.getElementById('hero-title').innerText =
        hero.title || hero.name;

      document.getElementById('hero-desc').innerText =
        hero.overview;
    }

    renderGrid(data);

  } catch(err) {
    console.error(err);
  }
}

function renderGrid(items) {
  grid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');

    card.className = 'movie-card';

    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${item.poster_path}">
    `;

    grid.appendChild(card);
  });
}

fetchTrending();
