//***************
// Public Key:
// BC9Yya9_24Iw0u2f9wkbq6ViOdkFuFlwEM3oG_pNkGT8BOIXf-vD1VkhIp9VSUpbSfI_hohHXD1ygXa59BFELUE

// Private Key:
// ep99hyoAgtwFY-PCmdirwdbF_CVJTX2SbBCkMUoOQwk
//********************/


const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');
const requestIp = require('ip');
const app = express();

const http = require('http').createServer(app);

let connectedUsers = [];
const port = 5100

// Use body parser which we will use to parse request body that sending from client.
app.use(bodyParser.json());
app.use(express.json())

// We will store our client index in ./cmPublic directory.
app.use(express.static(path.join(__dirname, '../cmPublic')));

// app.use('/tocken', require('./routes/apis/audioCall'));

const publicVapidKey = "BC9Yya9_24Iw0u2f9wkbq6ViOdkFuFlwEM3oG_pNkGT8BOIXf-vD1VkhIp9VSUpbSfI_hohHXD1ygXa59BFELUE";

const privateVapidKey = "ep99hyoAgtwFY-PCmdirwdbF_CVJTX2SbBCkMUoOQwk";


// Setup the public and private VAPID keys to web-push library.
webpush.setVapidDetails("mailto:test@test.com", publicVapidKey, privateVapidKey);

// Create route for allow client to subscribe to push notification.
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    connectedUsers.push(subscription);
    console.log(connectedUsers);
    res.status(201).json({});
    // const payload = JSON.stringify({ title: "Hello World", body: "This is your first push notification", silent: true });
    setTimeout(() => {
      console.log("sending......");
      const payload = JSON.stringify({ title: "Hello World", body: "This is your first push notification" });
      webpush.sendNotification(subscription, payload).catch(console.log);
    }, 1);
    
})

http.listen(process.env.PORT || port, () => {
    console.log(`listening on ${requestIp.address()}:${port}`);
  });