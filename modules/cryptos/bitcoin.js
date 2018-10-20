import CryptoInterface from "./crypto-interface";

export default class BitcoinCrypto extends CryptoInterface {


    isWalletValid(wallet_address) {
        return Promise.resolve(true);
    }

    getBalance() {
        return null;
    }

    static getName() {
        return "bitcoin";
    }
}