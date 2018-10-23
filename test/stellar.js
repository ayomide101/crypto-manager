import 'babel-polyfill'
import StellarCrypto from "../modules/cryptos/stellar";
import {expect} from "chai";
import {CryptoAddress, CryptoBalance, CryptoBean} from "../modules/cryptos/cryptostruct";

describe('stellar test', () => {
    let stellar = new StellarCrypto();

    describe('setup stellar', function () {
        it('should pass if config invalid', async () => {
            try {
                let result = await stellar.setup({});
                expect(result).to.equal(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if config valid', async () => {
            try {
                let result = await stellar.setup(null);
                expect(result).to.equal(true);
            } catch (e) {
                expect(e).to.equal(undefined);
            }
        });
    });

    describe('create wallet', function () {
        before(async () => {
            const result = await stellar.setup();
            expect(result).to.equal(true);
        });

        it('should pass if name invalid', async () => {
            try {
                let result = await stellar.createWallet(null);
                expect(result).to.equal(undefined);
            } catch (e) {
                expect(e).to.equal(`wallet_name is not defined`);
            }
        });

        it('should pass if wallet created', async () => {
            try {
                let result = await stellar.createWallet("test-wallet");
                expect(result).to.be.instanceOf(CryptoBean);
            } catch (e) {
                expect(e).to.equal(undefined);
            }
        });
    });

    describe('wallet valid', function () {
        before(async () => {
            const result = await stellar.setup();
            expect(result).to.equal(true);
        });

        it('should pass if wallet invalid', async () => {
            try {
                let result = await stellar.isWalletValid(null);
                expect(result).to.equal(undefined);
            } catch(e) {
                expect(e).to.equal('wallet_address cannot be null');
            }
        });

        it('should pass if wallet valid', async () => {
            try {
                let result = await stellar.isWalletValid("");
                expect(result).to.be.an("object");
            } catch (e) {
                expect(e).to.equal(undefined);
            }
        });
    });

    describe('get balance', function () {
        before(async () => {
            const result = await stellar.setup();
            expect(result).to.equal(true);
        });

        it('should pass if wallet null', async () => {
            try {
                let result = await stellar.getBalance(null);
                expect(result).to.equal(undefined);
            } catch(e) {
                expect(e).to.equal('bean cannot be null');
            }
        });

        it('should pass if wallet valid', async () => {
            try {
                let result = await stellar.getBalance(new CryptoBean(""));
                expect(result).to.be.instanceOf(CryptoBalance);
            } catch (e) {
                expect(e).to.equal(undefined);
            }
        });
    });

    describe('create wallet address', function () {
        before(async () => {
            const result = await stellar.setup();
            expect(result).to.equal(true);
        });

        it('should pass if bean is null', async () => {
            try {
                const result = await stellar.createWalletAddress(null);
                expect(result).to.be.instanceOf(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass bean not instance of CryptoBean', async () => {
            try {
                const result = await stellar.createWalletAddress({});
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase is null', async () => {
            try {
                const result = await stellar.createWalletAddress(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if identifier is null', async () => {
            try {
                const result = await stellar.createWalletAddress(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase & identifier are correct', async () => {
            try {
                const result = await stellar.createWalletAddress(new CryptoBean(
                    '',
                    ''
                ));
                expect(result).to.be.instanceOf(CryptoAddress);
            } catch (e) {
                expect(e).to.equal('could not generate new address');
            }
        });
    });

    describe('get transactions', function () {
        before(async () => {
            const result = await stellar.setup();
            expect(result).to.equal(true);
        });

        it('should pass if bean is null', async () => {
            try {
                const result = await stellar.getTransactions(null);
                expect(result).to.be.instanceOf(undefined);
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass bean not instance of CryptoBean', async () => {
            try {
                const result = await stellar.getTransactions({});
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if passPhrase is null', async () => {
            try {
                const result = await stellar.getTransactions(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass if identifier is null', async () => {
            try {
                const result = await stellar.getTransactions(new CryptoBean());
            } catch (e) {
                expect(e).to.be.a('string');
            }
        });

        it('should pass no transactions', async () => {
            try {
                const result = await stellar.getTransactions(new CryptoBean(
                    '',
                    ''
                ));
                expect(result).to.not.be.an('array');
            } catch (e) {
                expect(e).to.equal('No transactions');
            }
        });

        it('should pass has transactions', async () => {
            try {
                const result = await stellar.getTransactions(new CryptoBean(
                    'cryptomanager-test-wallet-2',
                    ''
                ));
                expect(result).to.be.an('array').that.is.not.empty;
            } catch (e) {
                expect(e).to.equal('No transactions');
            }
        });
    });
});