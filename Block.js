const crypto = require('crypto');

class Block {
  constructor(index, transactionSet, previousHash, difficulty) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactionSet = transactionSet;
    this.previousHash = previousHash;
    this.salt = crypto.randomBytes(16).toString('hex');
    this.difficulty = difficulty;
    this.hash = null;
  }

  calculateHash() {
    return new Promise((resolve, reject) => {
      if (this.index === undefined || this.timestamp === undefined || this.transactionSet === undefined || this.previousHash === undefined || this.salt === undefined || this.difficulty === undefined) {
        return reject(new Error('bad_request'));
      }

      try {
        const data = this.index + this.timestamp + JSON.stringify(this.transactionSet) + this.previousHash + this.salt + this.difficulty;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        resolve(hash);
      } catch (err) {
        reject(err);
      }
    });
  }

  getHash() {
    return new Promise((resolve, reject) => {
      if (!this.hash) {
        return reject(new Error('bad_hash'));
      }
      resolve(this.hash);
    });
  }

  mineBlock() {
    return new Promise(async (resolve, reject) => {
      if (this.index === undefined || this.timestamp === undefined || this.transactionSet === undefined || this.previousHash === undefined || this.salt === undefined || this.difficulty === undefined) {
        return reject(new Error('bad_request'));
      }

      try {
        let hash;
        do {
          this.salt = crypto.randomBytes(16).toString('hex');
          hash = await this.calculateHash();
          if (typeof hash !== 'string') throw new Error('hash_not_string');
        } while (hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty));
        this.hash = hash;
        resolve(this.hash);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Block;
