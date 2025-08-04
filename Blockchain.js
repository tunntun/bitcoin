const Block = require('./Block.js');
const crypto = require('crypto');

const EXPECTED_TIME =  5 * 60 * 1000;
const DIFFICULTY_ADJUSTMENT_COUNT = 5;

class Blockchain {
  constructor(){
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 1;
  }
  createGenesisBlock() {
    return new Block(0, [], "0", this.difficulty);
  }
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
  addBlock(newBlock, callback){
    const lastBlockLength = this.chain.length - 1 ;
    const index = this.chain[lastBlockLength].index + 1;
    const previousHash = this.chain[lastBlockLength].hash;

    const data = newBlock.index + newBlock.timestamp + JSON.stringify(newBlock.transactionSet) + newBlock.previousHash + newBlock.salt + newBlock.difficulty;
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    if (index != newBlock.index)
      return callback('bad_index');
    if (previousHash != newBlock.previousHash)
      return callback('bad_previousHash');
    console.log("Calculated hash:", hash);
    console.log("New block hash:", newBlock.hash);
    if (hash != newBlock.hash)
      return callback('bad_hash');
    if (this.difficulty != newBlock.difficulty)
      return callback('bad_difficulty');
    if (newBlock.hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty))
      return callback('bad_block');

    if(index % DIFFICULTY_ADJUSTMENT_COUNT == 0){
      const actualTime = this.chain[lastBlockLength].timestamp - this.chain[lastBlockLength - DIFFICULTY_ADJUSTMENT_COUNT + 1].timestamp;
      if (actualTime > EXPECTED_TIME)
        this.difficulty--;
      if (actualTime < EXPECTED_TIME)
        this.difficulty++;
    }
    this.chain.push(newBlock);
    return callback(null, newBlock);
  }
};

module.exports = Blockchain;