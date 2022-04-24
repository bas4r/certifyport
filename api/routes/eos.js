const express = require("express");
const router = express.Router();

const eosController = require('../controllers/eos');

router.post("/createinstitution", eosController.tn_createInstitution);
router.post("/createcertificate", eosController.tn_createCertificate);
router.post("/deletecertificate", eosController.tn_deleteCertificate);
router.post("/addsigner", eosController.tn_addSigner);
router.post("/signcertificate", eosController.tn_signCertificate);
router.post("/createaccount", eosController.tn_createAccount);
router.post("/createaccountandconfirm", eosController.tn_createAccountAndConfirm);
router.post("/createmultiple", eosController.tn_createMultiple);
router.post("/calculateprice", eosController.tn_calculatePrice);
router.get("/getparticipant", eosController.tn_getParticipant);
router.get("/getcertificate", eosController.tn_getCertificate);
router.get("/getinstitution", eosController.tn_getInstitution);
router.get("/")
module.exports = router;
