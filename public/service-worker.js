const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/index.js",
    "/manifest.webmanifest",
    "/db.js",
    "/icon-192x192.png",
    "/icon-512x512.png",
  ];
  
  const CACHE_NAME = "static-cache-v2";
  const DATA_CACHE_NAME = "data-cache-v1";
  
  // install
  self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  
  // fetch
  self.addEventListener("fetch", function(evt) {
    // Will will be using TWO different approaches to handling requests.
    // Therefore, a conditional is required to determine how to handle a request.
  
    // #1: Handle requests for frequently changing data by checking if the route
    // contains "/api".
    if (evt.request.url.includes("/api/")) {
      // Implement Network falling back to the cache pattern. (See
      // https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker#network_falling_back_to_the_cache)
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    // #2: Handle requests for static items. (html, css, js, etc)
    // Implement "offline-first" pattern. (aka "cache falling back to network";
    // see
    // https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network)
    evt.respondWith(
      caches.match(evt.request).then(function(response) {
        return response || fetch(evt.request);
      })
    );
  });
  