// nodeapp\middleware\authorizeRole.js

module.exports = function (allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied for your role' });
    }
    next();
  };
};
