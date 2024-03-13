const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models");
const uploadOnCloudinary = require("../utils/cloudinary");

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

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

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new ApiError(400, "username or email is must");
  }

  const foundUser = await User.findOne({ $or: [{ username }, { email }] });
  if (!foundUser) {
    throw new ApiError(400, "User does not exist");
  }

  const isPasswordValid = await foundUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password.. Try again");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(foundUser._id);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  const loggedInUser = await User.findById(foundUser._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken, refreshToken },
        `${loggedInUser.username} logged in successfully`
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, `${user.username} logged out successfully`));
});

module.exports = { registerUser, loginUser, logoutUser };
