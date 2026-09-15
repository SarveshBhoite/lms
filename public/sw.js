// JVM Institute LMS - Service Worker for Mobile & Desktop Web Push Notifications

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'JVM Institute',
        message: event.data.text() || 'You have a new notification',
        actionUrl: '/notifications'
      };
    }
  } else {
    data = {
      title: 'JVM Institute Alert',
      message: 'You have a new update in JVM LMS.',
      actionUrl: '/notifications'
    };
  }

  const title = data.title || 'JVM Institute';
  const options = {
    body: data.message || data.body || 'You have a new update in JVM LMS.',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'jvm-' + Date.now(),
    data: {
      url: data.actionUrl || data.url || '/notifications',
      timestamp: Date.now()
    },
    vibrate: [100, 50, 100],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          if (targetUrl && client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});
