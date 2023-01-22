const Web3 = require("web3");
const Coin = require("./coin")
const Token = require("./token")
const Transaction = require("./transaction")
const { setNetwork } = require('./network')

class EthChains {

    static network;

    constructor(network, testnet = false) {

        let networks = require('eth-based-networks');
        networks = testnet ? networks.testnets : networks.mainnets;

        if (typeof network == 'object') {
            this.network = network;
        } else if (networks[network]) {
            this.network = networks[network];
        } else {
            throw new Error('Network not found!');
        }

        this.network.web3 = new Web3(new Web3.providers.HttpProvider(this.network.rpcUrl));

        if (this.network.wsUrl) {
            this.network.web3ws = new Web3(new Web3.providers.WebsocketProvider(this.network.wsUrl));
        }

        setNetwork(this.network);
    }

    Coin() {
        return new Coin();
    }

    Token(address, abi) {
        return new Token(address, abi);
    }

    Transaction(hash) {
        return new Transaction(hash);
    }
}

module.exports = EthChains;