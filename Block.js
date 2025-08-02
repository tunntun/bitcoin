const crypto = require('crypto');


class Block {
  constructor(index, transactionSet, previousHash, ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactionSet = transactionSet;
    this.previousHash = previousHash;
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = this.calculateHash();
    this.nBits = this.nBits;
  };
  calculateHash(){
    const data = this.index + this.timestamp + JSON.stringify(this.transactionSet) + this.previousHash + this.salt;
    return crypto.createHash('sha256').update(data).digest('hex');
  };
  getHash() {
    return this.hash;
  };

  mineBlock(){

  };

}

module.exports = Block;
