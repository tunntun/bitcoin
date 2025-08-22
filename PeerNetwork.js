const cli = require('nodemon/lib/cli');
const crypto = require('crypto');
const WebSocket = require('ws');


class PeerNetwork {
  constructor(blockchain, port){
    this.blockchain = blockchain;
    this.sockets = []; //the ws servers that I have a connection.
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
      const data = JSON.parse(message.toString());
      this.handleMessages(ws, data);
    });
    ws.on('close', ()=> {
      console.log(`peer disconnected: ${ws}`)
      this.sockets = this.sockets.filter(s => s !== ws);
    });
  }
  handleMessages(ws, data){
    if(data.type == 'SEND_CHAIN'){
      this.handleBlockchain(data.chain);
    }

    if(this.type == 'GET_BLOCKCHAIN') {
      this._send(ws, {  type: 'SEND_BLOCKCHAIN', chain: this.blockchain  });
    }

    if(data.type == 'BLOCK'){
      this.handleNewBlock(data.block);
    }
  }

  handleBlockchain(recievedBlockchain) {
    if (!this.isValidChain(recievedBlockchain))
      return false;
    if(recievedBlockchain.chain.length <= this.blockchain.chain.length)
      return false;

    this.blockchain = recievedBlockchain;
  }

  isValidChain(blockchain) {
    if(JSON.stringify(blockchain.chain[0]) !== this.createGenesisBlock())
      return false;

    for (let i = 1; i < chain.length; i++) {
    const prev = chain[i-1];
    const curr = chain[i];
    if (curr.previousHash !== prev.hash) return false;
    if (!curr.hash.startsWith('0'.repeat(curr.difficulty))) return false;
    }
    return true;
  }

  handleNewBlock(newBlock){
    // TODO: buraya seen hash parametresi ekle ki sonsuza kadar echo yapmayalım
    const latestBlock = this.blockchain.chain[this.blockchain.chain.length -1]

    if(newBlock.index >= latestBlock.index + 1 && newBlock.previousHash == latestBlock.hash){
      const data = newBlock.index + newBlock.timestamp +  JSON.stringify(newBlock.transactionSet) + newBlock.previousHash + newBlock.salt + newBlock.difficulty;
      const newBlockHash = crypto.createHash('sha256').update(data).digest('hex');
      if(newBlock.hash == newBlockHash){
        this.blockchain.chain.push(newBlock);
        this.broadcast({ type: 'BLOCK', block: newBlock });
      }
    }
    else if(newBlock.index > latestBlock + 1){
      this._send(ws, { type: 'GET_BLOCKCHAIN'})
    }
  }

  broadcast(data){
    const stringData = JSON.stringify(data);

     this.sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringData);
      }
  });
  }
}

module.exports = PeerNetwork;