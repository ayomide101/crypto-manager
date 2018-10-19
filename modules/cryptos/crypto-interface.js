export default class CryptoInterface {

    static supported_cryptos = [];

    createWallet() {

    }
    sendTransaction() {

    }

    /**
     * All cryptos
     * @param path
     */
    static addCrypto(path) {
        let cryptoClass = require(path);
        if (cryptoClass.prototype instanceof CryptoInterface) {
            this.supported_cryptos.push(path);
        } else {
            throw ""+path+" is not a instance of CryptoInterface";
        }
    }
}