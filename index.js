import express from "express"
import dotenv from 'dotenv'
import { db } from "./config/db.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import authRouter from "./routes/authRoute.js"
import userRouter from "./routes/userRoute.js"
dotenv.config()

const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin : "http://localhost:5173",
    credentials : true
}));

app.use("/api/auth" , authRouter);
app.use("/api/user/",userRouter);


app.get("/",(req,res) => {
  res.send("Hello from server");
})

db();
app.listen(port , () => {
    console.log(`server is running at http://localhost:${port}`);
})

