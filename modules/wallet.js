import Database from "../common/database";
import Error from "./errors";
import Functions from "./functions";
import uuidv4 from "uuid/v4";
import CryptoCore from "./cryptoCore";
import User from "./user-account";
import {CryptoBean} from "./cryptos/cryptostruct";
import totp from "otplib/totp";
import Mailer from "../routes/mailer";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";

export default class Wallet {

    static friends_table = "friends";
    static wallets_table = "wallets";
    /**
     * Users object
     * @type {User}
     */
    users;
    /**
     * Address table
     */
    static address_table = "address";

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
        return this.users.isUserValid(uid)
            .then(user => {

            })
    }

    /**
     * Add amount to crypto
     * @param uid
     * @param crypto
     * @param amount
     */
    loadWallet(uid, crypto, amount) {
    }

    static transaction_table = "transactions";

    /**
     * Send crypto to recipient crypto
     *
     * @param uid
     * @param crypto_type
     * @param crypto_address
     * @param amount
     * @param identifier id of wallet for request
     */
    sendMoneyToWallet(uid, crypto_type, crypto_address, amount, identifier) {
        let mCrypto;
        let mUser;
        const db = new Database();
        //Get the crypto interface
        return this.getCrypto(crypto_type)
        //Check if user is valid
            .then(value => {
                mCrypto = value;
                return this.users.isUserValid(uid);
            })
            //Check if the wallet is valid
            .then(user => {
                mUser = user;
                return mCrypto.isWalletValid(crypto_address);
            })
            .then(value => {
                //Send OTP to user requesting confirmation
                return this._storeTransactionForOTP(uid, mUser, db, crypto_type, crypto_address, amount, identifier)
            })
            .then(hashToken => {
                return Promise.resolve(Error.successError("Confirm transaction with OTP", {token:hashToken}));
            })
            .catch(reason => {
                return Promise.reject(reason);
            })
    }

    /**
     * Confirm a pending transaction
     * @param uid user id
     * @param otp {int}
     * @param token transaction token {string}
     * @returns {Promise<{} | never>}
     */
    confirmTransaction(uid, otp, token) {
        return this.users.isUserValid(uid)
            .then(user => {
                return this._confirmTransactionOTP(uid, otp, token);
            })
            .catch(reason => Promise.reject(reason));
    }

    /**
     * Confirm otp is correct
     * Send transaction to cryptoInterface
     * @param uid
     * @param otp
     * @param token
     * @returns {Promise<any>}
     * @private
     */
    _confirmTransactionOTP(uid, otp, token) {
        return new Promise((resolve, reject) => {
            const error = [];
            if (Functions.isNull(token)) {
                error.push({token: "token not set"});
            }
            if (Functions.isNull(otp)) {
                error.push({otp: "otp not set"});
            }

            if (!error.isEmpty()) {
                reject(Error.errorResponse(Error.INVALID_DATA, error));
            } else {
                const db = new Database();
                console.log(`Searching for user with matching hashToken ->user::${uid} && token::${token}`);
                db
                    .select(Wallet.transaction_table, {uid, hashToken: token, status:'pending'})
                    .then(transactions => {
                        const {
                            uid,
                            wallet_type, tokenSecret, crypto_address, amount, identifier } = transactions[0];

                        //Checking otp is valid
                        if (totp.check(otp, tokenSecret)) {
                            console.log('OTP was valid');
                            /**
                             * @type {CryptoInterface}
                             */
                            let mCrypto;
                            //Log token so it can be revoked later if necessary
                            return this.getCrypto(wallet_type)
                                .then(crypto => {
                                    //Retrieve the specified wallet
                                    mCrypto = crypto;
                                    return this._getWallets(uid, false, identifier);
                                })
                                .then(wallets => {
                                    let wallet = wallets[0];
                                    //Covert wallet to cryptoBean to send transaction
                                    return this.createCryptoBeanFromEncryptedWallet(wallet);
                                })
                                .then(cryptoBean => {
                                    return mCrypto.sendTransaction(cryptoBean, crypto_address, amount);
                                })
                                .then(cryptoTransaction => {
                                    //Updating transaction
                                    db.update(Wallet.transaction_table, {hashToken: token}, {status:'finished'});
                                    return Promise.resolve(Error.successError("Transaction sent", cryptoTransaction));
                                })
                                .catch(reason => {
                                    return Promise.reject(reason)
                                });
                        } else {
                            console.error('Incorrect OTP');
                            return Promise.reject(Error.INCORRECT_OTP);
                        }
                    })
                    .then(hash => {
                        resolve(Error.successError("Logged In. Add JWT to Header as `Authorization: Bearer {token}`", {token: hash}))
                    })
                    .catch(reason => {
                        console.log(reason);
                        if (reason === Error.NOT_CREATED) {
                            reject(Error.LOGIN_FAILED);
                        } else {
                            reject(reason);
                        }
                    })
                    .finally(() => {
                        db.close();
                    });
            }
        });
    }

    _storeTransactionForOTP(uid, user, db, wallet_type, crypto_address, amount, identifier) {
        console.log('Generating OTP for transaction');
        const tokenSecret = uuidv4();
        const otp = totp.generate(tokenSecret);
        //Token can be used to generate another OTP
        const hashToken = Functions.sha512(tokenSecret, user.salt);
        const self = this;

        return db.insert({
            uid, hashToken, tokenSecret, created_on: new Date().toISOString(),
            identifier, wallet_type, crypto_address, amount, status:"pending"
        })
            .then(value => {
                this.sendOTPEmail(user, otp);
                console.log(`OTP Generated -> ${hashToken.passwordHash}`);
                return Promise.resolve(hashToken.passwordHash);
            })
            .catch(reason => {
                this.log(reason);
                return Promise.reject(Error.TRANSACTION_NOT_BE_CREATED);
            })
    }

    mailer = new Mailer();

    /**
     * SEND OTP EMAIL
     * @param user
     * @param otp
     */
    sendOTPEmail(user, otp) {
        const from = `CryptoManager <${this.mailer.options.auth.user}>`;
        const mailSubject = "CryptoManager OTP";
        const mailBody =
            `Dear ${user.name},<br/>
            Kindly confirm transaction using this OTP code<br/>
            <h1>${otp}</h1>
            <br/>
            Best Regards,<br/>
            CryptoManager`;

        console.log('Sending registration email');
        this.mailer.sendMail(from, user.email, mailSubject, mailBody, [], function (resp) {
            console.log('Mail status: %s', JSON.stringify(resp));
            if (resp.error) {
                console.log(resp.error);
            }
            console.log('Mail sent');
        });
    }

    /**
     * Send money to a friend
     * @param uid
     * @param frnid
     * @param amount
     */
    sendMoneyToFriend(uid, frnid, amount) {
    }

    /**
     * Create new crypto on crypto_type
     * @param uid
     * @param crypto_type
     */
    createWallet(uid, crypto_type) {
        let mCrypto;
        let mCryptoBean;
        let mUser;
        let mWallet;
        return this.users
            .isUserValid(uid)
            .then(user => {
                mUser = user;
                this.log(`Get crypto`);
                return this.getCrypto(crypto_type);
            })
            .then(crypto => {
                mCrypto = crypto;
                this.log(`Creating wallet`);
                return mCrypto.createWallet(uuidv4());
            })
            .then(cryptoBean => {
                mCryptoBean = cryptoBean;
                this.log(`Encrypting wallet`);
                return this.createEncryptedWalletFromCryptoBean(uid, crypto_type, mCryptoBean);
            })
            .then(wallet => {
                this.log(`Storing wallet in db`);
                const db = new Database();
                mWallet = wallet;
                return db.insert(Wallet.wallets_table, wallet);
            })
            .then(value => {
                this.log(`Wallet created successfully`);
                return Promise.resolve(Error.successError("Wallet created", mWallet));
            })
            .catch(reason => {
                this.error(`Wallet could not be created`);
                this.error(reason);
                return Promise.reject(Error.WALLET_NOT_CREATED);
            });
    }

    /**
     * Encrypts cryptoBean returns wallet that can be stored in db
     * @param uid
     * @param crypto_type
     * @param cryptoBean
     * @returns {Promise<{uid: *, crypto_type: *, created_on: string, identifier: *, encryptedPassPhrase: string, encryptedData: string, encryptedUnlockIV: string, encryptedUnlockKey: string} | never>}
     */
    createEncryptedWalletFromCryptoBean(uid, crypto_type, cryptoBean) {
        const wallet = {
            uid,
            crypto_type,
            created_on: new Date().toISOString(),
            identifier: cryptoBean.identifier,
            encryptedPassPhrase: "",
            encryptedData: "", //Incase of bitcoin, this holds the recovery keys
            encryptedUnlockIV: "",
            encryptedUnlockKey: ""
        };
        //Encrypt cryptoBean with private password
        const password = Functions.genRandomString(32);
        const iv = Functions.genRandomString(16);

        return Functions.encryptWithPublicKey(password)
            .then(encryptPassword => {
                //Encrypt the password with pub key
                //We're encrypting the password and iv so we don't store them plain in the database
                wallet.encryptedUnlockKey = encryptPassword;
                return Promise.resolve(true);
            })
            .then(value => Functions.encryptWithPublicKey(iv))
            .then(encryptPasswordIV => {
                //Encrypt the iv with pub key
                wallet.encryptedUnlockIV = encryptPasswordIV;
                return Promise.resolve(true);
            })
            .then(value => Functions.encryptWithIV(cryptoBean.passPhrase, password, iv))
            .then(encryptedPP => {
                //Attach the tag to the string
                wallet.encryptedPassPhrase = encryptedPP;
                return Promise.resolve(true);
            })
            .then(value => Functions.encryptWithIV(JSON.stringify(cryptoBean.data), password, iv))
            .then(encryptedData => {
                wallet.encryptedData = encryptedData;
                //Encryption complete
                return Promise.resolve(wallet);
            })
            .catch(reason => {
                return Promise.reject(reason);
            });
    }

    /**
     * Decrypts an encrypted wallet | returns cryptobean to perform crypto functions
     * @param wallet
     * @returns {Promise<CryptoBean | never>}
     */
    createCryptoBeanFromEncryptedWallet(wallet) {
        const {
            identifier,
            encryptedPassPhrase,
            encryptedData, //Incase of bitcoin, this holds the recovery keys
            encryptedUnlockIV,
            encryptedUnlockKey,
        } = wallet;

        //Decrypt unlock key and unlock iv to get their real password
        let password = "";
        let iv = "";
        const cryptoBean = new CryptoBean();
        cryptoBean.identifier = identifier;
        return Functions.decryptWithPrivateKey(encryptedUnlockKey)
            .then(dePassword => {
                password = dePassword;
                return Functions.decryptWithPrivateKey(encryptedUnlockIV);
            })
            .then(deIV => {
                iv = deIV;
                return Functions.decryptWithIV(encryptedPassPhrase, password, iv);
            })
            .then(dePassPhrase => {
                cryptoBean.passPhrase = dePassPhrase;
                return Functions.decryptWithIV(encryptedData, password, iv);
            })
            .then(deData => {
                cryptoBean.data = JSON.parse(deData);
                return Promise.resolve(cryptoBean);
            })
            .catch(reason => Promise.reject(reason));
    }

    /**
     * Import a wallet
     * @param uid
     * @param crypto_type
     * @param wallet_address
     * @param private_key
     */
    importWallet(uid, crypto_type, wallet_address, private_key) {
        this.log(`Importing wallet -> ${uid}::${crypto_type}`);
        const db = new Database();
        return this.isWalletValid(wallet_address)
            .then(value => {
                return this.createEncryptedWalletFromCryptoBean(uid, crypto_type, new CryptoBean(wallet_address, private_key, {}));
            })
            .then(wallet => {
                this.log(`Storing wallet in db`);
                return db.insert(Wallet.wallets_table, wallet);
            })
            .then(value => {
                this.log(`Wallet imported`);
                return Promise.resolve(Error.successError("Wallet imported",));
            })
            .catch(reason => {
                return Promise.reject(Error.WALLET_NOT_IMPORTED);
            }).finally(() => {
                db.close();
            });
    }

    /**
     * Checks if a given wallet address is valid for the crypto type
     * @param crypto_type
     * @param wallet_address
     * @returns {Promise<{status: boolean, code: number, message: *, data: *} | never>}
     */
    isWalletValid(crypto_type, wallet_address) {
        this.log(`Checking wallet is valid -> ${crypto_type}::${wallet_address}`);
        return this.getCrypto(crypto_type)
            .then(crypto => {
                return crypto.isWalletValid(wallet_address)
            })
            .then(value => {
                return Promise.resolve(Error.successError("Wallet is valid"));
            })
            .catch(reason => {
                return Promise.reject(Error.INVALID_WALLET_ADDRESS);
            });
    }

    /**
     * Transactions in crypto
     * @param uid
     * @param crypto
     */
    getTransactions(uid, crypto) {
    }

    /**
     * Schedule payments to crypto by period
     * @param uid
     * @param period - supported daily, weekly, monthly
     * @param crypto
     * @param crypto_address
     * @param amount
     */
    scheduleTransaction(uid, period, crypto, crypto_address, amount) {
    }

    /**
     * Get Crypto
     * @param crypto
     * @returns {Promise<CryptoInterface>}
     */
    getCrypto(crypto) {
        if (Functions.isNull(crypto)) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, {crypto: "crypto is not defined"}));
        } else {
            //Check crypto is supported
            if (!CryptoCore.isSupported(crypto)) {
                return Promise.reject(Error.WALLET_NOT_SUPPORTED);
            } else {
                return Promise.resolve(CryptoCore.getCrypto(crypto));
            }
        }
    }

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
            errors.push({name: "name is not defined"})
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
                const data = {uid, frnid: uuidv4(), name, crypto, crypto_address, created_on: new Date().toISOString()};
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


    _getWallets(uid, sanitize, identifier) {
        let data = {uid};

        if (identifier) {
            data["identifier"] = identifier;
        }

        const db = new Database();
        return this.users.isUserValid(uid)
            .then(user => {
                return db.select(Wallet.wallets_table, data);
            })
            .then(wallets => {
                if (wallets.length >= 0) {
                    //There are wallets
                    let promises = [];
                    for (let i = 0; i < wallets.length; i++) {
                        let wallet = wallets[i];

                        if (sanitize) {
                            delete wallet["encryptedPassPhrase"];
                            delete wallet["encryptedData"];
                            delete wallet["encryptedUnlockIV"];
                            delete wallet["encryptedUnlockKey"];
                        }

                        let mCryptoBean;
                        promises.push(this.createCryptoBeanFromEncryptedWallet(wallet)
                            .then(cryptoBean => {
                                mCryptoBean = cryptoBean;
                                return this.getCrypto(wallet.crypto_type);
                            })
                            .then(crypto => {
                                return crypto.getBalance(mCryptoBean);
                            })
                            .then(value => {
                                wallet.balance = value;
                            })
                            .catch(reason => {

                            }));

                    }
                    return new Promise((resolve, reject) => {
                        Promise.all(promises)
                            .then(value => {

                            })
                            .catch(reason => {

                            })
                            .finally(() => {
                                return resolve(wallets);
                            });
                    });
                } else {
                    return Promise.reject(Error.WALLETS_NOT_FOUND);
                }
            })
            .catch(reason => {
                return Promise.reject(reason);
            })
            .finally(() => {
                db.close();
            });
    }

    getWallets(uid) {
        return this._getWallets(uid, true);
    }

    /**
     * Check if upper limit of amount to be held has been reached
     * Check if limit of daily/weekly reached
     */
    isAboveLimit() {
    }

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
     * Create address in a wallet
     * @param uid
     * @param crypto
     * @param identifier
     * @returns {Promise<{status: boolean, code: number, message: *, data: *} | never>}
     */
    createWalletAddress(uid, crypto, identifier) {
        let mCrypto;
        const db = new Database();
        return this.users.isUserValid(uid)
            .then(user => {
                return this.getCrypto(crypto);
            })
            .then(crypto => {
                mCrypto = crypto;

                return db.select(Wallet.wallets_table, {uid, identifier});
            })
            .then(results => {
                const result = results[0];
                return this.createCryptoBeanFromEncryptedWallet(result);
            })
            .then(cryptoBean => {
                return mCrypto.createWalletAddress(cryptoBean);
            })
            .then(cryptoAddress => {
                return db.insert(Wallet.address_table, {
                    uid,
                    crypto,
                    identifier,
                    created_on: new Date().toISOString(),
                    address: cryptoAddress.address
                });
            })
            .then(cryptoAddress => {
                return Promise.resolve(Error.successError("Wallet created", cryptoAddress));
            })
            .catch(reason => {
                return Promise.reject(Error.WALLET_ADDRESS_NOT_CREATED);
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
        return Error.errorResponse("Supported cryptos", CryptoInterface.supported_cryptos);
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
}