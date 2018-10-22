import 'babel-polyfill'
import BitcoinCrypto from "../modules/cryptos/bitcoin";
import {expect, request, assert} from 'chai';
import Error from "../modules/errors";
import {CryptoAddress, CryptoBalance, CryptoBean, CryptoTransaction} from "../modules/cryptos/cryptostruct";

describe('bitcoin test', () => {
    let bitcoin = new BitcoinCrypto();
    describe('setup bitcoin', () => {
        it('should pass when wrong config sent', async () => {
            try {
                let result = await bitcoin.setup({});
                expect(result).to.be.instanceOf('undefined');
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass when using right config', async () => {
            let result = await bitcoin.setup();
            expect(result).to.equal(true);
        });
    });

    describe('create wallet', () => {

        before(async () => {
            const result = await bitcoin.setup();
            expect(result).to.equal(true);
        });

        it('should pass because name not set', async () => {
            try {
                const result = await bitcoin.createWallet(null);
            } catch (reason) {
                expect(reason.message).to.eq(Error.INVALID_DATA.message);
            }
        });

        it('should return private key and wallet address', async () => {

            try {
                const result = await bitcoin.createWallet("cryptomanager-test-wallet-3");
                expect(result).to.be.instanceOf(CryptoBean)
            } catch (e) {
                expect(e).to.equal(undefined);
            }
        }).timeout(10000);
    });

    describe('create wallet address', () => {
        before(async () => {
            const result = await bitcoin.setup();
            expect(result).to.equal(true);
        });

        it('should pass if bean is null', async () => {
            try {
                const result = await bitcoin.createWalletAddress(null);
                expect(result).to.be.instanceOf(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass bean not instance of CryptoBean', async () => {
            try {
                const result = await bitcoin.createWalletAddress({});
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase is null', async () => {
            try {
                const result = await bitcoin.createWalletAddress(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if identifier is null', async () => {
            try {
                const result = await bitcoin.createWalletAddress(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase & identifier are incorrect', async () => {
            try {
                const result = await bitcoin.createWalletAddress(new CryptoBean(
                    'dasdfasdfasdf',
                    'adsfasdfasdasfasdfasdfsdf'
                ));
            } catch (e) {
                expect(e).to.be.a('string');
            }
        }).timeout(5000);

        it('should pass if passPhrase & identifier are correct', async () => {
            try {
                const result = await bitcoin.createWalletAddress(new CryptoBean(
                    '',
                    ''
                ));
                expect(result).to.be.instanceOf(CryptoAddress);
            } catch (e) {
                expect(e).to.equal('could not generate new address');
            }
        }).timeout(5000);
    });

    describe('check wallet valid', () => {
        before(async () => {
            const result = await bitcoin.setup();
            expect(result).to.equal(true);
        });

        it('should pass address is null', async () => {
            try {
                const result = await bitcoin.isWalletValid();
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass address is invalid', async () => {
            try {
                const result = await bitcoin.isWalletValid("adfasd");
            } catch (e) {
                expect(e).to.equal("wallet is invalid");
            }
        });

        it('should pass address is valid', async () => {
            try {
                const result = await bitcoin.isWalletValid("2NELkod94FciEYVfdSPmYFchBjKTUzXy8Bj");
                expect(result).to.equal(true);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });
    });

    describe('get wallet balance', () => {
        before(async () => {
            const result = await bitcoin.setup();
            expect(result).to.equal(true);
        });

        it('should pass if bean is null', async () => {
            try {
                const result = await bitcoin.getBalance(null);
                expect(result).to.be.instanceOf(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass bean not instance of CryptoBean', async () => {
            try {
                const result = await bitcoin.getBalance({});
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase is null', async () => {
            try {
                const result = await bitcoin.getBalance(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if identifier is null', async () => {
            try {
                const result = await bitcoin.getBalance(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase & identifier are incorrect', async () => {
            try {
                const result = await bitcoin.getBalance(new CryptoBean(
                    '',
                    ''
                ));
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase & identifier are correct', async () => {
            try {
                const result = await bitcoin.getBalance(new CryptoBean(
                    '',
                    ''
                ));
                expect(result).to.be.instanceOf(CryptoBalance);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        }).timeout(5000);
    });

    describe('send transaction', () => {
        before(async () => {
            const result = await bitcoin.setup();
            expect(result).to.equal(true);
        });

        it('should pass if bean is null', async () => {
            try {
                const result = await bitcoin.sendTransaction(null);
                expect(result).to.be.instanceOf(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass bean not instance of CryptoBean', async () => {
            try {
                const result = await bitcoin.sendTransaction({});
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if amount is null', async () => {
            try {
                const result = await bitcoin.sendTransaction(null, null, null);
            } catch (e) {
                expect(e).to.equal(`amount cannot be null`);
            }
        });

        it('should pass if amount is nan', async () => {
            try {
                const result = await bitcoin.sendTransaction(null, null, "amount");
            } catch (e) {
                expect(e).to.equal(`amount cannot be NaN, must be a number`);
            }
        });

        it('should pass if amount is negative', async () => {
            try {
                const result = await bitcoin.sendTransaction(null, null, -1);
            } catch (e) {
                expect(e).to.equal(`amount cannot be negative`);
            }
        });

        it('should pass address is null', async () => {
            try {
                const result = await bitcoin.sendTransaction();
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass address is invalid', async () => {
            try {
                const result = await bitcoin.sendTransaction(null, "adfasd", 1);
            } catch (e) {
                expect(e).to.equal("wallet is invalid");
            }
        });

        it('should pass address is valid', async () => {
            try {
                const result = await bitcoin.sendTransaction(null, "", 1);
                expect(result).to.equal(true);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase is null', async () => {
            try {
                const result = await bitcoin.sendTransaction(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if identifier is null', async () => {
            try {
                const result = await bitcoin.sendTransaction(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase & identifier are incorrect', async () => {
            try {
                const result = await bitcoin.sendTransaction(new CryptoBean(
                    '',
                    ''
                ));
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if amount more than balance', async () => {
            try {
                const result = await bitcoin.sendTransaction(new CryptoBean(
                    '',
                    ''
                ), '', 2000);
                expect(result).to.be.instanceOf(CryptoTransaction);
            } catch (e) {
                expect(e).to.equal('Not enough money in wallet');
            }
        }).timeout(10000);

        it('should pass enough money in account and valid address', async () => {
            try {
                const result = await bitcoin.sendTransaction(new CryptoBean(
                    '',
                    ''
                ), '', 0.004);
                expect(result).to.be.instanceOf(CryptoTransaction);
            } catch (e) {
                console.log(e);
                expect(e).to.equal('Not enough money in wallet');
            }
        }).timeout(10000);
    });

    describe('get transactions', function () {
        before(async () => {
            const result = await bitcoin.setup();
            expect(result).to.equal(true);
        });

        it('should pass if bean is null', async () => {
            try {
                const result = await bitcoin.getTransactions(null);
                expect(result).to.be.instanceOf(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass bean not instance of CryptoBean', async () => {
            try {
                const result = await bitcoin.getTransactions({});
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase is null', async () => {
            try {
                const result = await bitcoin.getTransactions(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if identifier is null', async () => {
            try {
                const result = await bitcoin.getTransactions(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase & identifier are incorrect', async () => {
            try {
                const result = await bitcoin.getTransactions(new CryptoBean(
                    'dasdfasdfasdf',
                    'adsfasdfasdasfasdfasdfsdf'
                ));
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if transactions exists', async () => {
            try {
                const result = await bitcoin.getTransactions(new CryptoBean(
                    '',
                    ''
                ));
                console.log(result);
                expect(result).to.be.an('array').that.is.not.empty;
            } catch (e) {
                expect(e).to.equal('No transactions');
            }
        }).timeout(10000);

        it('should pass no transactions', async () => {
            try {
                const result = await bitcoin.getTransactions(new CryptoBean(
                    '',
                    ''
                ));
                console.log(result);
                expect(result).to.not.be.an('array');
            } catch (e) {
                expect(e).to.equal('No transactions');
            }
        }).timeout(10000);
    });
});