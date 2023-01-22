const { getNetwork } = require('./network')

class Coin {

    /**
     * @var {Object}
     */
    network;

    /**
     * @var {Object} 
     */
    symbol;

    /**
     * @var {String} 
     */
    decimals;

    /**
     * @throws {Error}
     */
    constructor() {
        this.network = getNetwork();
        this.decimals = this.network.nativeCurrency.decimals;
        this.symbol = this.network.nativeCurrency.symbol;
    }
    
    /**
     * @param {String} address
     * @returns {Float}
     */
    async getBalance(address) {
        let balance = await this.network.web3.eth.getBalance(address);
        return parseFloat((parseInt(balance) / 10**this.decimals).toFixed(6));
    }

    /**
     * @returns {String}
     */
    getSymbol() {
        return this.symbol;
    }

    /**
     * @returns {Integer}
     */
    getDecimals() {
        return this.decimals;
    }
}

module.exports = Coin;