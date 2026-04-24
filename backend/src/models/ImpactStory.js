import mongoose from "mongoose";

const impactStorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: "BhojanSetu Network",
    },
    image: String,
    storyDate: String,
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ImpactStory = mongoose.model("ImpactStory", impactStorySchema);

export default ImpactStory;
