import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  getCurrentUser,
  sendContactMail,
  updateProfile,
  updateProgress,
} from "../controllers/userController.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.get("/getcurrentuser", isAuth, getCurrentUser);
userRouter.post("/profile", isAuth, upload.single("photoUrl"), updateProfile);
userRouter.post("/updateprogress", isAuth, updateProgress);
userRouter.post("/contact",sendContactMail);

export default userRouter;
