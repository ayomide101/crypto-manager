import Database from "../common/database";
import Error from "./errors";
import Functions from "./functions";
import uuidv4 from "uuid/v4";
import CryptoCore from "./cryptoCore";

export default class Wallet {

    static friends_table = "friends";

    /**
     * Balance from one wallet
     * @param uid
     * @param wallet
     */
    getBalance(uid, wallet) {

    }

    /**
     * Balance from all wallets
     * @param uid
     */
    getBalances(uid){}

    /**
     * Add amount to wallet
     * @param uid
     * @param wallet
     * @param amount
     */
    loadWallet(uid, wallet, amount) {}

    /**
     * Send crypto to recipient wallet
     *
     * @param uid
     * @param wallet
     * @param wallet_address
     * @param amount
     */
    sendMoneyToWallet(uid, wallet, wallet_address, amount){}

    /**
     * Send money to a friend
     * @param uid
     * @param frnid
     * @param amount
     */
    sendMoneyToFriend(uid, frnid, amount){}

    /**
     * Create new wallet on wallet_type
     * @param uid
     * @param wallet_type
     */
    createWallet(uid, wallet_type){}

    /**
     * Transactions in wallet
     * @param uid
     * @param wallet
     */
    getTransactions(uid, wallet){}

    /**
     * Schedule payments to wallet by period
     * @param uid
     * @param period - supported daily, weekly, monthly
     * @param wallet
     * @param wallet_address
     * @param amount
     */
    scheduleTransaction(uid, period, wallet, wallet_address, amount){}

    /**
     * Create new friend
     * @param uid
     * @param name
     * @param wallet
     * @param wallet_address
     */
    createFriend(uid, name, wallet, wallet_address) {
        const errors = [];
        if (Functions.isNull(name)) {
            errors.push({name: "Name is not defined"})
        }
        if (Functions.isNull(wallet)) {
            errors.push({wallet: "wallet is not defined"})
        } else {
            //Check wallet is supported
            wallet = wallet.toLowerCase();

            if (!CryptoCore.isSupported(wallet)) {
                errors.push({wallet: "wallet not supported"})
            }
        }
        if (Functions.isNull(wallet_address)) {
            errors.push({wallet_address: "wallet_address is not defined"})
        }
        if (!errors.isEmpty()) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, errors));
        }

        //Check wallet is valid
        console.log(`Checking wallet is valid -> ${wallet}::${wallet_address}`);
        return CryptoCore
            .getCrypto(wallet)
            .isWalletValid(wallet_address)
            .then(value => {
                const db = new Database();
                const data = {uid, frnid:uuidv4(), name, wallet, wallet_address, created_on: new Date().toISOString()};
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