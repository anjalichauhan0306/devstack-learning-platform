import express from 'express'
import isAuth from '../middleware/isAuth.js'
import { getCurrentUser, sendContactMail, updateProfile, updateProgress } from '../controller/userController.js'
import upload from "../middleware/multer.js"

const userRouter = express.Router()

userRouter.get("/getcurrentuser",isAuth,getCurrentUser)
userRouter.post("/profile",isAuth,upload.single("photoUrl"),updateProfile)
userRouter.post("/updateprogress",isAuth,updateProgress)
userRouter.post("/contact" , isAuth , sendContactMail)
export default userRouter;
