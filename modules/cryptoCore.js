import CryptoInterface from "./cryptos/crypto-interface";

export default class CryptoCore {

    static supported_cryptos = {};

    static initCryptos() {
        CryptoCore.addCrypto("./cryptos/bitcoin.js");
    }

    /**
     * All cryptos
     * @param path
     */
    static addCrypto(path) {
        let cryptoClass = require(path);
        if (cryptoClass.default.prototype instanceof CryptoInterface) {
            const name = cryptoClass.default.getName();
            /**
             * Create a new instance of the crypto class
             * @type {CryptoInterface}
             */
            const inst = new cryptoClass.default();

            //Call setup
            inst.setup()
                .then(value => {
                    this.supported_cryptos[name] = inst;
                    console.log(`CryptoCore -> [${name}] loaded`);
                })
                .catch(reason => {
                    console.log(`CryptoCore -> [${name}] not loaded`);
                });
        } else {
            throw `${path} is not a instance of CryptoInterface`;
        }
    }

    /**
     * Crypto
     * @param name
     * @returns CryptoInterface
     */
    static getCrypto(name) {
        return this.supported_cryptos[name];
    }

    /**
     * Check wallet is supported
     * @param wallet
     * @returns {boolean}
     */
    static isSupported(wallet) {
        return this.supported_cryptos.hasOwnProperty(wallet);
    }
};