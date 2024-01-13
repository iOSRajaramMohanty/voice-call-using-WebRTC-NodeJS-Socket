const express = require('express');
const path = require('path');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3000

const requestIp = require('ip');

app.use(express.static(path.join(__dirname, '../public')));

console.log(requestIp.address());

// const port = process.env.NODE_ENV;
// console.log(`Your port is ${port}`);
// const dotenv = require('dotenv');
// dotenv.config();
// console.log(`Your port is ${process.env.NODE_ENV}`);

let connectedUsers = [];

io.on('connection', socket => {
  console.log("connection");
  connectedUsers.push(socket.id);

  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter(user => user !== socket.id)
    socket.broadcast.emit('update-user-list', { userIds: connectedUsers })
  })

  socket.on('hang-up', () => {
    socket.broadcast.emit('leave')
  })
  
  socket.on('mediaOffer', data => {
    console.log("mediaOffer");
    socket.to(data.to).emit('mediaOffer', {
      from: data.from,
      to:data.to,
      offer: data.offer
    });
  });
  
  socket.on('mediaAnswer', data => {
    console.log("mediaAnswer");
    socket.to(data.to).emit('mediaAnswer', {
      from: data.from,
      answer: data.answer
    });
  });

  socket.on('iceCandidate', data => {
    console.log("iceCandidate");
    socket.to(data.to).emit('remotePeerIceCandidate', {
      candidate: data.candidate
    })
  })

  socket.on('requestUserList', () => {
    socket.emit('update-user-list', { userIds: connectedUsers });
    socket.broadcast.emit('update-user-list', { userIds: connectedUsers });
  });
});

http.listen(process.env.PORT || port, () => {
  console.log(`listening on ${requestIp.address()}:3000`);
});

