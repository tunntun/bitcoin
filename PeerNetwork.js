const cli = require('nodemon/lib/cli');
const WebSocket = require('ws');

class PeerNetwork {
  constructor(blockchain, port){
    this.blockchain = blockchain;
    this.sockets = [];
    this.port = port;
  }
  startServer() {
    const server = new WebSocket.Server({ port: this.port });
    server.on('connection', (ws) => {
      this.initSocket(ws)
    });
    console.log(`Server running on prot ${this.port}`);
  }

  connectToPeer (peerUrl) {
    const client = new WebSocket(peerUrl);

    client.on('open', () => {
      console.log(`Connected to peer: ${peerUrl}`);
      this.initSocket(client);
    });
    client.on('error', (err) => {
      console.log('connection_error');
    });
  }

  initSocket(ws){
    this.sockets.push(ws);

    ws.on('message', (message) => {
      console.log(message.toString());
    });
    ws.on('close', ()=> {
      console.log(`peer disconnected: ${ws}`)
      this.sockets = this.sockets.filter(s => s !== ws);
    });
  }
}

module.exports = PeerNetwork;