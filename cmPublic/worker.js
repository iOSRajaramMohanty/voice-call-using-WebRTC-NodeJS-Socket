console.log("Service worker loaded...");

self.addEventListener('post', function(e) {
    const data = e.data.json();
    console.log(data);
    // self.registration.showNotification(
    //     data.title,
    //     {
    //         body: data.body,
    //     }
    // );
})

self.addEventListener("message", (event) => {
    console.log(`Message received: ${event.data}`);
  });