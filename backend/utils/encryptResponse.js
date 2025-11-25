// utils/encryptResponse.js
const { encrypt } = require('./encryption');

const ENCRYPTED_FIELDS = new Set([
    'view', 'price', 'stock', 'sum', 'total', 'sum2','originalPrice','displayedDiscount'
]);

const shouldEncrypt = (path) => ENCRYPTED_FIELDS.has(path);

// Helper to convert ObjectId to string
const convertObjectId = (value) => {
    if (!value) return value;
    
    // Check if it's a MongoDB ObjectId (has buffer property or _bsontype)
    if (value._bsontype === 'ObjectID' || value.buffer) {
        return value.toString();
    }
    
    // Check if it has toString method and looks like ObjectId
    if (typeof value === 'object' && value.toString && value.toString().length === 24) {
        return value.toString();
    }
    
    return value;
};

const encryptValue = (value, path = '') => {
    const currentPath = path;

    // Handle _id fields - convert to string, don't encrypt
    if (currentPath === '_id' || currentPath.endsWith('._id')) {
        return convertObjectId(value);
    }

    // Encrypt only if path matches
    if (shouldEncrypt(currentPath) && value != null) {
        try {
            return encrypt(String(value));
        } catch (err) {
            console.error(`Encrypt failed for ${currentPath}:`, value);
            return String(value);
        }
    }

    if (Array.isArray(value)) {
        return value.map((item, idx) => encryptValue(item, `${path}[${idx}]`));
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
        const result = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                const newPath = path ? `${path}.${key}` : key;
                result[key] = encryptValue(value[key], newPath);
            }
        }
        return result;
    }

    return value;
};

const sendEncryptedResponse = (dataArray, totalCount, res) => {
    try {
        const encryptedData = dataArray.map(item => {
            let plain;
            
            // Handle Mongoose documents
            if (item.toObject) {
                plain = item.toObject();
            } 
            // Handle aggregation results (plain objects with buffer _id)
            else {
                plain = JSON.parse(JSON.stringify(item, (key, value) => {
                    // Convert ObjectId during JSON serialization
                    if (key === '_id' && value && typeof value === 'object') {
                        return convertObjectId(value);
                    }
                    return value;
                }));
            }
            
            return encryptValue(plain);
        });

        return res.json({
            success: true,
            data: encryptedData,
            total: totalCount
        });
    } catch (error) {
        console.error("sendEncryptedResponse error:", error);
        return res.status(500).json({
            success: false,
            message: "Encryption failed"
        });
    }
};

module.exports = { sendEncryptedResponse };

