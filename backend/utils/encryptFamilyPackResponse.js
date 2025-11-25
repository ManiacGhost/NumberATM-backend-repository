
const { encrypt } = require('./encryption');

const ENCRYPTED_FIELDS = new Set([
  'view', 'price', 'stock', 'sum', 'total', 'sum2',
  'discount', 'margin', 'totalPrice', 'count',
  'name', 'showCased','originalPrice','displayedDiscount'
]);

const shouldEncrypt = (path) => {
  if (typeof path !== 'string') return false;
  const lastPart = path.split('.').pop();
  return ENCRYPTED_FIELDS.has(lastPart);
};

const convertObjectId = (value) => {
  if (!value) return value;
  if (value._bsontype === 'ObjectID' || value.buffer) return value.toString();
  if (typeof value === 'object' && value.toString && value.toString().length === 24) return value.toString();
  return value;
};

const encryptValue = (value, path = '') => {
  // Ensure path is string
  const currentPath = typeof path === 'string' ? path : '';

  // Handle _id
  if (currentPath === '_id' || (typeof currentPath === 'string' && currentPath.endsWith('._id'))) {
    return convertObjectId(value);
  }

  // Encrypt if should
  if (shouldEncrypt(currentPath) && value != null) {
    try {
      return encrypt(String(value));
    } catch (err) {
      console.error(`Encrypt failed for path: ${currentPath}`, err);
      return String(value);
    }
  }

  // Handle Array
  if (Array.isArray(value)) {
    return value.map((item, i) => encryptValue(item, `${currentPath}[${i}]`));
  }

  // Handle Object
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      result[key] = encryptValue(val, newPath);
    }
    return result;
  }

  return value;
};

module.exports = { encryptValue };