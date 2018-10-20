export default class CryptoInterface {

    createWallet() {
        return null;
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

    static getName() {
        return null;
    }
}