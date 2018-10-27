import express from "express";
import CryptoCore from "../modules/cryptoCore";
import Functions from "../modules/functions";
import Error from "../modules/errors";

const router = express.Router();

/*
 * Initialize cryptos
 */
CryptoCore.initCryptos(Functions.getConfig("base_url")+"webhook/");

/**
 * Receive crypto events
 * URL: base_url/webhook/:cryptoType
 */
router.post(':cryptoType', function(req, res) {
    console.log(`Received event on cryptowebhook -> ${req.path}`);
    let { cryptoType } = req.params;
    cryptoType = cryptoType.toLowerCase();

    if (CryptoCore.isSupported(cryptoType)) {

        const crypto = CryptoCore.getCrypto(cryptoType);

        if (crypto.isSupportWebHook()) {
            crypto.onNewEvent(req.body)
                .then(value => {
                    res.send(200, Error.successError("Webhook processed"));
                })
                .catch(reason => {
                    res.send(400, reason);
                });
        } else {
            res.send(400, Error.WEBHOOK_NOT_SUPPORTED)
        }
    } else {
        res.send(400, Error.WALLET_NOT_SUPPORTED);
    }
});

module.exports = router;