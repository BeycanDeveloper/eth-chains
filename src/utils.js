const Web3Utils = require('web3-utils');
const BigNumber = require('bignumber.js');
const ethAbiDecoder = require('abi-decoder');
const ABI = require('./resources/abi.json');
ethAbiDecoder.addABI(ABI);

module.exports = {
    hex(value) {
        return '0x' + value.toString(16);
    },
    toHex(amount, decimals) {
        let length = '1' + '0'.repeat(decimals);
        let value = new BigNumber(amount.toString(10), 10).times(length);
        return Web3Utils.toHex(value.toString(10));
    },
    toDec(amount, decimals) {
        let length = '1' + '0'.repeat(decimals);
        let value = new BigNumber(amount.toString(10), 10).dividedBy(length);
        return parseFloat(value.toString(10));
    },
    abiDecoder(input) {
        return ethAbiDecoder.decodeMethod(input);
    },
    isNumeric(val) {
        if (typeof val != "string") return true;
        return isNaN(val) && isNaN(parseFloat(val));
    },
    isAddress(address) {
        return Web3Utils.isAddress(address);
    }
}