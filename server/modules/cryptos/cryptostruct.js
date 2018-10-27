
export class CryptoBean {
    identifier; //In case of stellar, this is the public-key\wallet-address
    data; //In case of bitcoin, this contains the recovery information
    passPhrase; //The private key for the wallet

    constructor(identifier, passPhrase, data) {
        this.identifier = identifier;
        this.passPhrase = passPhrase;
        this.data = data;
    }
}

export class CryptoAddress {
    address;

    constructor(address) {
        this.address = address;
    }
}

export class CryptoBalance {
    confirmedBalance;
    unconfirmedBalance;


    constructor(confirmedBalance, unconfirmedBalance) {
        this.confirmedBalance = confirmedBalance;
        this.unconfirmedBalance = unconfirmedBalance;
    }
}

export class CryptoTransaction {
    /**
     * Array of receiving dest_addresses
     * @type []
     */
    dest_addresses;
    /**
     * Array of sending dest_addresses
     * @type []
     */
    source_addresses;
    hash;
    /**
     * UTC timestamp
     * @type int
     */
    time;
    fee;
    amount_in;
    amount_out;
    confirmations;
    type;

    constructor(addresses, hash, time, fee, amount_in, amount_out, confirmations, source_addresses, type) {
        this.dest_addresses = addresses;
        this.hash = hash;
        this.fee = fee;
        this.time = time;
        this.amount_in = amount_in;
        this.amount_out = amount_out;
        this.confirmations = confirmations;
        this.source_addresses = source_addresses;
        this.type = type;
    }
}