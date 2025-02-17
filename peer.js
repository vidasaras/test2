const { ExpressPeerServer } = require('peer');
const express = require('express');
const app = express();
const server = app.listen(9000);
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use('/myapp', peerServer);

console.log('PeerJS server running on http://localhost:9000');
