const utils = require('./utils');
const ABI = require('./resources/abi.json');
const { getNetwork } = require('./network');

class Token {

    /**
     * @var {Object}
     */
    network;

    /**
     * @var {Object} 
     */
    contract;

    /**
     * @var {Object}
     */
    contractws;

    /**
     * @var {String} 
     */
    address;

    /**
     * @param {String} address 
     * @param {Array} abi 
     * @throws {Error}
     */
    constructor(address, abi) {
        this.network = getNetwork();

        this.address = address;
        this.contract = new this.network.web3.eth.Contract(abi || ABI, address);

        if (this.network.web3ws) {
            this.contractws = new this.network.web3ws.eth.Contract(abi || ABI, address);
        }
    }

    /**
     * @param {String} address
     * @returns {Float|Object}
     */
    async getBalance(address) {
        let balance = await this.contract.methods.balanceOf(address).call();
        return parseFloat(balance / (10 ** await this.getDecimals()));
    }

    /**
     * @returns {String|Object}
     */
    getName() {
        return this.contract.methods.name().call();
    }

    /**
     * @returns {Float|Object}
     */
    async getTotalSupply() {
        let totalSupply = await this.contract.methods.totalSupply().call();
        return parseFloat(totalSupply / (10 ** await this.getDecimals()));
    }

    /**
     * @returns {String|Object}
     */
    getSymbol() {
        return this.contract.methods.symbol().call();
    }

    /**
     * @returns {String|Object}
     */
    async getDecimals() {
        return parseInt(await this.contract.methods.decimals().call());
    }

    /**
     * @returns {String}
     */
    getAddress() {
        return this.address;
    }

    /**
     * @param {String} owner
     * @param {String} spender
     * @returns {Boolean}
     */
    async allowance(owner, spender) {
        let allowance = await this.contract.methods.allowance(owner, spender).call();
        return parseFloat(utils.toDec(allowance, await this.getDecimals()))
    }

    /**
     * @param {String} event 
     * @param {Object} options 
     */
    listenEvent(event, options) {
        return new Promise((resolve, reject) => {
            if (!this.contractws) {
                throw new Error("Websocket connection is not available");
            }
    
            this.contractws.events[event](options, async (error, event) => {
                if (error) {
                    return reject(error);
                }

                resolve(event);
            });
        });
    }
}

module.exports = Token;