const Block = require('./Block.js');
const crypto = require('crypto');

const EXPECTED_TIME = 5 * 60 * 1000; // 5 minutes
const DIFFICULTY_ADJUSTMENT_COUNT = 5;

class Blockchain {
  constructor() {
    this.difficulty = 5;
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    const genesisBlock = new Block(0, [], "0", this.difficulty);
    genesisBlock.hash = crypto.createHash('sha256').update("genesis").digest('hex');
    return genesisBlock;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(newBlock) {
    return new Promise(async (resolve, reject) => {
      try {
        const lastBlock = this.getLatestBlock();
        const index = lastBlock.index + 1;
        const previousHash = lastBlock.hash;

        if (index !== newBlock.index)
          return reject(new Error('bad_index'));
        if (previousHash !== newBlock.previousHash)
          return reject(new Error('bad_previousHash'));

        const minedHash = await newBlock.mineBlock();

        if (this.difficulty !== newBlock.difficulty)
          return reject(new Error('bad_difficulty'));
        if (minedHash.substring(0, this.difficulty) !== "0".repeat(this.difficulty))
          return reject(new Error('bad_block'));

        if (index % DIFFICULTY_ADJUSTMENT_COUNT === 0) {
          const actualTime = lastBlock.timestamp -  this.chain[this.chain.length - DIFFICULTY_ADJUSTMENT_COUNT].timestamp;

          if (actualTime > EXPECTED_TIME) this.difficulty--;
          else if (actualTime < EXPECTED_TIME) this.difficulty++;
        }

        this.chain.push(newBlock);
        resolve(newBlock);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Blockchain;
