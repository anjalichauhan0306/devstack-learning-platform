import express from 'express'
import isAuth from "../middlewares/isAuth.js";
import { createStripeCheckout, freeEnrollCourse, verifyCheckout } from '../controllers/paymentController.js'

const paymentRouter = express.Router()

paymentRouter.post("/create-checkout-session",isAuth, createStripeCheckout);
paymentRouter.post("/verifypayment",isAuth,verifyCheckout)
paymentRouter.post("/free-enroll",isAuth, freeEnrollCourse);

export default paymentRouter