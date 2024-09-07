import JsSIP from 'jssip';

// Replace with your FreePBX IP, WebSocket URL, and SIP account credentials
const websocketServer = 'ws://192.168.139.48:8088/ws'; // Replace <FreePBX-IP> with your FreePBX server IP
const sipUri = 'sip:213@192.168.139.48'; // Replace 101 with your SIP extension number
const sipUsername = '213'; // Replace with your SIP extension username
const sipPassword = '213'; // Replace with your SIP password

// Set up the SIP User Agent configuration
const socket = new JsSIP.WebSocketInterface(websocketServer);
const configuration = {
  sockets: [socket],
  uri: sipUri,
  password: sipPassword,
  realm: 'asterisk',
};

const userAgent = new JsSIP.UA(configuration);
let currentSession;

// Event listeners for the call buttons
document.getElementById('callButton').addEventListener('click', startCall);
document.getElementById('hangupButton').addEventListener('click', hangUp);

// Start the User Agent
userAgent.start();

// Function to handle incoming calls
userAgent.on('newRTCSession', (data) => {
  if (data.originator === 'remote') {
    currentSession = data.session;
    setupSessionHandlers(currentSession);
    currentSession.answer({
      mediaConstraints: { audio: true, video: true },
    });
  }
});

// Function to start an outgoing call
function startCall() {
  const target = 'sip:212@192.168.139.48'; // Replace with the target SIP URI (same as your SIP extension)
  const options = {
    mediaConstraints: { audio: true, video: true },
    rtcOfferConstraints: {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    },
  };

  currentSession = userAgent.call(target, options);
  setupSessionHandlers(currentSession);
}

// Function to end the current call
function hangUp() {
  if (currentSession) {
    currentSession.terminate();
  }
}

// Function to set up event handlers for the current session
function setupSessionHandlers(session) {
  session.on('connecting', () => {
    console.log('Connecting...');
    document.getElementById('callButton').disabled = true;
    document.getElementById('hangupButton').disabled = false;
  });

  session.on('accepted', () => {
    console.log('Call accepted');
  });

  session.on('peerconnection', (e) => {
    const peerConnection = e.peerconnection;
    peerConnection.addEventListener('track', (event) => {
      document.getElementById('remoteVideo').srcObject = event.streams[0];
    });
  });

  session.on('ended', () => {
    console.log('Call ended');
    document.getElementById('callButton').disabled = false;
    document.getElementById('hangupButton').disabled = true;
    currentSession = null;
  });

  session.on('failed', (e) => {
    console.error('Call failed:', e.cause, e.message, e.cause);
    document.getElementById('callButton').disabled = false;
    document.getElementById('hangupButton').disabled = true;
    currentSession = null;
  });
}
