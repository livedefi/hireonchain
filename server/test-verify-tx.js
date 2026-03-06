/**
 * Quick tests for verify-tx logic (all 3 options).
 * Run: node test-verify-tx.js
 */
const { verifyTransactionOnChain } = require('./utils/solana');

const validWallet = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
// Valid-length Solana sig (64 bytes => 88 base58 chars) that does not exist on Devnet
const validSigFormat = '1'.repeat(88);

async function run() {
  let passed = 0;
  let failed = 0;

  // --- 1) Missing signature ---
  const r1 = await verifyTransactionOnChain('', validWallet);
  if (!r1.verified && r1.error === 'Missing or invalid signature') {
    console.log('PASS: missing signature');
    passed++;
  } else {
    console.log('FAIL: missing signature', r1);
    failed++;
  }

  // --- 2) Missing wallet ---
  const r2 = await verifyTransactionOnChain(validSigFormat, '');
  if (!r2.verified && r2.error === 'Missing or invalid expected wallet address') {
    console.log('PASS: missing wallet');
    passed++;
  } else {
    console.log('FAIL: missing wallet', r2);
    failed++;
  }

  // --- 3) Invalid wallet format ---
  const r3 = await verifyTransactionOnChain(validSigFormat, 'not-a-valid-address');
  if (!r3.verified && r3.error === 'Missing or invalid expected wallet address') {
    console.log('PASS: invalid wallet format');
    passed++;
  } else {
    console.log('FAIL: invalid wallet format', r3);
    failed++;
  }

  // --- 4) Transaction not found / invalid (non-existent or bad sig => not verified, error set) ---
  const r4 = await verifyTransactionOnChain(validSigFormat, validWallet);
  const notFoundOrInvalid =
    !r4.verified && r4.error && typeof r4.signature === 'string';
  if (notFoundOrInvalid) {
    console.log('PASS: transaction not found or invalid sig (not verified, error set)');
    passed++;
  } else {
    console.log('FAIL: transaction not found', r4);
    failed++;
  }

  // --- 5) Response shape (verified, signature, error present) ---
  const hasShape =
    typeof r4.verified === 'boolean' &&
    typeof r4.signature === 'string' &&
    'error' in r4;
  if (hasShape) {
    console.log('PASS: response shape (verified, signature, error)');
    passed++;
  } else {
    console.log('FAIL: response shape', r4);
    failed++;
  }

  console.log('\n--- Result ---');
  console.log('Passed:', passed, 'Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
