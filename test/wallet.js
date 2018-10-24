import 'babel-polyfill'
import uuidv4 from "uuid/v4";
import Wallet from "../modules/wallet";
import {expect} from "chai";
import {CryptoBean} from "../modules/cryptos/cryptostruct";

describe('wallet test', function () {
    const bean = new CryptoBean(
        'cryptomanager-test-wallet-1',
        'b23446729680878c2f053ecdec6c054a6d6fadda1b114784bbafe1ba64925a175248b4616acae9cec2bc00fb2e9948ee2caee18cc65d915d59851a13ed458878',
        { walletVersion: 'v3',
            encryptedPrimarySeed: 'library fantasy luxury burden knock regret witness until poem amount abandon abstract mobile pig half predict belt today crumble supreme student erode crouch island banana loop shield mutual order idea roof uncle grit mention essence orbit liquid issue ordinary cupboard divert puppy short obscure fiscal sample conduct armed entry main final add leaf embody curve twenty brain noodle roast demand',
            backupSeed: 'crew resist cake hood toss alley horse fortune surprise copper series issue kidney recycle then arm detect tumble speed size dove bomb cute embark',
            recoveryEncryptedSecret: 'library female venue taxi woman enforce party smooth arrow session abandon absurd artwork prevent box control axis fossil anxiety cup fatigue surface depart success outdoor profit negative spend industry pupil member aim feature property weekend loan staff grab split salt little town vote unable spring beyond february dinner mask habit explain often model warrior uncover length staff hub spin bracket',
            encryptedSecret: 'library family unfold symbol mass pitch proud pottery distance session abandon absorb shop fall write blush remember ethics bone crumble mixture used size obey left song toy move fragile good pumpkin endorse assist drive board dice expire people diary chapter satisfy face vendor client exercise fly grunt mammal solution head ecology title anxiety muffin pretty split initial fan project crane' }
    );
    describe('createEncryptedWalletFromCryptoBean', function () {
        const wallet = new Wallet();
        it('should pass all config', async () => {
            try {
                const result = await wallet.createEncryptedWalletFromCryptoBean(uuidv4(), 'bitcoin', bean);
                console.log(result);
                expect(result).to.be.an('object');
            } catch (e) {
                expect(e).to.be.an("undefined");
            }
        });
    });

    describe('createCryptoBeanFromEncryptedWallet', function () {
        const wallet = new Wallet();
        it('should pass all config', async () => {
            try {
                const encryptedWallet = await wallet.createEncryptedWalletFromCryptoBean(uuidv4(), 'bitcoin', bean);
                const result = await wallet.createCryptoBeanFromEncryptedWallet(encryptedWallet);
                console.log(result);
                expect(result).to.be.instanceOf(CryptoBean);
                expect(result.passPhrase).to.equal(bean.passPhrase);
                expect(result.identifier).to.equal(bean.identifier);
            } catch (e) {
                console.log(e);
                expect(e).to.be.an("undefined");
            }
        });
    });

    // describe('get wallets', function () {
    //     const wallet = new Wallet();
    //     it('should pass all config', async () => {
    //         try {
    //             const encryptedWallet = await wallet.getWallets(uuidv4(), 'bitcoin', bean);
    //             console.log(result);
    //             expect(result).to.be.instanceOf(CryptoBean);
    //             expect(result.passPhrase).to.equal(bean.passPhrase);
    //             expect(result.identifier).to.equal(bean.identifier);
    //         } catch (e) {
    //             console.log(e);
    //             expect(e).to.be.an("undefined");
    //         }
    //     });
    // });
});