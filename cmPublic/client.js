const serverPublicVapidKey = "BC9Yya9_24Iw0u2f9wkbq6ViOdkFuFlwEM3oG_pNkGT8BOIXf-vD1VkhIp9VSUpbSfI_hohHXD1ygXa59BFELUE";

if('serviceWorker' in navigator) {
  console.log("serviceWorker");
  registerServiceWorker().catch(console.log)
}

async function registerServiceWorker() {
  console.log("registerServiceWorker");
  navigator.serviceWorker.register('./worker.js', {
      scope: '/'
  }).then(
    (registration) => {
      console.log("Service worker registration succeeded:", registration);
      registration.update();
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: serverPublicVapidKey,
    }).then( (subscription) =>{
      postSubscriber(subscription);
    });
    },
    (error) => {
      console.error(`Service worker registration failed: ${error}`);
    },
  );
}

const postSubscriber = async (subscription) => {
  await fetch("/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
        "Content-Type": "application/json",
    }
})
}


























// const apiUrl = 'http://localhost:3000/tocken';
// const apiUrl1 = 'http://localhost:3000/allTocken';

// const requestOptions = {
//   method: 'GET',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// };

// fetch(apiUrl, requestOptions)
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     // console.log("tocken =====", response.json());
//     return response.json();
//   })
//   .then(data => {
//     const tocken = data.tocken;
//     console.log("tocken =====", tocken);
//   })
//   .catch(error => {
//     console.error

// ('Error:', error);
//   });


// fetch(apiUrl1, requestOptions)
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     // console.log("tocken =====", response.json());
//     return response.json();
//   })
//   .then(data => {
//     const tocken = data.all_tocken;
//     console.log("tocken =====", tocken);
//   })
//   .catch(error => {
//     console.error

// 	('Error:', error);
// 	});
