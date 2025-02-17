const peer = new Peer(undefined, {
    host: 'localhost', // or your public peer server
    port: 9000,
    path: '/myapp',
    config: {
        iceServers: [
            // Free public STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            
            // Add your TURN server configuration here
            {
                urls: 'turn:relay1.expressturn.com:3478',
                username: 'efG6M92LYZP7AI2JLK',
                credential: 'hkGtD6CFb4bLshhT'
            }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all'
    },
    debug: true
});

let localStream;
let currentCall = null;
navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
if (navigator.getUserMedia) {
    navigator.getUserMedia(
        { audio: true, video: false },
        (stream) => {
            localStream = stream;
            const localAudio = document.getElementById('localAudio');
            localAudio.srcObject = stream;

            // Ensure the stream is active
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                console.log('Audio track is active:', audioTrack.readyState === 'live');
                audioTrack.onmute = () => console.warn('Audio track is muted!');
                audioTrack.onunmute = () => console.log('Audio track is unmuted.');
            }
        },
        (err) => {
            console.error(`The following error occurred: ${err.name}`);
        },
    );
} else {
    console.log("getUserMedia not supported");
}

// Display the peer's ID
peer.on('open', (id) => {
    document.getElementById('peerId').textContent = id;
});

// Call another peer
function makeCall() {
    const peerIdToCall = document.getElementById('callPeerId').value;
    if (!peerIdToCall) return;

    currentCall = peer.call(peerIdToCall, localStream);

    currentCall.peerConnection.oniceconnectionstatechange = () => {
        const state = currentCall.peerConnection.iceConnectionState;
        console.log('ICE connection state:', state);
        
        if (state === 'failed') {
            console.log('ICE connection failed. Attempting restart...');
            currentCall.peerConnection.restartIce();
        }
    };

    currentCall.on('stream', (remoteStream) => {
        console.log('Remote stream received:', remoteStream);
        const remoteAudio = document.getElementById('remoteAudio');
        remoteAudio.srcObject = remoteStream;

        // Ensure the remote audio plays
        remoteAudio.play().catch(error => {
            console.error('Error playing remote audio:', error);
        });

        // Log remote audio track details
        const remoteAudioTrack = remoteStream.getAudioTracks()[0];
        if (remoteAudioTrack) {
            console.log('Remote audio track is active:', remoteAudioTrack.readyState === 'live');
            remoteAudioTrack.onmute = () => console.warn('Remote audio track is muted!');
            remoteAudioTrack.onunmute = () => console.log('Remote audio track is unmuted.');
        } else {
            console.warn('No remote audio track found in the stream.');
        }
    });

    currentCall.on('error', (err) => {
        console.error('Call error:', err);
    });
}

// Handle incoming calls
peer.on('call', (incomingCall) => {
    console.log('Incoming call from:', incomingCall.peer);
    document.getElementById('answerButton').style.display = 'inline-block';

    incomingCall.answer(localStream); // Respond with your local stream
    currentCall = incomingCall;
    incomingCall.peerConnection.oniceconnectionstatechange = () => {
        const state = incomingCall.peerConnection.iceConnectionState;
        console.log('ICE connection state:', state);
        
        if (state === 'failed') {
            console.log('ICE connection failed. Attempting restart...');
            incomingCall.peerConnection.restartIce();
        }
    };

    // Log ICE candidates for debugging
    incomingCall.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('New ICE candidate:', event.candidate.type);
        }
    };

    currentCall.on('stream', (remoteStream) => {
        console.log('Remote stream received:', remoteStream);
        const remoteAudio = document.getElementById('remoteAudio');
        remoteAudio.srcObject = remoteStream;

        // Ensure the remote audio plays
        remoteAudio.play().catch(error => {
            console.error('Error playing remote audio:', error);
        });

        // Log remote audio track details
        const remoteAudioTrack = remoteStream.getAudioTracks()[0];
        if (remoteAudioTrack) {
            console.log('Remote audio track is active:', remoteAudioTrack.readyState === 'live');
            remoteAudioTrack.onmute = () => console.warn('Remote audio track is muted!');
            remoteAudioTrack.onunmute = () => console.log('Remote audio track is unmuted.');
        } else {
            console.warn('No remote audio track found in the stream.');
        }
    });

    currentCall.on('error', (err) => {
        console.error('Incoming call error:', err);
    });
});

// Answer an incoming call
function answerCall() {
    if (currentCall) {
        currentCall.answer(localStream);
        document.getElementById('answerButton').style.display = 'none';
    }
}

// Error handling
peer.on('error', (err) => {
    console.error('PeerJS error:', err);
});
