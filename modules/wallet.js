export default class Wallet {

    /**
     * Balance from one wallet
     * @param uid
     * @param wallet
     */
    getBalance(uid, wallet);

    /**
     * Balance from all wallets
     * @param uid
     */
    getBalances(uid);

    /**
     * Add amount to wallet
     * @param uid
     * @param wallet
     * @param amount
     */
    loadWallet(uid, wallet, amount);

    /**
     * Send crypto to recipient wallet
     *
     * @param uid
     * @param wallet
     * @param wallet_address
     * @param amount
     */
    sendMoneyToWallet(uid, wallet, wallet_address, amount);

    /**
     * Send money to a friend
     * @param uid
     * @param frnid
     * @param amount
     */
    sendMoneyToFriend(uid, frnid, amount);

    /**
     * Create new wallet on wallet_type
     * @param uid
     * @param wallet_type
     */
    createWallet(uid, wallet_type);

    /**
     * Transactions in wallet
     * @param uid
     * @param wallet
     */
    getTransactions(uid, wallet);

    /**
     * Schedule payments to wallet by period
     * @param uid
     * @param period - supported daily, weekly, monthly
     * @param wallet
     * @param wallet_address
     * @param amount
     */
    scheduleTransaction(uid, period, wallet, wallet_address, amount);

    /**
     * Create new friend
     * @param uid
     * @param name
     * @param wallet
     * @param wallet_address
     */
    createFriend(uid, name, wallet, wallet_address);

    /**
     * Remove from friend list
     * @param uid
     * @param frnid
     */
    deleteFriend(uid, frnid);

    /**
     * Retrieve friends
     * @param uid
     * @param name - optional
     */
    getFriends(uid, name);

    /**
     * Check if upper limit of amount to be held has been reached
     * Check if limit of daily/weekly reached
     */
    isAboveLimit();

    /**
     * Return the list of supported cryptos
     */
    getSupportedCryptos();
}