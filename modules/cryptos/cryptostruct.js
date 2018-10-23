
export class CryptoBean {
    identifier;
    data;
    passPhrase;

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
     * Array of receiving addresses
     * @type []
     */
    addresses;
    /**
     * Array of sending addresses
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

    constructor(addresses, hash, time, fee, amount_in, amount_out, confirmations, source_addresses) {
        this.addresses = addresses;
        this.hash = hash;
        this.fee = fee;
        this.time = time;
        this.amount_in = amount_in;
        this.amount_out = amount_out;
        this.confirmations = confirmations;
        this.source_addresses = source_addresses;
    }
}