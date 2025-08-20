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
    if(data.type == 'BLOCKCHAIN')
      this.handleBlockchain(data.chain);
    if(data.type == 'BLOCK')
      this.handleNewBlock(data.block);
  }

  handleBlockchain(recievedChain) {
    if(recievedChain.length > this.blockchain.chain.length)
      this.blockchain.chain = recievedChain;
  }

  handleNewBlock(newBlock){
    const latestBlock = this.blockchain.chain[this.blockchain.chain.lenght -1]
    if(newBlock.index == latestBlock.index){
      if(newBlock.previousHash == latestBlock.hash){
        const data = newBlock.index + newBlock.timestamp + newBlock.transactionSet + newBlock.previousHash + newBlock.salt + newBlock.difficulty;
        const newBlockHash = crypto.createHash('sha256').update(data).digest('hex');
        if(newBlock.hash == newBlockHash){
          this.blockchain.chain.push(newBlock);

          this.broadcast({ type: 'BLOCK', block: newBlock });
        }
      }
    }
  }
  broadcast(){

  }
}

module.exports = PeerNetwork;