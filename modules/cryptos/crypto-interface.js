export default class CryptoInterface {

    /**
     * Setup block chain
     * Will be called immediately after crypto is instantiated
     */
    setup(baseurl) {

    }

    /**
     *
     * @returns Promise
     */
    createWallet(name) {
        return null;
    }

    createWalletAddress(cryptoBean) {

    }

    sendTransaction(cryptoBean, receiver_wallet_address, amount) {
        return null;
    }

    isWalletValid(wallet_address) {
        return Promise.resolve(true)
    }

    getBalance(cryptoBean) {
        return true;
    }

    getTransactions(cryptoBean) {

    }

    onNewEvent(data) {

    }

    /**
     * Checks if Crypto supports webhook
     * @returns {boolean}
     */
    isSupportWebHook() {
        return false;
    }

    static getName() {
        return null;
    }

    log(message, error) {
        if (error) {
            console.error(message);
        } else {
            console.log(message);
        }

        return message;
    }

    error(message) {
        return this.log(message, true);
    }
}