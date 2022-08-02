const { Api, JsonRpc, RpcError } = require("eosjs");
const ecc = require("eosjs-ecc");
const fetch = require("node-fetch"); // node only; not needed in browsers
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig"); // development only
const { TextEncoder, TextDecoder } = require("util");
const CoinGecko = require("coingecko-api");
const CoinGeckoClient = new CoinGecko();

const defaultPrivateKey = process.env.EOS_PRIVATE_KEY;
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);

const rpc = new JsonRpc(process.env.EOS_URL, { fetch });
const eos = new Api({
  rpc,
  signatureProvider,
  textDecoder: new TextDecoder(),
  textEncoder: new TextEncoder(),
});
exports.tn_createInstitution = async (req, res, next) => {
  try {
    const { institutionId, institutionName } = req.body;
    // kontratın addcustomer actionını çağırma
    const result = await eos.transact(
      {
        actions: [
          {
            account: process.env.EOS_CONTRACT,
            name: "createinst",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              id: institutionId,
              name: institutionName,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return res.status(201).json({
      success: true,
      errorCode: "",
      message: institutionName + " with " + institutionId + " id is added.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_createCertificate = async (req, res, next) => {
  try {
    const { certificateId, institutionId, certificateName, participants } =
      req.body;
    // kontratın addcustomer actionını çağırma
    const result = await eos.transact(
      {
        actions: [
          {
            account: process.env.EOS_CONTRACT,
            name: "createcert",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              id: certificateId,
              institutionid: institutionId,
              certificatename: certificateName,
              participants,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return res.status(201).json({
      success: true,
      errorCode: "",
      message:
        "Certificate with " +
        certificateId +
        " id is added for institution id " +
        institutionId +
        ".",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_deleteCertificate = async (req, res, next) => {
  try {
    const { certificateId, institutionId } = req.body;
    // kontratın addcustomer actionını çağırma
    const result = await eos.transact(
      {
        actions: [
          {
            account: process.env.EOS_CONTRACT,
            name: "deletecert",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              id: certificateId,
              institutionid: institutionId,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return res.status(201).json({
      success: true,
      errorCode: "",
      message:
        "Certificate with " +
        certificateId +
        " id is deleted from institution id " +
        institutionId +
        ".",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_addSigner = async (req, res, next) => {
  try {
    const { certificateId, institutionId, signers } = req.body;
    // kontratın addcustomer actionını çağırma
    const result = await eos.transact(
      {
        actions: [
          {
            account: process.env.EOS_CONTRACT,
            name: "addsigner",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              id: certificateId,
              institutionid: institutionId,
              signers,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return res.status(201).json({
      success: true,
      errorCode: "",
      message: "Signer(s) with " + signers + " id is added",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error.message,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_createAccount = async (req, res, next) => {
  try {
    const privateKey = await ecc.randomKey();
    const publicKey = await ecc.privateToPublic(privateKey);

    const { accountName } = req.body

    const result = await eos.transact(
      {
        actions: [
          {
            account: "eosio",
            name: "newaccount",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              creator: process.env.EOS_CONTRACT,
              name: accountName,
              owner: {
                threshold: 1,
                keys: [
                  {
                    key: publicKey,
                    weight: 1,
                  },
                ],
                accounts: [],
                waits: [],
              },
              active: {
                threshold: 1,
                keys: [
                  {
                    key: publicKey,
                    weight: 1,
                  },
                ],
                accounts: [],
                waits: [],
              },
            },
          },
          {
            account: "eosio",
            name: "buyrambytes",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              payer: process.env.EOS_CONTRACT,
              receiver: accountName,
              bytes: 3048,
            },
          },
          {
            account: "eosio",
            name: "delegatebw",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              from: process.env.EOS_CONTRACT,
              receiver: accountName,
              stake_net_quantity: "0.0001 EOS",
              stake_cpu_quantity: "0.0001 EOS",
              transfer: false,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );
    return res.status(201).json({
      success: true,
      errorCode: "",
      message: "Account " + accountName + " created ",
      keys: { privateKey: privateKey, publicKey: publicKey },
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_createAccountAndConfirm = async (req, res, next) => {
  try {
    const privateKey = await ecc.randomKey();
    const publicKey = await ecc.privateToPublic(privateKey);
    const { head_block_num: initialBlockNumber } = await rpc.get_info();
    const { accountName } = req.body
    const result = await eos.transact(
      {
        actions: [
          {
            account: "eosio",
            name: "newaccount",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              creator: process.env.EOS_CONTRACT,
              name: accountName,
              owner: {
                threshold: 1,
                keys: [
                  {
                    key: publicKey,
                    weight: 1,
                  },
                ],
                accounts: [],
                waits: [],
              },
              active: {
                threshold: 1,
                keys: [
                  {
                    key: publicKey,
                    weight: 1,
                  },
                ],
                accounts: [],
                waits: [],
              },
            },
          },
          {
            account: "eosio",
            name: "buyrambytes",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              payer: process.env.EOS_CONTRACT,
              receiver: accountName,
              bytes: 3048,
            },
          },
          {
            account: "eosio",
            name: "delegatebw",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
            ],
            data: {
              from: process.env.EOS_CONTRACT,
              receiver: accountName,
              stake_net_quantity: "0.0001 EOS",
              stake_cpu_quantity: "0.0001 EOS",
              transfer: false,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );
    let blockNumber = initialBlockNumber;
    let trxFound = false;
    let currentBlock = {};
    const transactionId = result.transaction_id;

    const delay = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    };

    const lookForTrx = async () => {
      return new Promise(async (resolve, reject) => {
        for (; blockNumber - initialBlockNumber < 20;) {
          currentBlock = await rpc.get_block(blockNumber);
          blockNumber++;
          const hasTrx = await blockHasTransaction(currentBlock, transactionId);
          if (hasTrx) {
            resolve(true);
            break;
          }
          await delay();
        }
        reject("Check block for transaction timeout!");
      });
    };
    const trxResult = await lookForTrx();
    if (trxResult) {
      return res.status(201).json({
        success: true,
        errorCode: "",
        message: "Account " + accountName + " created ",
        keys: { privateKey: privateKey, publicKey: publicKey },
        data: result,
      });
    }
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_createMultiple = async (req, res, next) => {
  try {
    const { head_block_num: initialBlockNumber } = await rpc.get_info();
    const actions = [];
    const { institution, signers, certificate } = req.body;
    if (institution) {
      const { institutionId, institutionName } = institution;
      actions.push({
        account: process.env.EOS_CONTRACT,
        name: "createinst",
        authorization: [
          {
            actor: process.env.EOS_CONTRACT,
            permission: "active",
          },
        ],
        data: {
          id: institutionId,
          name: institutionName,
        },
      });
    }
    if (certificate) {
      const { institutionId, certificateId, certificateName, participants } =
        certificate;
      actions.push({
        account: process.env.EOS_CONTRACT,
        name: "createcert",
        authorization: [
          {
            actor: process.env.EOS_CONTRACT,
            permission: "active",
          },
        ],
        data: {
          id: certificateId,
          institutionid: institutionId,
          certificatename: certificateName,
          participants,
        },
      });
    }
    if (signers && signers.length > 0) {
      const { institutionId, certificateId } = certificate;
      actions.push({
        account: process.env.EOS_CONTRACT,
        name: "addsigner",
        authorization: [
          {
            actor: process.env.EOS_CONTRACT,
            permission: "active",
          },
        ],
        data: {
          id: certificateId,
          institutionid: institutionId,
          signers,
        },
      });
    }

    const result = await eos.transact(
      { actions: actions },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );
    let blockNumber = initialBlockNumber;
    let trxFound = false;
    let currentBlock = {};
    const transactionId = result.transaction_id;

    const delay = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });
    };

    const lookForTrx = async () => {
      return new Promise(async (resolve, reject) => {
        for (; blockNumber - initialBlockNumber < 40;) {
          try {
            currentBlock = await rpc.get_block(blockNumber);
          } catch (err) {
            continue;
          }
          blockNumber++;
          const hasTrx = await blockHasTransaction(currentBlock, transactionId);
          if (hasTrx) {
            resolve(true);
            break;
          }
          await delay();
        }
        reject("Check block for transaction timeout!");
      });
    };
    const trxResult = await lookForTrx();
    if (trxResult) {
      return res.status(201).json({
        success: true,
        errorCode: "",
        message: "Transactions " + JSON.stringify(req.body) + " executed ",
        data: result,
      });
    }
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

async function blockHasTransaction(block, transactionId) {
  const { transactions } = block;
  if (transactions.length > 0) {
    const result = await transactions.find(
      (trxelm) => trxelm.trx.id === transactionId
    );
    return result;
  }
  return false;
}

exports.tn_calculatePrice = async (req, res, next) => {
  try {
    const {
      signer_create: signerCreate,
      institution_create: institutionCreate,
      signer_add: signerAdd,
      participant_add: participantAdd,
    } = req.body;

    const certificateBytes = 124;
    const signerCreateBytes = signerCreate * 3048;
    const institutionCreateBytes = institutionCreate * 143;
    const addingSignerBytes = signerAdd * 9;
    const addingParticipantBytes = participantAdd * 8;
    const stringLengthEstimation = 20;
    const totalBytes =
      certificateBytes +
      signerCreateBytes +
      institutionCreateBytes +
      addingSignerBytes +
      addingParticipantBytes +
      stringLengthEstimation;

    const { quote, base } = await getTable("eosio", "rammarket", "eosio");
    const quoteBalance = quote.balance.slice(0, -4);
    const baseBalance = base.balance.slice(0, -4);
    const ramPriceEOS = quoteBalance / (baseBalance * quote.weight);

    const eosPriceEstimates = {
      totalEstimate: (ramPriceEOS * totalBytes).toFixed(4),
      certificate: (ramPriceEOS * certificateBytes).toFixed(4),
      createSigner: (ramPriceEOS * signerCreateBytes).toFixed(4),
      createInstitution: (ramPriceEOS * institutionCreateBytes).toFixed(4),
      addSigner: (ramPriceEOS * addingSignerBytes).toFixed(4),
      addParticipant: (ramPriceEOS * addingParticipantBytes).toFixed(4),
    };
    const { data } = await CoinGeckoClient.simple.price({
      ids: "eos",
      vs_currencies: "gbp",
    });
    const { gbp: price } = data.eos;
    const certificatePrice = Number(
      (eosPriceEstimates.certificate * price).toFixed(4)
    );
    const createSignerPrice = Number(
      (eosPriceEstimates.createSigner * price).toFixed(4)
    );
    const createInstitutionPrice = Number(
      (eosPriceEstimates.createInstitution * price).toFixed(4)
    );
    const addSignerPrice = Number(
      (eosPriceEstimates.addSigner * price).toFixed(4)
    );
    const addParticipantPrice = Number(
      (eosPriceEstimates.addParticipant * price).toFixed(4)
    );
    const totalEstimatePrice = Number(
      (
        certificatePrice +
        createSignerPrice +
        createInstitutionPrice +
        addSignerPrice +
        addParticipantPrice
      ).toFixed(4)
    );
    const gbpPriceEstimates = {
      totalEstimate: totalEstimatePrice,
      certificate: certificatePrice,
      createSigner: createSignerPrice,
      createInstitution: createInstitutionPrice,
      addSigner: addSignerPrice,
      addParticipant: addParticipantPrice,
    };

    const result = {
      totalBytes,
      eosPrice: eosPriceEstimates,
      gbpPrice: gbpPriceEstimates,
    };
    return res.status(200).json({
      success: true,
      errorCode: "",
      message:
        "Estimated fee for creation is £" + result.gbpPrice.totalEstimate,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_signCertificate = async (req, res, next) => {
  try {
    const { signer, certificateId, institutionId, signerPrivate } = req.body;
    const signSignatureProvider = new JsSignatureProvider([
      signerPrivate,
      defaultPrivateKey,
    ]);
    const signEos = new Api({
      rpc,
      signatureProvider: signSignatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });
    const result = await signEos.transact(
      {
        actions: [
          {
            account: process.env.EOS_CONTRACT,
            name: "signcert",
            authorization: [
              {
                actor: process.env.EOS_CONTRACT,
                permission: "active",
              },
              {
                actor: signer,
                permission: "active",
              },
            ],
            data: {
              id: certificateId,
              institutionid: institutionId,
              signerr: signer,
            },
          },
        ],
      },
      {
        blocksBehind: 30,
        expireSeconds: 30,
      }
    );

    return res.status(201).json({
      success: true,
      errorCode: "",
      message:
        "Certificate with " + certificateId + " is signed by " + signer + ".",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error.message,
      message: "Something went wrong, please check your inputs.",
      data: {},
    });
  }
};

exports.tn_getParticipant = async (req, res, next) => {
  try {
    const { certificateId, institutionId, participantName } = req.query;
    if (typeof institutionId === "undefined") {
      throw new Error("Valid institutionId has not been provided.");
    }
    if (typeof certificateId === "undefined") {
      throw new Error("Valid certificateId has not been provided.");
    }
    if (typeof participantName === "undefined") {
      throw new Error("Valid certificateName has not been provided.");
    }

    const result = await getTable(
      process.env.EOS_CONTRACT,
      "certificate",
      institutionId,
      certificateId
    );

    const { participants } = result;

    const participant = participants?.find(
      (part) => part === participantName
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        errorCode: "",
        message:
          "No participant ." +
          participantName +
          " found in specified certificate.",
        data: {},
      });
    }

    return res.status(201).json({
      success: true,
      errorCode: "",
      message:
        "Participant " +
        participantName +
        " with " +
        certificateId +
        " id is returned.",
      data: { ...result, participants: [participant] },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: "",
      message: error.message || "Something went wrong.",
      data: {},
    });
  }
};

exports.tn_getCertificate = async (req, res, next) => {
  try {
    const { certificateId, institutionId } = req.query;
    if (typeof institutionId === "undefined") {
      throw new Error("Valid institutionId has not been provided.");
    }
    if (typeof certificateId === "undefined") {
      throw new Error("Valid certificateId has not been provided.");
    }
    const result = await getTable(
      process.env.EOS_CONTRACT,
      "certificate",
      institutionId,
      certificateId
    );
    return res.status(201).json({
      success: true,
      errorCode: "",
      message: "Certificate with " + certificateId + " id returned",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: "",
      message: error.message || "Something went wrong.",
      data: {},
    });
  }
};

exports.tn_getInstitution = async (req, res, next) => {
  try {
    const { institutionId } = req.query;
    if (typeof institutionId === "undefined") {
      throw new Error("Valid institutionId had not been provided.");
    }
    const result = await getTable(
      process.env.EOS_CONTRACT,
      "institution",
      process.env.EOS_CONTRACT,
      institutionId
    );
    return res.status(201).json({
      success: true,
      errorCode: "",
      message: "Institution with " + institutionId + " id returned",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errorCode: error,
      message: error.message || "Something went wrong.",
      data: {},
    });
  }
};

async function getTable(contract, tableName, scope, key) {
  const results = await rpc.get_table_rows({
    json: true, // Get the response as json
    code: contract, // Contract that we target
    scope: scope, // Account that owns the data
    table: tableName,
    lower_bound: key,
    upper_bound: key,
    reverse: false, // Optional: Get reversed data
    show_payer: false, // Optional: Show ram payer
    limit: 1,
  });
  if (results.rows.length == 0) {
    throw new Error(
      "No index found in " + tableName + " table with the key value: " + key
    );
  }
  return results.rows[0];
}
