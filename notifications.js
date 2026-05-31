function addWatchLater(item){

  let list = JSON.parse(
    localStorage.getItem('watchLater') || '[]'
  );

  if(
    list.some(x=>x.id===item.id)
  ){
    alert('Já está salvo');
    return;
  }

  list.push({
    id:item.id,
    title:item.title,
    poster:item.poster,
    release:item.release_date,
    link:item.link
  });

  localStorage.setItem(
    'watchLater',
    JSON.stringify(list)
  );

  alert('Adicionado à Minha Lista');
}
