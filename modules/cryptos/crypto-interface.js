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
    createWallet(data) {
        return null;
    }

    createWalletAddress(data) {

    }

    sendTransaction() {
        return null;
    }

    isWalletValid(wallet_address) {
        return Promise.resolve(true)
    }

    getBalance() {
        return true;
    }

    getTransactions() {

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