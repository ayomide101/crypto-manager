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
        this.log(`Creat wallet call received for staller`);
        if (Functions.isNull(name)) {
            return Promise.reject(this.error("wallet_name is not defined"));
        }

        // Derive Keypair object and public key (that starts with a G) from the secret
        const newAccount = StellarSdk.Keypair.random();

        // this.log('New key pair created!');
        // this.log(` Account ID: ${newAccount.publicKey()}`);
        // this.log(` Secret : ${newAccount.secret()}`);

        return new Promise((resolve, reject) => {
            this.log(`Creating -> ${StellarCrypto.getName()} wallet`);

            if (this.live) {
            } else {
                this._createTestWallet(newAccount.publicKey(), newAccount.secret())
                    .then(value => {
                        this.log(`Wallet created`);
                        resolve(new CryptoBean(newAccount.publicKey(), newAccount.secret(), {}));
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

    _getTransactionFromBlockWith(url) {
        this.log(`Getting transaction with -> ${url}`);
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

    /**
     *
     * @param cryptoBean
     * @param receiver_wallet_address
     * @param amount
     * @returns {*}
     */
    sendTransaction(cryptoBean, receiver_wallet_address, amount) {

        this.log(`sendTransaction called`);
        if (Functions.isNull(amount)) {
            return Promise.reject(this.error(`amount cannot be null`));
        }
        if (isNaN(amount)) {
            return Promise.reject(this.error(`amount cannot be NaN, must be a number`));
        }
        if (amount < 0) {
            return Promise.reject(this.error(`amount cannot be negative`));
        }

        return this.isWalletValid(receiver_wallet_address)
            .then(result => {
                return this._openWallet(cryptoBean);
            })
            .then(account => {
                return this._getBalanceWithAccount(account)
                    .then(balance => {
                        this.log(balance);
                        return Promise.resolve({account, balance});
                    })
                    .catch(reason => Promise.reject(reason));
            })
            .then(data => {
                const {account, balance} = data;

                if (amount > (balance.unconfirmedBalance + balance.confirmedBalance)) {
                    return Promise.reject(this.error(`not enough money in wallet`));
                }

                this.log(`Sending payment to blockchain for -> ${receiver_wallet_address}`);

                return new Promise((resolve, reject) => {

                    const transactiondata =  {
                        destination: receiver_wallet_address,
                            asset: StellarSdk.Asset.native(),
                        amount: amount+""
                    };

                    console.log(`Stellar transaction data -> ${JSON.stringify(transactiondata)}`);

                    const transaction = new StellarSdk.TransactionBuilder(account)
                        .addOperation(StellarSdk.Operation.payment(transactiondata))
                        .build();

                    this.log(`Signing transaction -> ${StellarCrypto.getName()}`);

                    transaction.sign(StellarSdk.Keypair.fromSecret(cryptoBean.passPhrase)); // sign the transaction

                    this.log(transaction.toEnvelope().toXDR('base64'));

                    this.server.submitTransaction(transaction)
                        .then(transactionResult => {
                            this.log(transactionResult);

                            this.log(JSON.stringify(transactionResult, null, 2));
                            this.log('\nSuccess! View the transaction at: ');
                            const transactionLink = transactionResult._links.transaction.href;

                            this.log(`Pulling transaction information via -> ${transactionLink}`);
                            new HttpRequest({secure: true})
                                .getUrl(transactionResult._links.transaction.href)
                                .then(transaction => {
                                    // this.log("------TRANSACTION INFO-----");
                                    // this.log(transaction);

                                    const cryptoTransaction = new CryptoTransaction();

                                    cryptoTransaction.fee = transaction.fee_paid;
                                    cryptoTransaction.confirmations = transaction.operation_count;

                                   return Promise.resolve({paymentLink:transaction._links.operations.href.replace("{?cursor,limit,order}", ""), cryptoTransaction});
                                })
                                .then(props => {
                                    const {paymentLink, cryptoTransaction} = props;

                                    this.log(`Pulling payment information via -> ${paymentLink}`);

                                    new HttpRequest({secure:true})
                                        .getUrl(paymentLink)
                                        .then(payment => {
                                            // this.log("------PAYMENTS INFO-----");
                                            // this.log(payment);
                                            const paymentInformation = payment._embedded.records[0];
                                            // this.log("--------PAYMENT INFO-----");
                                            // this.log(paymentInformation);

                                            if (paymentInformation['type'] === 'create_account') {
                                                cryptoTransaction.source_addresses = [paymentInformation.funder];
                                                cryptoTransaction.dest_addresses = [paymentInformation.account];
                                                cryptoTransaction.type = 'create_account';
                                                cryptoTransaction.amount_in = parseFloat(paymentInformation.starting_balance);
                                                cryptoTransaction.amount_out = parseFloat(paymentInformation.starting_balance);
                                            } else if (paymentInformation['type'] === 'payment') {
                                                cryptoTransaction.source_addresses = [paymentInformation.from];
                                                cryptoTransaction.dest_addresses = [paymentInformation.to];
                                                cryptoTransaction.type = 'payment';
                                                cryptoTransaction.amount_in = parseFloat(paymentInformation.amount);
                                                cryptoTransaction.amount_out = parseFloat(paymentInformation.amount);
                                            }

                                            cryptoTransaction.time = Date.parse(paymentInformation.created_at);
                                            cryptoTransaction.hash = paymentInformation.transaction_hash;

                                            // this.log("-----CRYPTO INFO-----");
                                            // this.log(cryptoTransaction);
                                            // this.log("-----CRYPTO END-----");
                                            resolve(cryptoTransaction);
                                        })
                                        .catch(reason => {
                                            this.error(reason);
                                            reject(this.error(`Transaction sent but could not pull payment info`));
                                        });
                                })
                                .catch(reason => {
                                    this.error(reason);
                                    reject(this.error(`Transaction sent but could not pull tran info`));
                                });
                        })
                        .catch(reason => {
                            this.error(reason);
                            reject(reason);
                        });
                });
            })
            .then(transactionResult => {
                return Promise.resolve(transactionResult);
            })
            .catch(reason => Promise.reject(reason));
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
     * @returns {Promise<{}>}
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

            return this.isWalletValid(cryptoBean.identifier);
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
                return new Promise((resolve, reject) => {
                    // this.server.transactions()
                    this.server.operations()
                        .forAccount(cryptoBean.identifier)
                        .call()
                        .then(page => {
                            if (page.records.length <= 0) {
                                reject(this.error(`No transactions`));
                            } else {
                                const transactions = [];
                                const promises = [];
                                for (let i = 0; i < page.records.length; i++) {
                                    const record = page.records[i];

                                    const cryptoTransaction = new CryptoTransaction();

                                    if (record['type'] === 'create_account') {
                                        cryptoTransaction.source_addresses = [record.funder];
                                        cryptoTransaction.dest_addresses = [record.account];
                                        cryptoTransaction.type = 'create_account';
                                        cryptoTransaction.amount_in = parseFloat(record.starting_balance);
                                        cryptoTransaction.amount_out = parseFloat(record.starting_balance);
                                    } else if (record['type'] === 'payment') {
                                        cryptoTransaction.source_addresses = [record.from];
                                        cryptoTransaction.dest_addresses = [record.to];
                                        cryptoTransaction.type = 'payment';
                                        cryptoTransaction.amount_in = parseFloat(record.amount);
                                        cryptoTransaction.amount_out = parseFloat(record.amount);
                                    }

                                    cryptoTransaction.time = Date.parse(record.created_at);
                                    cryptoTransaction.hash = record.transaction_hash;
                                    promises.push(record.transaction()
                                        .then(transaction => {
                                            // this.log('-----TRANSACTION----');
                                            // this.log(transaction);
                                            cryptoTransaction.fee = transaction.fee_paid;
                                            cryptoTransaction.confirmations = transaction.operation_count;
                                        }).catch(reason => {
                                            this.error(reason);
                                        })
                                        .finally(() => {
                                            transactions.push(cryptoTransaction);
                                        })
                                    );


                                }
                                this.log(`Transactions retrieved`);
                                Promise.all(promises).then(value1 => {
                                    // this.log('--------CRYPTOTRANSACIONS-----');
                                    // this.log(transactions);
                                    resolve(transactions);
                                }).catch(reason => {
                                    this.error(reason);
                                    reject(this.error(`Could not load transactions`));
                                });
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
                    this.log(`Account loaded -> ${wallet_address}`);
                    resolve(account);
                })
                .catch(error => {
                    this.error(error);
                    reject(this.error(`wallet is invalid`));
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
                    for (let i = 0; i < account.balances.length; i++) {
                        balances = parseFloat(account.balances[i].balance) + balances;
                    }

                    console.log(`Balance -> ${balances}`);
                    return Promise.resolve(new CryptoBalance(balances, 0));
                })
                .catch(reason => {
                    return Promise.reject(this.error(`Failed to get transactions`));
                });
        } else {
            return Promise.reject(this.error(`bean not instance of CryptoBean`, true))
        }
    }

    /**
     * Get balance with account
     * @param account
     * @returns {Promise<CryptoBalance>}
     * @private
     */
    _getBalanceWithAccount(account) {
        let balances = 0;
        for (let i = 0; i < account.balances.length; i++) {
            balances = parseFloat(account.balances[i].balance) + balances;
        }

        return Promise.resolve(new CryptoBalance(balances, 0));
    }

    static getName() {
        return "stellar";
    }


    getCurrency() {
        return "LUM";
    }
}