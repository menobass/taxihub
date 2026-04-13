const crypto = require('crypto');
const dhive = require('@hiveio/dhive');

/**
 * Verify Hive Keychain signature.
 * Keychain signs SHA256(message) internally, so we must hash before verifying —
 * dhive's PublicKey.verify() expects a 32-byte hash, not the raw message.
 */
exports.verifyKeychainSignature = (username, message, signature, publicKey) => {
  try {
    const pubKey = dhive.PublicKey.fromString(publicKey);
    const hash = crypto.createHash('sha256').update(message).digest();
    const sig = dhive.Signature.fromString(signature);

    return pubKey.verify(hash, sig);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Format Hive account name
 */
exports.formatAccountName = (account) => {
  return account.toLowerCase().trim();
};

/**
 * Validate Hive username format
 */
exports.isValidUsername = (username) => {
  const usernameRegex = /^[a-z][a-z0-9\-\.]{2,15}$/;
  return usernameRegex.test(username);
};

/**
 * Parse blockchain error messages
 */
exports.parseBlockchainError = (error) => {
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('missing required posting authority')) {
    return 'Insufficient permissions to perform this action';
  }
  
  if (errorMessage.includes('Account not found')) {
    return 'Hive account does not exist';
  }
  
  if (errorMessage.includes('RPCError')) {
    return 'Blockchain connection error. Please try again.';
  }
  
  return 'Operation failed. Please try again.';
};

/**
 * Format HIVE/HBD amounts
 */
exports.formatAmount = (amount, symbol = 'HIVE') => {
  return `${parseFloat(amount).toFixed(3)} ${symbol}`;
};

/**
 * Get Hive block explorer link
 */
exports.getExplorerLink = (type, identifier) => {
  const base = 'https://hivehub.dev';
  
  switch (type) {
    case 'account':
      return `${base}/@${identifier}`;
    case 'post':
      return `${base}/@${identifier.author}/${identifier.permlink}`;
    case 'transaction':
      return `${base}/tx/${identifier}`;
    default:
      return base;
  }
};
