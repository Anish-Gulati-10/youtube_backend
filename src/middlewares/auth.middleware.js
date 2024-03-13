const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];
  
    if (!accessToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -watchHistory"
    );
  
    if (!user) {
      throw new ApiError(401, "Invalid Token");
    }
  
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Tokens....")
  }
});

module.exports = verifyJWT;
