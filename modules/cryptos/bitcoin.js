import CryptoInterface from "./crypto-interface";
import Functions from "../functions";
import Error from "../errors";
import {CryptoAddress, CryptoBalance, CryptoBean, CryptoTransaction} from "./cryptostruct";
import uuidv4 from "uuid/v4";
import blocktrail from "blocktrail-sdk";
import WAValidator from "wallet-address-validator";

/**
 * BitcoinCrypto
 */
export default class BitcoinCrypto extends CryptoInterface {

    static webhook_id = "crypto-manager-webhook";
    static confirmations = 6;

    /**
     * webhook
     * @type {boolean}
     */
    isWebHookDone = false;

    /**
     * is crypto live
     * @type live {boolean}
     */
    live;

    /**
     * APIClient
     * @type client {APIClient}
     */
    client;

    /**
     * Setup
     * @param options {object}
     * @param baseurl {null}
     * @returns {Promise<boolean>}
     */
    setup(options = null, baseurl = null) {
        return new Promise((resolve, reject) => {
            this.log(`Setting up -> ${BitcoinCrypto.getName()}`);

            const cryptoConfig = Functions.isNull(options) ? Functions.getConfig("crypto-config") : options;

            if (Functions.isNull(cryptoConfig)) {
                reject(this.log("crypto-config not present in config or null passed to setup", true));
                return;
            }

            const bitcoinConfig = cryptoConfig.bitcoin;
            if (Functions.isNull(bitcoinConfig)) {
                reject(this.log("`bitcoin` object not present in config", true));
                return;
            }

            const apiKey = bitcoinConfig.apiKey;
            if (Functions.isNull(apiKey)) {
                reject(this.log(`apiKey cannot be null`, true));
                return;
            }
            const apiSecret = bitcoinConfig.apiSecret;
            if (Functions.isNull(apiSecret)) {
                reject(this.log(`apiSecret cannot be null`, true));
                return;
            }

            baseurl = (Functions.isNull(baseurl)) ? Functions.getConfig("base_url")+BitcoinCrypto.getName()+"/webhook":baseurl;

            if (Functions.isNull(baseurl)) {
                reject(this.error(`baseurl cannot be null`));
                return;
            }

            this.live = cryptoConfig.live;

            try {
                this.client = blocktrail.BlocktrailSDK({
                    apiKey: apiKey,
                    apiSecret: apiSecret,
                    network: "BTC",
                    testnet: true
                });
                resolve(true);
                this._setupWebHook(baseurl)
                    .then(value => {
                    })
                    .catch(reason => {
                    });
            } catch (e) {
                this.log(e, true);
                reject(this.log(`failed to setup blocktrail`, true));
            }
        });
    }

    /**
     * Setup a webhook to get new events on
     * @param baseurl
     * @returns {Promise<string>}
     * @private
     */
    _setupWebHook(baseurl) {
        this.log(`Setting up webhook on -> ${baseurl}`);
        return new Promise((resolve, reject) => {

            this.client.setupWebhook(baseurl, BitcoinCrypto.webhook_id,
                (err, result) => {
                    if (err) {
                        if (err.message === "A webhook with that identifier already exists") {
                            this.isWebHookDone = true;
                            this.error(err.message);
                            resolve(this.log(`Webhook already created`));
                        } else {
                            this.isWebHookDone = false;
                            this.error(err);
                            reject(this.error(`Failed to setup webhook`));
                        }
                    } else {
                        this.log(result);
                        this.isWebHookDone = true;
                        resolve(this.log(`Webhook created`));
                    }
                });
        });
    }

    /**
     * Listen for new events on address
     * @param address
     * @returns {Promise<boolean | string>}
     * @private
     */
    _subscribeAddressToWebHook(address) {
        return this.isWalletValid(address)
            .then(isValid => {
                return new Promise((resolve, reject) => {

                    this.log(`Subscribing address to webhook -> ${address}`);

                    this.client.subscribeAddressTransactions(BitcoinCrypto.webhook_id,
                        address, BitcoinCrypto.confirmations, (err, result) => {
                            if (err) {
                                this.error(err);
                                reject(this.error(`Address webhook subscription failed -> ${address}`));
                            } else {
                                console.log(result);
                                resolve(this.log(`Address webhook subscription successful -> ${address}`));
                            }
                        });
                });
            })
            .catch(reason => {
                return Promise.reject(reason);
            });
    }

    /**
     * Creates a new wallet
     *
     * @param name {string}
     * @returns {Promise<CryptoBean>}
     */
    createWallet(name) {
        if (Functions.isNull(name)) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, [{name: "wallet_name is not defined"}]))
        }

        const self = this;
        return new Promise((resolve, reject) => {
            this.log(`Creating -> ${BitcoinCrypto.getName()} wallet`);
            const generatePassPhrase = Functions.sha512(name, uuidv4()).passwordHash;
            this.log(generatePassPhrase);

            this.log(`Making create wallet call to blocktrail for ${name}`);

            self.client.createNewWallet(name, generatePassPhrase, function (err, wallet, backupInfo) {
                if (err) {
                    self.log(err, true);
                    reject(self.log(`Create wallet failed`, true));
                } else {
                    //Pull recovery keys for user - walletVersion, encryptedPrimarySeed, backupSeed, recoveryEncryptedSecret, encryptedSecret
                    let {walletVersion, encryptedPrimarySeed, backupSeed, recoveryEncryptedSecret, encryptedSecret} = backupInfo;
                    const data = {
                        walletVersion,
                        encryptedPrimarySeed,
                        backupSeed,
                        recoveryEncryptedSecret,
                        encryptedSecret
                    };
                    self.log(data);
                    self.log(generatePassPhrase);
                    self.log(name);
                    console.log(data);
                    resolve(new CryptoBean(name, generatePassPhrase, data));
                }
            });
        });
    }

    /**
     * Creates a new bitcoin address tied to this wallet
     * @param cryptoBean {CryptoBean}
     * @returns {Promise<Wallet | CryptoAddress>}
     */
    createWalletAddress(cryptoBean) {
        const self = this;
        return this._openWallet(cryptoBean)
            .then(wallet => {
                return new Promise((resolve, reject) => {
                    self.log(`Creating new address -> ${cryptoBean.identifier}`);
                    wallet.getNewAddress((err, address) => {
                        if (err) {
                            self.err(err);
                            reject(self.log(`could not generate new address`, true));
                        } else {
                            self.log(address);
                            this._subscribeAddressToWebHook(address)
                                .then(value => {
                                    resolve(new CryptoAddress(address));
                                })
                                .catch(reason => reject(reason));
                        }
                    });
                });
            })
            .catch(reason => Promise.reject(reason));
    }

    /**
     * Open wallet with passphrase
     * @param cryptoBean {CryptoBean}
     * @returns {Promise<Wallet>}
     * @private
     */
    _openWallet(cryptoBean) {
        const self = this;
        this.log(`openWallet called`);
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

            return new Promise((resolve, reject) => {
                self.log(`Initialising wallet for -> ${cryptoBean.identifier}`);
                self.client.initWallet(cryptoBean.identifier, cryptoBean.passPhrase, function (err, wallet) {
                    if (err) {
                        self.error(err);
                        reject(self.error(`could not initialise wallet incorrect identifier or passPhrase`));
                    } else {
                        resolve(wallet);
                    }
                });
            });
        } else {
            return Promise.reject(this.error(`bean not instance of CryptoBean`));
        }
    }

    /**
     * Check wallet valid
     * @param wallet_address {string}
     * @returns {Promise<boolean>}
     */
    isWalletValid(wallet_address) {
        if (Functions.isNull(wallet_address)) {
            return Promise.reject(this.error(`wallet_address cannot be null`));
        }
        this.log(`checking address valid -> ${wallet_address}`);
        const valid = WAValidator.validate(wallet_address, 'BTC', this.live ? "prod" : "testnet");

        if (valid) {
            this.log(`wallet is valid`);
            return Promise.resolve(true);
        } else {
            return Promise.reject(this.error(`wallet is invalid`));
        }
    }

    /**
     * Get balance in wallet
     * @param wallet {Wallet}
     * @returns {Promise<CryptoBalance>}
     * @private
     */
    _getBalanceInternal(wallet) {
        this.log(`getting balance`);
        const self = this;
        return new Promise((resolve, reject) => {
            wallet.getBalance(function (err, confirmedBalance, unconfirmedBalance) {
                if (err) {
                    self.error(err);
                    reject(self.error(`Could not get balance`));
                } else {
                    self.log(`Balance retrieved`);

                    const cBalance = parseFloat(blocktrail.toBTC(confirmedBalance));
                    const uBalance = parseFloat(blocktrail.toBTC(unconfirmedBalance));
                    self.log('Balance: ', cBalance);
                    self.log('Unconfirmed Balance: ', uBalance);

                    resolve(new CryptoBalance(cBalance, uBalance));
                }
            });
        });
    }

    /**
     * Get balance in wallet
     *
     * @param cryptoBean {CryptoBean}
     * @returns {Promise<Wallet | CryptoBalance>}
     */
    getBalance(cryptoBean) {
        const self = this;
        return this._openWallet(cryptoBean)
            .then(wallet => {
                return self._getBalanceInternal(wallet);
            })
            .catch(reason => Promise.reject(reason));

    }

    /**
     * Send bitcoin to address
     * @param cryptoBean
     * @param wallet_address
     * @param amount
     * @returns {*}
     */
    sendTransaction(cryptoBean, wallet_address, amount) {
        const self = this;
        this.log(`sendTransaction called`);
        if (Functions.isNull(amount)) {
            return Promise.reject(self.error(`amount cannot be null`));
        }
        if (isNaN(amount)) {
            return Promise.reject(self.error(`amount cannot be NaN, must be a number`));
        }
        if (amount < 0) {
            return Promise.reject(self.error(`amount cannot be negative`));
        }

        return this.isWalletValid(wallet_address)
            .then((isvalid) => this._openWallet(cryptoBean))
            .then(wallet => {
                return self._getBalanceInternal(wallet)
                    .then(balance => {
                        return Promise.resolve({wallet: wallet, balance: balance});
                    })
                    .catch(reason => Promise.reject(reason));
            })
            .then(props => {
                const {wallet, balance} = props;
                self.log(balance);
                if (amount > (balance.unconfirmedBalance + balance.confirmedBalance)) {
                    return Promise.reject(self.error(`Not enough money in wallet`));
                }

                return new Promise((resolve, reject) => {
                    const value = blocktrail.toSatoshi(amount);
                    const data = {};
                    data[wallet_address] = value;

                    self.log(`Sending payment to blockchain for -> ${wallet_address}`);
                    wallet.pay(data,
                        function (err, transactionId) {
                            if (err) {
                                self.error(err);
                                reject(self.error(`Could not send transaction`));
                            } else {
                                self.log(`Transaction sent`);
                                self.log(transactionId);
                                resolve(new CryptoTransaction(wallet_address, transactionId));
                            }
                        });
                });
            })
            .catch(reason => Promise.reject(reason));
    }

    /**
     * Convert from satoshi to BTC
     * @param amount
     * @returns {number}
     * @private
     */
    _toBtc(amount) {
        return parseFloat(blocktrail.toBTC(amount));
    }


    /**
     * Get transactions
     *
     * @param cryptoBean
     * @returns {Promise<Wallet | []<CryptoTransaction>>}
     */
    getTransactions(cryptoBean) {
        const self = this;
        return this._openWallet(cryptoBean)
            .then(wallet => {
                return new Promise((resolve, reject) => {
                    wallet.transactions(function (err, transactions) {
                        if (err) {
                            self.error(err);
                            reject(self.error(`Could not retrieve transactions`));
                        } else {
                            self.log(`Transactions retrieved`);
                            if (Functions.isNull(transactions.data) || transactions.data.length <= 0) {
                                reject(self.error(`No transactions`));
                            } else {
                                const d = [];
                                for (let i = 0; i < transactions.data.length; i++) {
                                    const transaction = transactions.data[i];
                                    // console.log('---INPUT---');
                                    // console.log(transaction.inputs); //Destination funds
                                    // console.log('---OUTPUT---');
                                    // console.log(transaction.outputs); //Source funds
                                    // console.log('---WALLET---');
                                    // console.log(transaction.wallet);

                                    let outputs = [];
                                    for (let j = 0; j < transaction.outputs.length; j++) {
                                        outputs.push(transaction.outputs[j].address);
                                    }
                                    let inputs = [];
                                    for (let j = 0; j < transaction.inputs.length; j++) {
                                        inputs.push(transaction.inputs[j].address);
                                    }
                                    d.push(new CryptoTransaction(inputs, transaction.hash,
                                        transaction.time, self._toBtc(transaction.total_fee), self._toBtc(transaction.total_input_value), self._toBtc(transaction.total_output_value), transaction.confirmations, outputs));
                                }
                                resolve(d);
                            }
                        }
                    });
                });
            })
            .catch(reason => Promise.reject(reason));
    }

    onNewEvent(data) {

    }

    static getName() {
        return "bitcoin";
    }


    getCurrency() {
        return "BTC";
    }
}