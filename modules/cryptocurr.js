import CryptoInterface from "./cryptos/crypto-interface";

export default {
    initCryptos: function() {
        CryptoInterface.addCrypto("./bitcoin.js");
    }
};