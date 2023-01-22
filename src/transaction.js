const Coin = require('./coin');
const Token = require('./token');
const utils = require('./utils');
const { getNetwork } = require('./network');

class Transaction {

    /**
     * @var {Object}
     */
    network;

    /**
     * @var {String} 
     */
    hash;

    /**
     * @var {Object} 
     */
    data;

    /**
     * @var {Adapter}
     */

    /**
     * @param {String} hash 
     */
    constructor(hash) {
        this.network = getNetwork();
        this.hash = hash;
        this.getData();
    }

    /**
     * @returns {String}
     */
    getHash() {
        return this.hash;
    }

    /**
     * @returns {Float}
     */
    async getFee() {
        let data = await this.getData();
        return utils.toDec((data.gasPrice * data.gasUsed), this.network.nativeCurrency.decimals);
    }

    /**
     * @returns {Object}
     */
    async getData() {
        try {
            this.data = await this.network.web3.eth.getTransaction(this.hash);
        } catch (error) {
            throw new Error('There was a problem retrieving transaction data!');
        }

        try {
            let receipt = await this.network.web3.eth.getTransactionReceipt(this.hash);
            this.data.status = receipt.status;
            this.data.gasUsed = receipt.gasUsed;
        } catch (error) {
            throw new Error('There was a problem retrieving transaction data!');
        }

        return this.data;
    }

    /**
     * @returns {Object|null}
     */
    decodeInput() {
        if (this.data.input != '0x') {
            let decodedInput = utils.abiDecoder(this.data.input);
            let receiver = decodedInput.params[0].value;
            let amount = decodedInput.params[1].value;
            return { receiver, amount };
        } else {
            return null;
        }
    }

    /** 
     * @returns {Number}
     */
    async getConfirmations() {
        try {
            if (!this.data) await this.getData();
            const currentBlock = await this.network.web3.eth.getBlockNumber();
            if (this.data.blockNumber === null) return 0;
            let confirmations = currentBlock - this.data.blockNumber;
            return confirmations < 0 ? 0 : confirmations;
        } catch (error) {}
    }

    /**
     * @param {Number} confirmations 
     * @param {Number} timer 
     * @returns {Number}
     */
    confirmTransaction(confirmations = 10, timer = 1) {
        return new Promise((resolve, reject) => {
            try {
                this.intervalConfirm = setInterval(async () => {
                    const trxConfirmations = await this.getConfirmations(this.hash)
        
                    if (trxConfirmations >= confirmations) {
                        clearInterval(this.intervalConfirm);
                        return resolve(trxConfirmations);
                    }
                }, (timer*1000));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @param {Number} timer 
     * @returns {Boolean}
     */
    validateTransaction(timer = 1) {
        return new Promise((resolve, reject) => {
            this.intervalValidate = setInterval(async () => {
                try {

                    await this.getData();

                    let result = null;

                    if (this.data == null) {
                        result = false;
                    } else {
                        if (this.data.blockNumber !== null) {
                            if (this.data.status == '0x0') {
                                result = false;
                            } else {
                                result = true;
                            }
                        }
                    }
    
                    if (typeof result == 'boolean') {
                        clearInterval(this.intervalValidate);
                        if (result == true) {
                            resolve(true);
                        } else {
                            reject(false);
                        }
                    }
    
                } catch (error) {
                    if (error.message == 'There was a problem retrieving transaction data!') {
                        this.validateTransaction(timer);
                    } else {
                        clearInterval(this.intervalValidate);
                        reject(error);
                    }
                }
            }, (timer*1000));
        });
    }

    /**
     * @param {String} address 
     * @param {Number} timer 
     * @returns {Boolean}
     */
    async verifyTokenTransfer(address, timer = 1) {
        if (utils.isAddress(address = address.toLowerCase()) === false) {
            throw new Error('Invalid token address!');
        }

        if (await this.validateTransaction(timer)) {
            if (this.data.input == '0x') {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    /**
     * @param {Number} timer 
     * @returns {Boolean}
     */
    async verifyCoinTransfer(timer = 1) {
        if (await this.validateTransaction(timer)) {
            if (this.data.value == '0x0') {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    /**
     * @param {String} receiver 
     * @param {Number} amount 
     * @param {String} address 
     * @param {Number} timer 
     * @returns {Boolean}
     */
    async verifyTokenTransferWithData(receiver, amount, address, timer = 1) {
        if (utils.isAddress(receiver = receiver.toLowerCase()) === false) {
            throw new Error('Invalid receiver address!');
        }

        if (await this.verifyTokenTransfer(address, timer)) {
            let decodedInput = this.decodeInput();
            let token = new Token(address);

            let data = {
                receiver: decodedInput.receiver.toLowerCase(),
                amount: utils.toDec(decodedInput.amount, (await token.getDecimals()))
            };

            if (data.receiver == receiver && data.amount == amount) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * @param {String} receiver 
     * @param {Number} amount 
     * @param {Number} timer 
     * @returns {Boolean}
     */
    async verifyCoinTransferWithData(receiver, amount, timer = 1) {
        if (utils.isAddress(receiver = receiver.toLowerCase()) === false) {
            throw new Error('Invalid receiver address!');
        }

        if (await this.verifyCoinTransfer(timer)) {

            let coin = new Coin();

            let data = {
                receiver: this.data.to.toLowerCase(),
                amount: utils.toDec(this.data.value, (await coin.getDecimals()))
            };

            if (data.receiver == receiver && data.amount == amount) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * @param {String|null} tokenAddress
     * @returns {Boolean}
     */
    verifyTransfer(tokenAddress = null) {
        if (!tokenAddress) {
            return this.verifyCoinTransfer();
        } else {
            return this.verifyTokenTransfer(tokenAddress);
        }
    }

    /**
     * @param {String} receiver
     * @param {Number} amount
     * @param {String|null} tokenAddress
     * @returns {Boolean}
     */
    verifyTransferWithData(receiver, amount, tokenAddress = null) {
        if (!tokenAddress) {
            return this.verifyCoinTransferWithData(receiver, amount);
        } else {
            return this.verifyTokenTransferWithData(receiver, amount, tokenAddress);
        }
    }
}

module.exports = Transaction;