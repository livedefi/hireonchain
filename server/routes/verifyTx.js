const express = require('express');
const router = express.Router();
const { verifyTransactionOnChain } = require('../utils/solana');

/**
 * GET /api/verify-tx?signature=<base58>&wallet=<base58>
 * POST /api/verify-tx body: { signature, wallet }
 *
 * Verifies a Solana transaction on Devnet:
 * - Transaction exists
 * - Status is successful
 * - Expected wallet address is involved
 */
router.get('/', async (req, res) => {
  const signature = req.query.signature;
  const wallet = req.query.wallet;
  const result = await verifyTransactionOnChain(signature, wallet);
  res.json(result);
});

router.post('/', async (req, res) => {
  const signature = req.body?.signature;
  const wallet = req.body?.wallet;
  const result = await verifyTransactionOnChain(signature, wallet);
  res.json(result);
});

module.exports = router;
