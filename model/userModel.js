import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
    },
    password: {
      type: String, 
      select: false
    },
    role: {
      type: String,
      required: true,
      enum: ["Student", "Educator"],
    },
    photoUrl: {
      type: String,
      default: "",
    },

    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
      },
    ],

    resetPasswordOTP: {
      type: String,
      select: false
    },

    otpExpiryTime: {
      type: Date,
      select: false
    },

    isOTPVerified: {
      type: Boolean,
      default: false,
    },
    completedLectures: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Courses" },
        lectureIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
      },
    ],
    examScores: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Courses" },
        score: Number,
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
