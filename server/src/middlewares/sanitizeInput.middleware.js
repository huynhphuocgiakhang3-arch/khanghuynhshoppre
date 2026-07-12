/**
 * Chong NoSQL Injection: loai bo de quy MOI key bat dau bang "$" hoac chua
 * dau "." trong req.body/req.query/req.params - day la 2 ky thuat pho bien
 * nhat de "inject" toan tu MongoDB (vd { "username": { "$ne": null } } de
 * bypass dieu kien so sanh, hoac "$where" de chay JS tuy y trong query).
 *
 * Viet thu cong (khong dung package ngoai nhu express-mongo-sanitize) vi
 * moi truong build hien tai khong the npm install them goi moi.
 */
const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        // Bo qua hoan toan key nguy hiem, khong dua vao object ket qua
        continue;
      }
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }

  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    // req.query trong Express 5 la getter read-only tren mot so ban - gan
    // de quy tung field thay vi gan lai ca object de tranh loi.
    const cleanedQuery = sanitizeValue(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, cleanedQuery);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = sanitizeInput;
