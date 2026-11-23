const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    if (!token) {
      return res.status(401).send({ msg: "Login First" });
    }

    const decoded = jwt.verify(token, "coding");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ msg: "Login First" });
  }
};

module.exports = { auth };
