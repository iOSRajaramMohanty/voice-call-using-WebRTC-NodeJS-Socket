// Creating the peer
//using Google public stun server 
var configuration = { 
  iceServers: [{ urls: "stun:stun.stunprotocol.org" }] 
};

var peer;
const createPeerInit = () => {
  peer = new RTCPeerConnection(configuration);
}
 
createPeerInit();

// Connecting to socket
var socket;
const connectToSocket = () => {
  socket = io(`http://localhost:3000`);//172.20.10.2//192.168.114.248//192.168.1.104
}

connectToSocket();

const onSocketConnected = async () => {
  console.log('onSocketConnected');
  const constraints = {
    audio: true,
    video: false
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // document.querySelector('#localAudio').srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
  } catch (error) {
    console.log(error);
  }
 
}

let callButton = document.querySelector('#call');
let callEndButton = document.querySelector('#callEnd');

// Handle call button
callButton.addEventListener('click', async () => {
  if (peer.signalingState === 'closed'){
      console.log(peer.signalingState);
      // createPeerInit();
      // socket.on('connect', handleSocketConnected);
      return;
  }

  sendNotification();
});

const makeCall = async () => {
  const localPeerOffer = await peer.createOffer();
  await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));
  console.log("callButton.addEventListener =====>",localPeerOffer);
  sendMediaOffer(localPeerOffer);
};

//Handle call end button
callEndButton.addEventListener('click', async () => {
  console.log("callEndButton");
  peer.close();
  handleLeave();
  sendHangUp();
});

//Handle notification
const sendNotification = () => {
  socket.emit('notification', {
    from: socket.id,
    to: selectedUser
  });
}

const actionOnNotification = (action) => {
  socket.emit('notification-action', action);
}


// Create media offer
socket.on('mediaOffer', async (data) => {
  await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
  const peerAnswer = await peer.createAnswer();
  await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));

  sendMediaAnswer(peerAnswer, data);
});

// Create media answer
socket.on('mediaAnswer', async (data) => {
  console.log(data);
  await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// ICE layer
peer.onicecandidate = (event) => {
  console.log("onicecandidate");
  sendIceCandidate(event);
}

socket.on('remotePeerIceCandidate', async (data) => {
  try {
    const candidate = new RTCIceCandidate(data.candidate);
    await peer.addIceCandidate(candidate);
  } catch (error) {
    // Handle error, this will be rejected very often
  }
})

peer.addEventListener('track', (event) => {
  console.log("addEventListener_Track");
  const [stream] = event.streams;
  document.querySelector('#remoteAudio').srcObject = stream;
})

let selectedUser;

const sendMediaAnswer = (peerAnswer, data) => {
  socket.emit('mediaAnswer', {
    answer: peerAnswer,
    from: socket.id,
    to: data.from
  })
}

const sendMediaOffer = (localPeerOffer) => {
  console.log("sendMediaOffer");
  console.log("sendMediaOffer - localPeerOffer",localPeerOffer);
  console.log("sendMediaOffer - socket.id",socket.id);
  console.log("sendMediaOffer - selectedUser",selectedUser);

  socket.emit('mediaOffer', {
    offer: localPeerOffer,
    from: socket.id,
    to: selectedUser
  });
};

const sendIceCandidate = (event) => {
  socket.emit('iceCandidate', {
    to: selectedUser,
    candidate: event.candidate,
  });
}

const sendHangUp = () => {
  socket.emit('hang-up');
};

const onUpdateUserList = ({ userIds }) => {
  const usersList = document.querySelector('#usersList');
  const usersToDisplay = userIds.filter(id => id !== socket.id);

  usersList.innerHTML = '';
  
  usersToDisplay.forEach(user => {
    const userItem = document.createElement('div');
    userItem.innerHTML = user;
    userItem.className = 'user-item';
    userItem.addEventListener('click', () => {
      const userElements = document.querySelectorAll('.user-item');
      userElements.forEach((element) => {
        element.classList.remove('user-item--touched');
      })
      userItem.classList.add('user-item--touched');
      selectedUser = user;
    });
    usersList.appendChild(userItem);
  });
};
socket.on('update-user-list', onUpdateUserList);

const handleSocketConnected = async () => {
  onSocketConnected();
  socket.emit('requestUserList');
};

socket.on('connect', handleSocketConnected);

const handleLeave = () => {
  console.log("handleLeave");
  location.reload();
};

socket.on('leave', handleLeave);

//Notification
const handleNotificationPayload = (payload) => {
  console.log("handleNotificationPayload");
  if (socket.id === payload.to){
    console.log("handleNotificationPayload", payload);
    if (confirm(`${payload.from} calling....`)) {
      console.log("You pressed OK!");
      actionOnNotification({
        from: payload.from,
        to: payload.to,
        actionType:'accept'
      })
    } else {
      console.log("You pressed Cancel!");
      actionOnNotification({
        from: payload.from,
        to: payload.to,
        actionType:'reject'
      })
    }
  }
};

socket.on('notification-payload', handleNotificationPayload);

const handleNotificationAction = (action) => {
  console.log("handleNotificationAction");
  if (socket.id === action.from){
    if (action.actionType === 'accept'){
      console.log("handleNotificationAction", action);
      makeCall();
    }
  }
};

socket.on('notification-broadcast-action', handleNotificationAction);

