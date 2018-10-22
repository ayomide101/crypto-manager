import CryptoInterface from "./crypto-interface";
import StellarSdk from "stellar-sdk";

StellarSdk.Network.useTestNetwork();

export default class StellarCrypto extends CryptoInterface {



    stellarSdk = new StellarSdk.Server('');

    createWallet() {
        return super.createWallet();
    }

    sendTransaction() {
        return super.sendTransaction();
    }

    isWalletValid(wallet_address) {
        return super.isWalletValid(wallet_address);
    }

    getBalance() {
        return super.getBalance();
    }
}