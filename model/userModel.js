import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true , 
        unique : true
    },
    description :  {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    role: {
        type : String,
        required : true , 
        enum : ["student" , "educator"]
    },
    photoUrl : {
        type : String,
        default: ""
    },
   
    enrollCourses : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Courses",
    }],

},{timestamps:true})
    
const User = mongoose.model("User" ,userSchema)
export default(User);