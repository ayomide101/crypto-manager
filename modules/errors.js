import Functions from "./functions";

export default class Error {
    static FAIL = {status: false};
    static SUCCESS = {status: true};
    static ACCOUNT_NOT_FOUND = {...Error.FAIL, code: 201, message: "Account not found"};
    static ACCOUNT_NOT_ACTIVATED = {...Error.FAIL, code: 202, message: "Account not activated"};
    static ACCOUNT_INCORRECT_PASSWORD = {...Error.FAIL, code: 203, message: "Incorrect password"};
    static INVALID_DATA = {...Error.FAIL, code: 204, message: "Data is invalid"};
    static ACCOUNT_EXISTS = {...Error.FAIL, code: 205, message: "Account already exists"};
    static NOT_CREATED = {...Error.FAIL, code: 206, message: "Data not created"};
    static NOT_FOUND = {...Error.FAIL, code: 207, message: "Data not found"};
    static NOT_UPDATED = {...Error.FAIL, code: 208, message: "Data not updated"};
    static ACCOUNT_BLOCKED = {...Error.FAIL, code: 209, message: "Account blocked"};
    static LOGIN_FAILED = {...Error.FAIL, code: 210, message: "Login failed"};
    static INCORRECT_OTP = {...Error.FAIL, code: 211, message: "Incorrect OTP"};
    static OLD_PASSWORD = {...Error.FAIL, code: 212, message: "New password cannot be same old password"};
    static PASSWORD_UPDATED = {...Error.FAIL, code: 213, message: "Password not updated"};
    static FRIEND_NOT_CREATED = {...Error.FAIL, code: 214, message: "Friend not created"};
    static INVALID_WALLET_ADDRESS = {...Error.FAIL, code: 215, message: "Invalid wallet address"};
    static FRIEND_NOT_DELETED = {...Error.FAIL, code: 216, message: "Friend not deleted"};
    static WALLET_NOT_SUPPORTED = {...Error.FAIL, code:217, message: "Wallet not supported"};
    static WEBHOOK_NOT_SUPPORTED = {...Error.FAIL, code:218, message: "Webhook not supported"};
    static WALLET_NOT_CREATED = {...Error.FAIL, code:219, message: "Wallet not created"};
    static WALLET_NOT_IMPORTED = {...Error.FAIL, code:220, message: "Wallet not imported"};
    static WALLETS_NOT_FOUND = {...Error.FAIL, code:221, message: "Wallet not imported"};
    static WALLET_ADDRESS_NOT_CREATED = {...Error.FAIL, code:222, message: "Wallet address not created"};
    static TRANSACTION_NOT_BE_CREATED = {...Error.FAIL, code:223, message: "Transaction not be created"};
    static ACTIVATION_CODE_INVALID = {...Error.FAIL, code:224, message: "Activation code is invalid"};
    static NO_MONEY_IN_WALLET = {...Error.FAIL, code: 225, message:"Not enough money in wallet"};
    static TRANSACTION_NOT_SENT = {...Error.FAIL, code: 226, message:"Transaction not sent"};
    static NO_MATCHING_TRANSACTION = {...Error.FAIL, code: 227, message:"No matching transaction"};


    /**
     * Attaches
     * @param error
     * @param data
     * @returns {{status:boolean, code: number, message: *, data: *}}
     */
    static errorResponse(error, data) {
        error['data'] = data;
        return error;
    }

    /**
     * Returns 200 for success response
     * @param message
     * @param data
     * @returns {{status: boolean, code: number, message: *, data: *}}
     */
    static successError(message, data) {
        data = Functions.isNull(data) ? {} : data;
        return {...Error.SUCCESS, code: 200, status: true, message: message, data};
    }
}