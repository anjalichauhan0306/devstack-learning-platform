import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  certificateId: { type: String, unique: true },
  issuedDate: { type: Date, default: Date.now },
  downloadUrl: { type: String }, // path to PDF
});

export default mongoose.model("Certificate", certificateSchema);