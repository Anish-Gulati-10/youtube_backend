const mongoose = require("mongoose");
const mongooseAggregate = require("mongoose-aggregate-paginate-v2");

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String, // url to video
      required: true,
    },
    thumbnail: {
      type: String, // url to thumnail img
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // will be extracted from source where video is stored
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

mongoose.plugin(mongooseAggregate);

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;