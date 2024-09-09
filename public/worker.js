console.log("Service Worker Loaded , server");
self.addEventListener('push', e => {
    const data = e.data.json();
    console.log("Push Received...");
    self.registration.showNotification(data.title, {
        body: data.content,
        icon: 'https://react-leaflet.js.org/img/logo.svg'
    });
    console.log(e);
});