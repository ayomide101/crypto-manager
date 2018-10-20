export default class CryptoInterface {

    static supported_cryptos = {};

    createWallet() {

    }

    sendTransaction() {

    }

    getBalance() {

    }

    static getName() {

    }

    /**
     * All cryptos
     * @param path
     */
    static addCrypto(path) {
        let cryptoClass = require(path);
        if (cryptoClass.default.prototype instanceof CryptoInterface) {
            const name = cryptoClass.default.getName();
            this.supported_cryptos[name] = path;
            console.log(`CryptoInterface -> [${name}] loaded`);
        } else {
            throw `${path} is not a instance of CryptoInterface`;
        }
    }

    static getCrypto(name) {
        return this.supported_cryptos[name];
    }
}