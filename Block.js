const crypto = require('crypto');

class Block {
  constructor(index, transactionSet, previousHash, difficulty, callback) {
    if (index === undefined || transactionSet === undefined || previousHash === undefined || difficulty === undefined) {
      return callback('bad_request');
    }

    this.index = index;
    this.timestamp = Date.now();
    this.transactionSet = transactionSet;
    this.previousHash = previousHash;
    this.salt = crypto.randomBytes(16).toString('hex');
    this.difficulty = difficulty;
    this.calculateHash((err, hash) => {
      if (err) return callback (err);
      this.hash = hash;
      console.log(this);
      return callback(null, this);
    });
  }

  calculateHash(callback){
    if (this.timestamp  === undefined || this.salt  === undefined)
      return callback('bad_request');

    const data = this.index + this.timestamp + JSON.stringify(this.transactionSet) + this.previousHash + this.salt + this.difficulty;
    return callback(null, crypto.createHash('sha256').update(data).digest('hex'));
  }

  getHash(callback) {
    if(!this.hash)
      return callback('bad_request');

    return callback(null, this.hash);
  }

  mineBlock(callback){
    if (this.index === undefined || this.transactionSet === undefined || this.previousHash === undefined || this.difficulty === undefined || this.timestamp  === undefined || this.salt  === undefined) {
      return callback('bad_request');
    }
    while (this.hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)) {
      this.salt = crypto.randomBytes(16).toString('hex');
      const data = this.index + this.timestamp + JSON.stringify(this.transactionSet) + this.previousHash + this.salt + this.difficulty;
      this.hash = crypto.createHash('sha256').update(data).digest('hex');
    }

    callback(null, this);
    // if (this.hash.substring(0, this.difficulty) === "0".repeat(this.difficulty)){
    //   return callback(null, this);
    // }
    // else {
    //   this.salt = crypto.randomBytes(16).toString('hex');
    //   return this.mineBlock(callback);
    // }
  }
}

module.exports = Block;
