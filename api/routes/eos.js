const express = require("express");
const router = express.Router();

const eosController = require('../controllers/eos');

router.post("/createcorporate", eosController.tn_createCorporate);
router.post("/addamount", eosController.tn_addAmount);
router.post("/createcertificate", eosController.tn_createCertificate);
router.post("/deletecertificate", eosController.tn_deleteCertificate);
router.post("/addsigner", eosController.tn_addSigner);
router.post("/signcertificate", eosController.tn_signCertificate);
router.post("/createsigner", eosController.tn_createSigner);
router.post("/createsignerandconfirm", eosController.tn_createSignerAndConfirm);
router.post("/createmultiple", eosController.tn_createMultiple);
router.post("/calculateprice", eosController.tn_calculatePrice);
router.get("/getcertificate", eosController.tn_getCertificate);
router.get("/getcorporate", eosController.tn_getCorporate);
router.get("/")
module.exports = router;
