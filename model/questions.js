import { Type } from "@google/genai";
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    quizId:{
        type  : mongoose.Schema.Types.ObjectId,
        ref:"Quiz",
        required : true
    },
    content:{
        type:String,
        required : true
    },
    options : [
        {
            type:String,
            required:true
        }
    ]
    ,
    correctOption : {
        type:String,
    },
    explantion : {
        type:String
    }
},{timestamps:true})

export const Questions = mongoose.model("Questions",questionSchema)