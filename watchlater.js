function getWatchList(){
  return JSON.parse(
    localStorage.getItem("watchLater") || "[]"
  );
}

function saveWatchList(list){
  localStorage.setItem(
    "watchLater",
    JSON.stringify(list)
  );
}

function removeWatch(id){

  let list = getWatchList();

  list = list.filter(
    item => item.id !== id
  );

  saveWatchList(list);

  renderWatchList();
}

function renderWatchList(){

  const container =
    document.getElementById("watchlist");

  if(!container) return;

  const list = getWatchList();

  container.innerHTML = "";

  if(list.length === 0){

    container.innerHTML = `
      <h2>Nenhum título salvo</h2>
    `;

    return;
  }

  list.forEach(item=>{

    container.innerHTML += `
      <div class="card">

        <img src="${item.poster}">

        <div class="info">

          <h3>${item.title}</h3>

          <div class="countdown">
            ${item.release || "Sem data"}
          </div>

          <div class="actions">

            <button
              class="btn watch"
              onclick="watchNow('${item.link}')">
              Assistir
            </button>

            <button
              class="btn remove"
              onclick="removeWatch(${item.id})">
              Remover
            </button>

          </div>

        </div>

      </div>
    `;
  });
}

function watchNow(url){

  location.href = url;
}

renderWatchList();
