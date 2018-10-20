import Functions from "./functions";

export default class Error {
    static FAIL = {status: false};
    static SUCCESS = {status: true};
    static ACCOUNT_NOT_FOUND = {...Error.FAIL, code: 201, message: "Account not found"};
    static ACCOUNT_NOT_ACTIVATED = {...Error.FAIL, code: 202, message: "Account not activated"};
    static ACCOUNT_INCORRECT_PASSWORD = {...Error.FAIL, code: 203, message: "Incorrect password"};
    static INVALID_DATA = {...Error.FAIL, code: 204, message: "Input is invalid"};
    static ACCOUNT_EXISTS = {...Error.FAIL, code: 205, message: "Account already exists"};
    static NOT_CREATED = {...Error.FAIL, code: 206, message: "Data not created"};
    static NOT_FOUND = {...Error.FAIL, code: 207, message: "Data not found"};
    static NOT_UPDATED = {...Error.FAIL, code: 208, message: "Data not updated"};
    static ACCOUNT_BLOCKED = {...Error.FAIL, code: 209, message: "Account blocked"};
    static LOGIN_FAILED = {...Error.FAIL, code: 210, message: "Login failed"};
    static INCORRECT_OTP = {...Error.FAIL, code: 211, message: "Incorrect OTP"};

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