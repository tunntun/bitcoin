const cli = require('nodemon/lib/cli');
const crypto = require('crypto');
const WebSocket = require('ws');


class PeerNetwork {
  constructor(blockchain, port){
    this.blockchain = blockchain;
    this.sockets = []; //the ws servers that I have a connection.
    this.port = port;
    this.seenBlocks = new Set();
    this.isSynced = false;
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

    ws.send(JSON.stringify( { type: 'HELLO', port: this.port  } ));

    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());
      this.handleMessages(ws, data);
    });
    ws.on('close', ()=> {
      this.sockets = this.sockets.filter(s => s !== ws);
      console.log(`[${this.port}] peer disconnected. Current peers: ${this.sockets.length}`);
    });
  }

  _send(ws, msg) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      // attach who we are so peers can identify the sender
      const payload = { ...msg, from: this.port };
      ws.send(JSON.stringify(payload));
      console.log(`[${this.port}] SENT ${msg.type} to ${ws.peerPort || 'peer'}`);
    } else {
      console.log(`[${this.port}] tried to send to a closed socket`);
    }
  } catch (err) {
    console.error(`[${this.port}] error sending ${msg.type}:`, err.message);
  }
}

  waitUntilReady(timeoutMs = 2000) {
    return new Promise((resolve) => {
      const check = () => this.isSynced ? resolve(true) : setTimeout(check, 50);
      setTimeout(() => {
        if (!this.isSynced) this.isSynced = true;
      }, timeoutMs);
      check();
    });
  }
  handleMessages(ws, data){
    if (data.type === "HELLO") {
      ws.peerPort = data.port;
      ws.send(JSON.stringify({ type: 'GET_BLOCKCHAIN' }));
      console.log(`[${this.port}] HELLO from peer ${ws.peerPort}`);
      setTimeout(() => { if (!this.isSynced) this.isSynced = true; }, 1500);
    }

    if(data.type == 'SEND_BLOCKCHAIN'){
      this.blockchain.replaceChain(data.blockchain);
      this.isSynced = true;
    }

    if(data.type == 'GET_BLOCKCHAIN') {
      this._send(ws, {  type: 'SEND_BLOCKCHAIN', blockchain: this.blockchain.chain });
      this.isSynced = true;
    }

    if(data.type == 'BLOCK'){
      this.handleNewBlock(ws, data.block);
    }
  }

  handleBlockchain(recievedBlockchain) {
    if (!recievedBlockchain.isValidChain())
      return false;
    if(recievedBlockchain.chain.length <= this.blockchain.chain.length)
      return false;

    this.blockchain = recievedBlockchain;
    // console.log("***************************");
    // console.log(this.blockchain.chain);
    // console.log("***************************");

  }

  handleNewBlock(ws, newBlock){
    if (this.seenBlocks.has(newBlock.hash)) {
      return;
    }
    this.seenBlocks.add(newBlock.hash);

    const latestBlock = this.blockchain.chain[this.blockchain.chain.length -1]

    if(newBlock.index >= latestBlock.index + 1 && newBlock.previousHash == latestBlock.hash){
      const data = newBlock.index + newBlock.timestamp +  JSON.stringify(newBlock.transactionSet) + newBlock.previousHash + newBlock.salt + newBlock.difficulty;
      const newBlockHash = crypto.createHash('sha256').update(data).digest('hex');
      if(newBlock.hash == newBlockHash){
        this.blockchain.chain.push(newBlock);
        this.broadcast({ type: 'BLOCK', block: newBlock });
        console.log(JSON.stringify(this.blockchain.chain));
      }
    }
    else if(newBlock.index > latestBlock.index + 1){
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