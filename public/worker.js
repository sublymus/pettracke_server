console.log("Service Worker Loaded , server");
self.addEventListener('push', e => {
    const data = e.data.json();
    console.log("Push Received...");
    self.registration.showNotification(data.title, {
        body: data.content,
        sound: 'http://localhost:3333/src/res/level-up-191997.mp3',
        icon: '/src/res/dog-area.png',
        actions: [
            {
                action: 'open',
                title: 'Open App'
            }
        ]
    });
    console.log(e);
});

self.addEventListener('notificationclick', (event) => {

    console.log('notifaction ==> ', event);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {

            console.log('clientList ==> ', clientList);
            if (clientList.length > 0) {
                // Si une fenêtre est ouverte, joue le son
                clientList[0].focus();
                clientList[0].postMessage({ action: 'playSound' });
            } else {
                // Sinon, ouvre une nouvelle fenêtre
                clients.openWindow('/').then((windowClient) => {
                    windowClient.postMessage({ action: 'playSound' });
                });
            }
        })
    );
});
