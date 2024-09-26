const User = require("../models/users");
const { JWT_SECRET } = require("../utils/config");
const jwt = require("jsonwebtoken");

const getTokenFromRequest = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.split("Bearer ")[1];
  }
  return null;
};

const tokenExtractor = (request, response, next) => {
  const token = getTokenFromRequest(request);
  if (token) {
    request.token = token;
    next();
  } else {
    response.status(401).json({ error: "Unauthorized!" });
  }
};

const userExtractor = async (request, response, next) => {
  try {
    const decoded = jwt.verify(request.token, JWT_SECRET);
    if (!decoded || !decoded.id || decoded.id === undefined)
      return response.status(401).json({ error: "Unauthorized!" });
    let user = await User.findById(decoded.id);
    request.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = { tokenExtractor, userExtractor };
