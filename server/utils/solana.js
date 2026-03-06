const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

// Get Solana connection based on network configuration
const getSolanaConnection = () => {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  return new Connection(clusterApiUrl(network), 'confirmed');
};

// Validate a Solana wallet address
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const isValidSolanaAddress = address => {
  if (!address || !SOLANA_ADDRESS_REGEX.test(address)) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Get account information
const getAccountInfo = async address => {
  try {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey);
    return accountInfo;
  } catch (error) {
    console.error('Error getting account info:', error);
    return null;
  }
};

// Get account balance
const getBalance = async address => {
  try {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(address);
    const balance = await connection.getBalance(pubkey);
    return balance / 1000000000; // Convert lamports to SOL
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
};

// Verify transaction (raw fetch)
const verifyTransaction = async signature => {
  try {
    const connection = getSolanaConnection();
    const transaction = await connection.getTransaction(signature);
    return transaction;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return null;
  }
};

/**
 * On-chain verification: fetch tx from Devnet, confirm it exists, succeeded, and expected wallet is involved.
 * @param {string} signature - Solana transaction signature (base58)
 * @param {string} expectedWallet - Expected wallet address (base58) to be involved in the tx
 * @returns {Promise<{ verified: boolean, signature: string, transactionExists?: boolean, statusSuccess?: boolean, walletInvolved?: boolean, error?: string, slot?: number }>}
 */
const verifyTransactionOnChain = async (signature, expectedWallet) => {
  const out = { verified: false, signature };
  const connection = getSolanaConnection();

  try {
    if (!signature || typeof signature !== 'string') {
      out.error = 'Missing or invalid signature';
      return out;
    }
    if (!expectedWallet || !isValidSolanaAddress(expectedWallet)) {
      out.error = 'Missing or invalid expected wallet address';
      return out;
    }

    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      out.error = 'Transaction not found';
      out.transactionExists = false;
      return out;
    }
    out.transactionExists = true;

    if (tx.meta && tx.meta.err) {
      out.error = 'Transaction failed on-chain';
      out.statusSuccess = false;
      out.metaErr = tx.meta.err;
      return out;
    }
    out.statusSuccess = true;

    const expectedBase58 = new PublicKey(expectedWallet).toBase58();
    let accountKeyStrings = [];

    const msg = tx.transaction?.message;
    if (!msg) {
      out.error = 'Transaction message missing';
      return out;
    }
    const toBase58 = k => (typeof k === 'string' ? k : (k && k.toBase58 ? k.toBase58() : String(k)));
    if (msg.accountKeys && Array.isArray(msg.accountKeys)) {
      accountKeyStrings = msg.accountKeys.map(toBase58);
    } else if (msg.staticAccountKeys && Array.isArray(msg.staticAccountKeys)) {
      accountKeyStrings = msg.staticAccountKeys.map(toBase58);
    } else if (typeof msg.getAccountKeys === 'function') {
      try {
        const accountKeys = await msg.getAccountKeys(connection);
        const keys = accountKeys.staticAccountKeys || [];
        accountKeyStrings = keys.map(k => (k && k.toBase58 ? k.toBase58() : String(k)));
        if (accountKeys.keySegments) {
          for (const seg of accountKeys.keySegments) {
            for (const k of seg) {
              accountKeyStrings.push(k && k.toBase58 ? k.toBase58() : String(k));
            }
          }
        }
      } catch (e) {
        out.error = 'Could not resolve account keys';
        return out;
      }
    }

    const walletInvolved = accountKeyStrings.some(key => key === expectedBase58);
    out.walletInvolved = walletInvolved;
    if (!walletInvolved) {
      out.error = 'Expected wallet not involved in transaction';
      return out;
    }

    out.verified = true;
    out.slot = tx.slot;
    return out;
  } catch (err) {
    out.error = err.message || 'Verification failed';
    return out;
  }
};

module.exports = {
  getSolanaConnection,
  isValidSolanaAddress,
  getAccountInfo,
  getBalance,
  verifyTransaction,
  verifyTransactionOnChain,
};
