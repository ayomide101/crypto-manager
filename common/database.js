import {createConnection} from "mysql";

import Functions from "../modules/functions";
import Error from "../modules/errors";

export default class Database {

    connection = null;

    /**
     * DATABASE INTERFACE CLASS
     * interface class to query Database
     * utilizes configurations specified in app-config.json
     * @param config parse config object to override default
     */
    constructor(config) {
        if (arguments.length < 1) {
            config = Functions.getConfig('db.config');
        }
        this.options = config;

        this.connection = createConnection(config);
        this.connection.connect(function (err) {
            if (err) {
                console.log(err);
                throw err;
            }
        });

    }

    select(table, params, keyword, operator, orderby, mode, limit, callback) {
        switch (arguments.length) {
            case 1:
                params = {};
                keyword = 'AND';
                operator = '=';
                orderby = '';
                mode = '';
                limit = 0;
                callback = null;
                break;
            case 2:
                keyword = 'AND';
                operator = '=';
                orderby = '';
                mode = '';
                limit = 0;
                callback = null;
                break;
            case 3:
                operator = '=';
                orderby = '';
                mode = '';
                limit = 0;
                callback = null;
                if (typeof keyword === 'function') {
                    callback = keyword;
                    keyword = 'AND';
                }
                break;
            case 4:
                orderby = '';
                mode = '';
                limit = 0;
                callback = null;
                break;
            case 5:
                mode = '';
                limit = 0;
                callback = null;
                break;
            case 6:
                limit = 0;
                callback = null;
                break;
            case 7:
                callback = null;
                break;
        }

        var suffix = '';
        var values = [];
        for (var param in params) {
            if (suffix.trim() !== '') suffix += ' ' + keyword + ' ';
            suffix += '??' + operator + '?';
            values[values.length] = param;
            values[values.length] = params[param];
        }

        var sql = 'SELECT * FROM ' + table + ((suffix.trim() != '') ? ' WHERE ' + suffix : '');

        if (orderby && orderby.trim() !== '') {
            sql += ' ORDER BY ' + orderby;
            if (mode && mode.trim() !== '') {
                sql += ' ' + mode;
            }
        }
        if (!isNaN(limit) && limit > 0) {
            sql += ' LIMIT ' + limit;
        }
        const self = this;
        return new Promise(function (resolve, reject) {
            self.connection.query(sql, values, function (err, res) {
                if (err) {
                    console.error(err);
                    reject(Error.NOT_FOUND);
                } else {
                    resolve(res);
                }
                if (typeof callback === 'function') callback(err, res);
            });
        });
    }

    query(sql, callback) {
        return this.connection.query(sql, function (err, res) {
            if (err) {
                throw err;
            }
            if (typeof callback === 'function') callback(err, res);
        });
    }

    insert(table, params, callback) {
        switch (arguments.length) {
            case 1:
                params = {};
                callback = null;
                break;
            case 2:
                callback = null;
                break;
        }

        const sql = `INSERT INTO ${table} SET ?`;
        const self = this;
        return new Promise((resolve, reject) => {
            self.connection.query(sql, params, function (err, res) {
                if (err) {
                    console.log(err);
                    reject(Error.NOT_CREATED);
                } else {
                    console.log(res);
                    resolve(res);
                }
                if (typeof callback === 'function') callback(err, res);
            });
        });
    }

    update(table, params, values, keyword, operator, callback) {
        switch (arguments.length) {
            case 1:
                params = {};
                values = {};
                keyword = 'AND';
                operator = '=';
                callback = null;
                break;
            case 2:
                values = {};
                keyword = 'AND';
                operator = '=';
                callback = null;
                break;
            case 3:
                keyword = 'AND';
                operator = '=';
                callback = null;
                break;
            case 4:
                operator = '=';
                callback = null;
                if (typeof keyword === 'function') {
                    callback = keyword;
                    keyword = 'AND';
                }
                break;
            case 5:
                callback = null;
                break;
        }

        let n = 0;
        for (var value in values) {
            n++;
        }
        const sql = 'UPDATE ' + table + ' SET ?' + ((n > 0) ? ' WHERE ?' : '');
        const self = this;
        return new Promise((resolve, reject) => {
            self.connection.query(sql, [values, params], function (err, res) {
                if (err) {
                    console.error(err);
                    reject(Error.NOT_UPDATED);
                } else {
                    resolve();
                }
                if (typeof callback === 'function') callback(err, res);
            });
        });
    }

    delete(table, params, keyword, operator, callback) {
        switch (arguments.length) {
            case 1:
                params = {};
                keyword = 'AND';
                operator = '=';
                callback = null;
                break;
            case 2:
                keyword = 'AND';
                operator = '=';
                callback = null;
                break;
            case 3:
                operator = '=';
                callback = null;
                if (typeof keyword === 'function') {
                    callback = keyword;
                    keyword = 'AND';
                }
                break;
            case 4:
                callback = null;
                if (typeof operator === 'function') {
                    callback = operator;
                    operator = '=';
                }
                break;
        }

        var suffix = '';
        const values = [];
        for (const param in params) {
            if (suffix.trim() !== '') suffix += ' ' + keyword + ' ';
            suffix += '??' + operator + '?';
            values[values.length] = param;
            values[values.length] = params[param];
        }

        var sql = 'DELETE FROM ' + table + ((suffix.trim() != '') ? ' WHERE ' + suffix : '');
        return this.connection.query(sql, values, function (err, res) {
            if (err) {
                throw err;
            }
            if (typeof callback === 'function') callback(err, res);
        });
    }

    close() {
        console.log("Closing DB Connection");
        this.connection.end();
    }
}