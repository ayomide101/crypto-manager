import CryptoInterface from "./crypto-interface";
import StellarSdk from "stellar-sdk";
import Functions from "../functions";
import Error from "../errors";
import {CryptoAddress, CryptoBalance, CryptoBean, CryptoTransaction} from "./cryptostruct";
import HttpRequest from "../../common/httpRequest";

export default class StellarCrypto extends CryptoInterface {

    /**
     * @type {StellarSdk.Server}
     */
    server;

    /**
     * @type {boolean}
     */
    live;

    /**
     * Setup stellar
     * @param options
     * @param baseurl
     * @returns {Promise<true>}
     */
    setup(options, baseurl) {
        return new Promise((resolve, reject) => {
            const cryptoConfig = Functions.isNull(options) ? Functions.getConfig("crypto-config") : options;

            if (Functions.isNull(cryptoConfig)) {
                reject(this.error("crypto-config not present in config or null passed to setup"));
                return;
            }

            const stellarConfig = cryptoConfig.stellar;
            if (Functions.isNull(stellarConfig)) {
                reject(this.error("`stellar` object not present in config"));
                return;
            }

            const liveURL = stellarConfig.live;
            const testURL = stellarConfig.test;

            if (Functions.isNull(liveURL) || Functions.isNull(testURL)) {
                reject(this.error(`live or test has to be set`));
                return;
            }

            this.server = new StellarSdk.Server(cryptoConfig.live ? liveURL : testURL);

            if (cryptoConfig.live) {
                StellarSdk.Network.usePublicNetwork();
            } else {
                StellarSdk.Network.useTestNetwork();
            }

            resolve(true);
        });
    }

    /**
     * Creates a public and private key
     * public key serves as wallet address
     * Account will not be created unless its funded
     *
     * @param name
     * @returns {*}
     */
    createWallet(name) {
        if (Functions.isNull(name)) {
            return Promise.reject(this.error("wallet_name is not defined"));
        }

        // Derive Keypair object and public key (that starts with a G) from the secret
        const newAccount = StellarSdk.Keypair.random();

        console.log('New key pair created!');
        console.log(` Account ID: ${newAccount.publicKey()}`);
        console.log(` Secret : ${newAccount.secret()}`);

        return new Promise((resolve, reject) => {
            this.log(`Creating -> ${StellarCrypto.getName()} wallet`);

            if (this.live) {
            } else {
                this._createTestWallet(newAccount.publicKey(), newAccount.secret())
                    .then(value => {
                        this.log(`Wallet created`);
                        resolve(new CryptoBean(newAccount.publicKey(), newAccount.secret()));
                    })
                    .catch(reason => {
                        reject(this.error(`Wallet not created`));
                    });
            }
        });
    }

    /**
     * Fund an account so it can be created on the network
     * @param publickey
     * @param secret
     * @private
     */
    _createTestWallet(publickey, secret) {
        const url = `https://friendbot.stellar.org/?addr=${publickey}`;
        this.log(`Creating wallet -> ${url}`);
        return new Promise((resolve, reject) => {
            new HttpRequest({secure: true})
                .getUrl(url)
                .then(response => {
                    this.log(`Response received`);
                    this.log(response);
                    resolve(response);
                })
                .catch(reason => {
                    this.error(`Error occurred`);
                    this.error(reason);
                    reject(reason);
                })
        });
    }

    sendTransaction(cryptoBean, wallet_address, amount) {

    }

    /**
     * Get public address
     * Identifier serves as address
     * @param cryptoBean {CryptoBean}
     * @returns {Promise<CryptoAddress>}
     */
    createWalletAddress(cryptoBean) {
        return this._openWallet(cryptoBean)
            .then(value => {
                return Promise.resolve(new CryptoAddress(cryptoBean.identifier));
            })
            .catch(reason => Promise.reject(reason));
    }

    /**
     * Check bean is valid
     * @param cryptoBean
     * @returns {Promise<boolean>}
     * @private
     */
    _openWallet(cryptoBean) {
        if (Functions.isNull(cryptoBean)) {
            return Promise.reject(this.error(`bean cannot be null`));
        }

        if (cryptoBean instanceof CryptoBean) {

            this.log('bean is instance of CryptoBean');

            if (Functions.isNull(cryptoBean.identifier)) {
                return Promise.reject(this.error(`identifier cannot be null`));
            }

            if (Functions.isNull(cryptoBean.passPhrase)) {
                return Promise.reject(this.error(`passPhrase cannot be null`));
            }

            return Promise.resolve(true);
        } else {
            return Promise.reject(this.error(`bean not instance of CryptoBean`))
        }
    }

    /**
     * Get transactions
     * @param cryptoBean
     * @returns {Promise<boolean | []<CryptoTransaction>>}
     */
    getTransactions(cryptoBean) {
        this.log(`getBalance called`);
        return this._openWallet(cryptoBean)
            .then(value => {
                const self = this;
                return new Promise((resolve, reject) => {
                    this.server.transactions()
                        .forAccount(cryptoBean.identifier)
                        .call()
                        .then(page => {
                            if (page.records.length <= 0) {
                                reject(this.error(`No transactions`));
                            } else {
                                const transactions = [];
                                for (let i = 0; i < page.records.length; i++) {
                                    const record = page.records[i];
                                    transactions.push(new CryptoTransaction([cryptoBean.identifier], record.hash, Date.parse(record.created_at), record.fee_paid, record.fee_paid, record.fee_paid, record.operation_count, [record.source_account]));
                                }
                                this.log(`Transactions retrieved`);
                                resolve(transactions);
                            }
                        })
                        .catch(err => {
                            this.error(err);
                            reject(`No transactions`);
                        });
                });
            })
            .catch(reason => Promise.reject(reason));
    }

    /**
     * Doesn't support webhook
     * @returns {boolean}
     */
    isSupportWebHook() {
        return false;
    }

    /**
     * Wallet is valid
     * @param wallet_address
     * @returns {*}
     */
    isWalletValid(wallet_address) {
        if (Functions.isNull(wallet_address)) {
            return Promise.reject(this.error(`wallet_address cannot be null`));
        }
        this.log(`Checking if wallet is valid`);
        return new Promise((resolve, reject) => {
            this.server
                .loadAccount(wallet_address)
                .then(account => {
                    console.log(account);
                    resolve(account);
                })
                .catch(error => {
                    this.error(error);
                    reject(`wallet is invalid`);
                });
        });
    }

    /**
     * Get balance
     * @param cryptoBean {CryptoBean}
     */
    getBalance(cryptoBean) {
        this.log(`getBalance called`);
        if (Functions.isNull(cryptoBean)) {
            return Promise.reject(this.error(`bean cannot be null`));
        }

        if (cryptoBean instanceof CryptoBean) {

            this.log('bean is instance of CryptoBean');

            if (Functions.isNull(cryptoBean.identifier)) {
                return Promise.reject(this.error(`identifier cannot be null`));
            }

            if (Functions.isNull(cryptoBean.passPhrase)) {
                return Promise.reject(this.error(`passPhrase cannot be null`));
            }

            return this.isWalletValid(cryptoBean.identifier)
                .then(account => {
                    let balances = 0;
                    for (let i = 0; i < account.balances; i++) {
                        balances = account.balances[i].balance + balances;
                    }

                    return Promise.resolve(new CryptoBalance(balances, 0));
                })
                .catch(reason => {
                    return Promise.reject(this.error(`Failed to get transactions`));
                });
        } else {
            return Promise.reject(this.error(`bean not instance of CryptoBean`, true))
        }
    }

    static getName() {
        return "stellar";
    }
}