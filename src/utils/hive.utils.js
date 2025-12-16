const dhive = require('@hiveio/dhive');

/**
 * Verify Hive Keychain signature
 * @param {string} username - Hive username
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature from Hive Keychain
 * @param {string} publicKey - Public posting key
 */
exports.verifyKeychainSignature = (username, message, signature, publicKey) => {
  try {
    const pubKey = dhive.PublicKey.fromString(publicKey);
    const buffer = Buffer.from(message, 'utf8');
    const sig = dhive.Signature.fromString(signature);
    
    return pubKey.verify(buffer, sig);
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
