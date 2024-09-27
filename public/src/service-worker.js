const CACHE_NAME = 'pwa-cache-v2';
const OFFLINE_URL = 'offline.html';

// Liste des fichiers à mettre en cache, y compris le fichier offline.html
const assetsToCache = [
    '/',
    // '/index.html',
    // '/offline.html',
    // '/styles.css', // Si tu as des fichiers CSS/JS
    // '/main.js',
    // '/images/logo.png'
];

// Installation du service worker et mise en cache des fichiers
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Fichiers mis en cache :');
            return cache.addAll(assetsToCache);
        })
    );

    // console.log({clients: self.clients});

     // Force le nouveau service worker à prendre le contrôle immédiatement
    //  self.skipWaiting();

});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Si la requête échoue (par exemple, l'utilisateur est hors ligne), on sert offline.html
                    return caches.match(OFFLINE_URL);
                })
        );
    }
});

// Mise à jour du cache et suppression des anciennes versions
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
