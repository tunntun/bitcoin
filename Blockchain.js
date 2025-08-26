const Block = require('./Block.js');
const crypto = require('crypto');

const EXPECTED_TIME = 1 * 60 * 1000; // 5 minutes
const DIFFICULTY_ADJUSTMENT_COUNT = 5;

class Blockchain {
  constructor() {
    this.difficulty = 4;
    this.chain = [this.createGenesisBlock()];

    this.blocksByHash = new Map();
    this.blocksByHash.set(this.chain[0].hash, this.chain[0]);

    this.bestWork = 1;
  }

  createGenesisBlock() {
    const genesisBlock = new Block(0, [], "0", this.difficulty);
    genesisBlock.hash = crypto.createHash('sha256').update("genesis").digest('hex');
    return genesisBlock;
  }

  getLatestBlock() {

    return this.chain[this.chain.length - 1];
  }

  isValidChain(chain) {
    const expectedGenesis = this.createGenesisBlock();

    if(chain[0].index !== expectedGenesis.index)
      return false;
    if(chain[0].transactionSet.length !== expectedGenesis.transactionSet.length)
      return false;
    if(chain[0].previousHash !== expectedGenesis.previousHash)
      return false;
    if(chain[0].difficulty !== expectedGenesis.difficulty)
      return false;

    for (let i = 1; i < chain.length; i++) {
    const prev = chain[i-1];
    const current = chain[i];
    if (current.previousHash !== prev.hash) return false;
    if (!current.hash.startsWith('0'.repeat(current.difficulty))) return false;
    }
    return true;
  }

  replaceChain(newChain) {
    if(!Array.isArray(this.chain) || newChain.length === 0)
      return false;
    if(!this.isValidChain(newChain))
      return false;
    if(newChain.length <= this.chain.length)
      return false;

    this.chain = newChain;
    return true;
  }


  async addBlock(newBlock) {
    const lastBlock = this.getLatestBlock();
    const expectedIndex = lastBlock.index + 1;
    const expectedPrev  = lastBlock.hash;

    if (newBlock.index !== expectedIndex) throw new Error('bad_index');
    if (newBlock.previousHash !== expectedPrev) throw new Error('bad_previousHash');
    if (Number.isNaN(Number(newBlock.difficulty))) throw new Error('bad_difficulty');

    const minedHash = await newBlock.mineBlock();
    if (typeof minedHash !== 'string') throw new Error('hash_not_string');

    if (!minedHash.startsWith('0'.repeat(this.difficulty))) throw new Error('bad_block');

    if (DIFFICULTY_ADJUSTMENT_COUNT > 0 && expectedIndex % DIFFICULTY_ADJUSTMENT_COUNT === 0) {
      const fromIdx = this.chain.length - DIFFICULTY_ADJUSTMENT_COUNT;
      if (fromIdx >= 0) {
        const actualTime = lastBlock.timestamp - this.chain[fromIdx].timestamp;
        if (actualTime > EXPECTED_TIME)
          this.difficulty = Math.max(1, this.difficulty - 1);
        else if (actualTime < EXPECTED_TIME)
          this.difficulty = this.difficulty + 1;
      }
    }

    this.chain.push(newBlock);
    if (this.blocksByHash) this.blocksByHash.set(newBlock.hash, newBlock);
    this.bestWork = (this.bestWork || 0) + 1;

    return newBlock;
  };
}

module.exports = Blockchain;
