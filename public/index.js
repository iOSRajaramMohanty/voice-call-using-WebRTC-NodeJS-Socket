// Creating the peer
//using Google public stun server 
let configuration = { 
  iceServers: [{ urls: "stun:stun.stunprotocol.org" }] 
};

let peer = null;
let dtmfSender = null;
let dialString = "12024561111";
let audioTracks = null;

const createPeerInit = async () => {
  peer = new RTCPeerConnection(configuration);
  
  const isAdded = await addTracks();
  if (isAdded){
    addAllEvents();
    return true;
  }
}

const addTracks = async () =>{
  const constraints = {
    audio: true,
    video: false
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    audioTracks = stream.getAudioTracks();
    // document.querySelector('#localAudio').srcObject = stream;
    audioTracks.forEach(track => peer.addTrack(track, stream));
    if (peer.getSenders) {
      dtmfSender = peer.getSenders()[0].dtmf;
    } else {
      console.log(
        "Your browser doesn't support RTCPeerConnection.getSenders(), so " +
          "falling back to use <strong>deprecated</strong> createDTMFSender() " +
          "instead.",
      );
      dtmfSender = peer.createDTMFSender(audioTracks[0]);
    }
    dtmfSender.ontonechange = handleToneChangeEvent;
    return true;
  } catch (error) {
    console.log(error);
  }
};
 
function handleToneChangeEvent(event) {
  if (event.tone !== "") {
    console.log(`Tone played: ${event.tone}`);
  }else{
    peer.getLocalStreams().forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });
  }
}

// Connecting to socket
var socket;
const connectToSocket = () => {
  socket = io(`http://localhost:3000`);//172.20.10.2//192.168.114.248//192.168.1.104
}

connectToSocket();

const onSocketConnected = async () => {
  console.log('onSocketConnected');
}

let callButton = document.querySelector('#call');
let callEndButton = document.querySelector('#callEnd');

let createOfferBtn = document.querySelector('#createOffer');
let createAnswerBtn = document.querySelector('#createAnswer');
let makeConnectionBtn = document.querySelector('#connect');

let createOfferSDPTextArea = document.querySelector('#createOfferSDP');
let createAnswerSDPTextArea = document.querySelector('#createAnswerSDP');

let selectedUser;

// Handle call button
callButton.addEventListener('click', async () => {
  // if (peer.signalingState === 'closed'){
  //     console.log(peer.signalingState);
  //     // createPeerInit();
  //     // socket.on('connect', handleSocketConnected);
  //     return;
  // }

  if (selectedUser){
    makeCall();
  }
});

createOfferBtn.addEventListener('click', async () => {
  console.log("createOfferBtn");
  const localPeerOffer = await createOffer();
  createOfferSDPTextArea.value = localPeerOffer;
  createOfferSDPTextArea.readOnly = true;
});

createAnswerBtn.addEventListener('click', async () => {
  const offerSDP = createOfferSDPTextArea.value;
  const offerSDPJson = {
    offer:offerSDP
  }
  const answerSDP = await createAnswerSdp(offerSDPJson);
  createAnswerSDPTextArea.value = answerSDP;
  createAnswerSDPTextArea.readOnly = true;
});

makeConnectionBtn.addEventListener('click', async () => {
  const answerSDP = createAnswerSDPTextArea.value;
  const answerSDPJson = {
    answer:answerSDP
  }
  await setMediaAnswer(answerSDPJson);
});

createPeerInit();

let offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
};

const makeCall = async () => {
  //
  console.log("makeCall");
  // const isInit = await createPeerInit();
  // if (isInit){
    onicecandidate();
    const offerSdp = await createOffer();
    sendMediaOffer(offerSdp);
  // }
};

const createOffer = async () => {
  const localPeerOffer = await peer.createOffer();
  await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));
  console.log("localPeerOffer =====>",localPeerOffer.sdp);
  return localPeerOffer.sdp;
}

//Handle call end button
callEndButton.addEventListener('click', async () => {
  console.log("callEndButton");
  handleLeave();
  sendHangUp();
});

function stopStreamedAudio(audioElem) {
  const stream = audioElem.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach((track) => {
    track.stop();
  });

  audioElem.srcObject = null;
}

const acceptMediaOffer = async (data) => {
  console.log("acceptMediaOffer");
  // const isInit = await createPeerInit();
  // if (isInit){
    const answerSdp = await createAnswerSdp(data);
    sendMediaAnswer(answerSdp, data);
  // }

};

const createAnswerSdp = async (data) =>{
  const offerJson = {
    type:'offer',
    sdp:`${data.offer}`
  }
  console.log("offerJson ====>",offerJson);
  await peer.setRemoteDescription(new RTCSessionDescription(offerJson));
  const peerAnswer = await peer.createAnswer();
  console.log("peerAnswer =====>",peerAnswer.sdp);
  await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));
  return peerAnswer.sdp;
}

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

// ICE layer
const onicecandidate = () => {
  peer.onicecandidate = (event) => {
    console.log("onicecandidate",event);
    sendIceCandidate(event);
  }
}

const addAllEvents = () => {
  
  peer.addEventListener('track', (event) => {
    console.log("addEventListener_Track",event.streams);
    const [stream] = event.streams;
    document.querySelector('#remoteAudio').srcObject = stream;
  })

  peer.addEventListener("iceconnectionstatechange", (event) => {
    console.log("addEventListener_iceconnectionstatechange", peer.iceConnectionState);
    if (peer.iceConnectionState === "failed") {
      /* possibly reconfigure the connection in some way here */
      /* then request ICE restart */
      peer.restartIce();
    }
    if (peer.iceConnectionState === "connected") {
      console.log(`Sending DTMF: "${dialString}"`);
      if(dtmfSender.canInsertDTMF){
        dtmfSender.insertDTMF(dialString, 400, 50);
      }
    }
  });
}

//
//Handle socket request
//

// Create media answer
const setMediaAnswer = async (data) => {
  const answerJson = {
    type:'answer',
    sdp:`${data.answer}`
  }
  await peer.setRemoteDescription(new RTCSessionDescription(answerJson));
};

socket.on('mediaAnswer', async (data) => {
  console.log("mediaAnswer ===>",data);
  // await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
  setMediaAnswer(data);
});

// Create media offer
socket.on('mediaOffer', async (data) => {
  handleNotificationPayload(data);
});

const handleIceCandidate = async (data) => {
  console.log("remotePeerIceCandidate",data);
  try {
    const candidate = new RTCIceCandidate(data.candidate);
    await peer.addIceCandidate(candidate);
  } catch (error) {
    console.log(error);
    // Handle error, this will be rejected very often
  }
};

socket.on('remotePeerIceCandidate', async (data) => {
  handleIceCandidate(data)
})

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
  console.log("handleSocketConnected");
  onSocketConnected();
  socket.emit('requestUserList');
};

socket.on('connect', handleSocketConnected);

const handleLeave = () => {
  console.log("handleLeave");
  peer.close();
  peer = null;
  document.querySelector('#remoteAudio').srcObject = null;
  location.reload();
  // stopStreamedAudio(document.querySelector('#remoteAudio'));
};

socket.on('leave', handleLeave);

//Handle notification
const handleNotificationPayload = (payload) => {
  console.log("handleNotificationPayload");
  if (socket.id === payload.to){
    console.log("handleNotificationPayload", payload.offer);
    if (confirm(`${payload.from} calling....`)) {
      console.log("You pressed OK!");
      acceptMediaOffer(payload);
    } else {
      console.log("You pressed Cancel!");
    }
  }
};


