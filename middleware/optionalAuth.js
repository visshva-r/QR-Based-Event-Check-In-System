const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    req.user = null;
  }
  next();
};
