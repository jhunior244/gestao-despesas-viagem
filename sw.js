//instala e carrega os arquivos da aplicação para o cache
self.addEventListener('install', function (event) {
    caches.open('pwa-1.0').then(function(cache) {
        cache.addAll([
            '/',
            '/index.html',
            '/cadastro.html',
            '/economizei.js',
            '/estilos.css',
            '/assets/add.png',
            '/assets/arrow-point-to-right.png',
            '/assets/left-arrow.png',
            '/assets/delete.png'
        ])
    });
})

//serve os arquivos do cache quando existem, caso contrário busca o recurso na web
self.addEventListener('fetch', function(event) {
    let resposta = caches.open('pwa-1.0').then(function(cache) {
        return cache.match(event.request).then(function(recurso) {
            if(recurso){
                return recurso;
            } else {
                return fetch(event.request).then(function(recurso) {
                    cache.put(event.request, recurso.clone());
                    return recurso;
                });
            }
        });
    });
});
