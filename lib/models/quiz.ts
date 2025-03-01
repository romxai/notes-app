import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  id: String,
  text: String,
});

const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  options: [optionSchema],
  correctAnswer: String,
  sourceFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
  },
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  questions: [questionSchema],
  fileId: {
    // Keep this for backward compatibility
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
  },
  fileIds: [
    {
      // New field for multiple files
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  ],
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true,
  },
  instanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instance",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save middleware to ensure fileId is set from fileIds[0]
quizSchema.pre("save", function (next) {
  if (this.fileIds && this.fileIds.length > 0) {
    this.fileId = this.fileIds[0];
  }
  next();
});

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
