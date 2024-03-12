const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models");
const uploadOnCloudinary = require("../utils/cloudinary");

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (
    [fullname, username, email, password].some((value) => value.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (await User.findOne({ email })) {
    throw new ApiError(409, `${email} is already registered`);
  }
  if (await User.findOne({ username })) {
    throw new ApiError(409, `${username} already taken`);
  }

  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImageLocalPath[0].path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "Error while uploading avatar");

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  // checking if the user is added in the db
  // finding user by id and unselecting few fields
  const newUser = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory"
  );

  if (!newUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering new User... Try again"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, newUser, `${newUser.username} created successfully`)
    );
});

module.exports = registerUser;
