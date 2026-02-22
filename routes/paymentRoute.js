import express from 'express'
import { createStripeCheckout, freeEnrollCourse, verifyCheckout } from '../controller/paymentController.js'

const paymentRouter = express.Router()

paymentRouter.post("/create-checkout-session", createStripeCheckout);
paymentRouter.post("/verifypayment",verifyCheckout)
paymentRouter.post("/free-enroll", freeEnrollCourse);


export default paymentRouter