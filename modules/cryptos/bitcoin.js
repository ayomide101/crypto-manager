import CryptoInterface from "./crypto-interface";

export default class BitcoinCrypto extends CryptoInterface {


    getBalance() {
        super.getBalance();
    }

    static getName() {
        return "bitcoin";
    }
}