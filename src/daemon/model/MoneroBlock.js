const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("./MoneroTx");
const MoneroBlockHeader = require("./MoneroBlockHeader");

/**
 * Monero block.
 */
class MoneroBlock {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroBlock|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    
    // initialize internal state
    if (!state) state = {};
    else if (state instanceof MoneroBlock) state = state.toJson();
    else if (typeof state === "object") state = Object.assign({}, state);
    else throw new Error("state must be a MoneroBlock or JavaScript object");
    this.state = state;
    
    // deserialize header
    if (state.header && !(state.header instanceof MoneroBlockHeader)) state.header = new MoneroBlockHeader(state.header);
    
    // deserialize coinbase tx
    if (state.coinbaseTx && !(state.coinbaseTx instanceof MoneroTx)) state.coinbaseTx = new MoneroTx(state.coinbaseTx).setBlock(this);
    
    // deserialize non-coinbase txs
    if (state.txs) {
      for (let i = 0; i < state.txs.length; i++) {
        if (!(state.txs[i] instanceof MoneroTx)) state.txs[i] = new MoneroTx(state.txs[i]).setBlock(this);
      }
    }
  }
  
  getHeader() {
    return this.state.header;
  }
  
  setHeader(header) {
    this.state.header = header;
    return this;
  }
  
  getHex() {
    return this.state.hex;
  }
  
  setHex(hex) {
    this.state.hex = hex;
    return this;
  }
  
  getCoinbaseTx() {
    return this.state.coinbaseTx;
  }
  
  setCoinbaseTx(coinbaseTx) {
    this.state.coinbaseTx = coinbaseTx;
    return this;
  }
  
  getTxs() {
    return this.state.txs;
  }
  
  setTxs(txs) {
    this.state.txs = txs;
    return this;
  }
  
  getTxIds() {
    return this.state.txIds;
  }
  
  setTxIds(txIds) {
    this.state.txIds = txIds;
    return this;
  }
  
  copy() {
    return new MoneroBlock(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getHeader()) json.header = this.getHeader().toJson();
    if (this.getCoinbaseTx()) json.coinbaseTx = this.getCoinbaseTx().toJson();
    if (this.getTxs()) {
      json.txs = [];
      for (let tx of this.getTxs()) json.txs.push(tx.toJson());
    }
    return json;
  }
  
  merge(block) {
    assert(block instanceof MoneroBlock);
    if (this === block) return;
    
    // merge header
    if (!this.getHeader()) this.setHeader(block.getHeader());
    else if (block.getHeader()) this.getHeader().merge(block.getHeader());
    
    // merge coinbase tx
    if (!this.getCoinbaseTx()) this.setCoinbaseTx(block.getCoinbaseTx());
    else if (block.getCoinbaseTx()) this.getCoinbaseTx().merge(block.getCoinbaseTx());
    
    // merge non-coinbase txs
    if (!this.getTxs()) this.setTxs(block.getTxs());
    else if (block.getTxs()) {
      for (let thatTx of block.getTxs()) {
        let found = false;
        for (let thisTx of this.getTxs()) {
          if (thatTx.getId() === thisTx.getId()) {
            thisTx.merge(thatTx);
            found = true;
            break;
          }
        }
        if (!found) this.getTxs().push(thatTx);
      }
    }
    if (this.getTxs()) for (let tx of this.getTxs()) tx.setBlock(this);
    
    // merge other fields
    this.setHex(MoneroUtils.reconcile(this.getHex(), block.getHex()));
    this.setTxIds(MoneroUtils.reconcile(this.getTxIds(), block.getTxIds()));
    return this;
  }
  
  toString(indent = 0) {
    let str = "";
    if (this.getHeader()) {
      str += MoneroUtils.kvLine("Header", "", indent);
      str += this.getHeader().toString(indent + 1) + "\n";
    }
    if (this.getCoinbaseTx()) {
      str += MoneroUtils.kvLine("Coinbase tx", "", indent);
      str += this.getCoinbaseTx().toString(indent + 1) + "\n";
    }
    if (this.getTxs()) {
      str += MoneroUtils.kvLine("Txs", "", indent);
      for (let tx of this.getTxs()) {
        str += tx.toString(indent + 1) + "\n";
      }
    }
    str += MoneroUtils.kvLine("Txs ids", this.getTxIds(), indent);
    return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str  // strip last newline
  }
}

module.exports = MoneroBlock;