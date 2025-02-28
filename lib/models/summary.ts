import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  title: String,
  content: String,
});

const summarySchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  chapters: [chapterSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Summary ||
  mongoose.model("Summary", summarySchema);
