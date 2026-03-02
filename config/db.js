import mongoose from "mongoose";

export const db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB connected ");
  } catch (error) {
    console.error("DB connection failed");
    process.exit(1);
  }
};
