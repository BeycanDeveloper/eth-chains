let currentNerwork;
module.exports = {
    setNetwork(network) {
        currentNerwork = network;
    },
    getNetwork() {
        return currentNerwork;
    }
}