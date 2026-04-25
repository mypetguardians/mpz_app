/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDMPEJwSDwlV7st46yAZzxLFKp1b2qMfrY",
  authDomain: "mypetguardians-a8ad3.firebaseapp.com",
  projectId: "mypetguardians-a8ad3",
  storageBucket: "mypetguardians-a8ad3.firebasestorage.app",
  messagingSenderId: "273159148866",
  appId: "1:273159148866:web:ccd09e378ab7cf15eee4db",
  measurementId: "G-Y43YDSQ7L0",
});

var messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || "마펫쯔";
  var options = {
    body: (payload.notification && payload.notification.body) || "",
    icon: "/img/op-image.png",
    badge: "/img/op-image.png",
    data: payload.data || {},
    tag: "mpz-notification",
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var actionUrl = event.notification.data && event.notification.data.action_url;
  var urlToOpen = actionUrl
    ? new URL(actionUrl, self.location.origin).href
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === urlToOpen && "focus" in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
