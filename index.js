import express from "express"
import dotenv from 'dotenv'
import { db } from "./config/db.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from 'helmet'
import authRouter from "./routes/authRoute.js"
import userRouter from "./routes/userRoute.js"
import courseRouter from "./routes/courseRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import reviewRouter from "./routes/reviewRouter.js"
import quizRoute from "./routes/quizRoute.js"
import errorHandler from "./middleware/errorhandler.js"
import router from "./routes/adminRoute.js"

dotenv.config()

const app = express()

app.use(errorHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 5000;
app.use(express.json())
app.use(cookieParser())
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials : true
}));

app.use("/api/auth" , authRouter);
app.use("/api/user/",userRouter);
app.use("/api/course",courseRouter)
app.use("/api/payment",paymentRouter)
app.use("/api/review",reviewRouter)
app.use("/api/quiz", quizRoute)
app.use("/api/admin" ,router)

app.get("/",(req,res) => {
  res.send("Hello from server");
})
app.use('/assets', express.static('assets'));

db().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

