import Database from "../common/database";
import Error from "./errors";
import Functions from "./functions";
import uuidv4 from "uuid/v4";
import CryptoCore from "./cryptoCore";
import User from "./user-account";

export default class Wallet {

    static friends_table = "friends";
    static wallets_table = "wallets";
    /**
     * Users object
     * @type {User}
     */
    users;

    constructor() {
        this.users = new User();
    }

    /**
     * Balance from one crypto
     * @param uid
     * @param crypto
     */
    getBalance(uid, crypto) {

    }

    /**
     * Balance from all cryptos
     * @param uid
     */
    getBalances(uid) {

    }

    /**
     * Add amount to crypto
     * @param uid
     * @param crypto
     * @param amount
     */
    loadWallet(uid, crypto, amount) {}

    /**
     * Send crypto to recipient crypto
     *
     * @param uid
     * @param crypto
     * @param crypto_address
     * @param amount
     */
    sendMoneyToWallet(uid, crypto, crypto_address, amount){}

    /**
     * Send money to a friend
     * @param uid
     * @param frnid
     * @param amount
     */
    sendMoneyToFriend(uid, frnid, amount){}

    /**
     * Create new crypto on crypto_type
     * @param uid
     * @param crypto_type
     */
    createWallet(uid, crypto_type){
        return this.users
            .isUserValid(uid)
            .then(user => {
                const crypto = CryptoCore.getCrypto(crypto_type);

                // crypto.createWallet()
            })
            .catch(reason => Promise.reject(reason));
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


    /**
     * Import a wallet
     * @param uid
     * @param crypto_type
     * @param wallet_address
     * @param private_key
     */
    importWallet(uid, crypto_type, wallet_address, private_key) {

    }

    /**
     * Transactions in crypto
     * @param uid
     * @param crypto
     */
    getTransactions(uid, crypto){}

    /**
     * Schedule payments to crypto by period
     * @param uid
     * @param period - supported daily, weekly, monthly
     * @param crypto
     * @param crypto_address
     * @param amount
     */
    scheduleTransaction(uid, period, crypto, crypto_address, amount){}

    /**
     * Create new friend
     * @param uid
     * @param name
     * @param crypto
     * @param crypto_address
     */
    createFriend(uid, name, crypto, crypto_address) {
        const errors = [];
        if (Functions.isNull(name)) {
            errors.push({name: "Name is not defined"})
        }
        if (Functions.isNull(crypto)) {
            errors.push({crypto: "crypto is not defined"})
        } else {
            //Check crypto is supported
            if (!CryptoCore.isSupported(crypto)) {
                return Promise.reject(Error.WALLET_NOT_SUPPORTED);
            }
        }
        if (Functions.isNull(crypto_address)) {
            errors.push({crypto_address: "crypto_address is not defined"})
        }
        if (!errors.isEmpty()) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, errors));
        }

        //Check crypto is valid
        console.log(`Checking crypto is valid -> ${crypto}::${crypto_address}`);
        return CryptoCore
            .getCrypto(crypto)
            .isWalletValid(crypto_address)
            .then(value => {
                const db = new Database();
                const data = {uid, frnid:uuidv4(), name, crypto, crypto_address, created_on: new Date().toISOString()};
                return db
                    .insert(Wallet.friends_table, data)
                    .then(value => {
                        return Promise.resolve(Error.successError("Friend added successfully", data))
                    })
                    .catch(reason => {
                        return Promise.reject(Error.FRIEND_NOT_CREATED)
                    })
                    .finally(() => {
                        db.close();
                    });
            })
            .catch(reason => {
                return Promise.reject(Error.INVALID_WALLET_ADDRESS);
            });
    }

    /**
     * Check if upper limit of amount to be held has been reached
     * Check if limit of daily/weekly reached
     */
    isAboveLimit() {}

    /**
     * Remove from friend list
     * @param uid
     * @param frnid
     */
    deleteFriend(uid, frnid) {
        const errors = [];

        if (Functions.isNull(frnid)) {
            errors.push({frnid: "frndid not set"})
        }

        if (!errors.isEmpty()) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, errors));
        }

        const db = new Database();

        return db.select(Wallet.friends_table, {frnid})
            .then(friends => {

                return db
                    .delete(Wallet.friends_table, {frnid})
                    .catch(reason => {
                        return Promise.reject(Error.FRIEND_NOT_DELETED)
                    });
            })
            .then(value => {
                return Promise.resolve(Error.successError("Friend deleted"));
            })
            .finally(() => {
                db.close();
            });
    }

    /**
     * Retrieve friends
     * @param uid
     */
    getFriends(uid) {
        const db = new Database();
        return db
            .select(Wallet.friends_table, {uid})
            .then(friends => {
                console.log(friends);
                return Promise.resolve(Error.successError("Friends", friends))
            })
            .finally(() => {
                db.close();
            });
    }

    /**
     * Return the list of supported cryptos
     */
    getSupportedCryptos() {
        return new Promise((resolve, reject) => {
            resolve(CryptoInterface.supported_cryptos);
        });
    }
}