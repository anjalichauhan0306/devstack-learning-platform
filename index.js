import express from "express"
import dotenv from 'dotenv'
import { db } from "./config/db.js"
import cookieParser from "cookie-parser"

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth" , authRouter);

app.get("/",(req,res) => {
  res.send("Hello from server");
})

db();
app.listen(port , () => {
    console.log(`server is running at http://localhost: ${port}`);
})

