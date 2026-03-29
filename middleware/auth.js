const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    message: 'Unauthorized - Please log in with GitHub first' 
  });
};

module.exports = { isAuthenticated };