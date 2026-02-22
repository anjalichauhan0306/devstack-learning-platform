import mongoose, { mongo } from 'mongoose'

const lectureSchema = new mongoose.Schema({
    lectureTitle :{
        type : String,
        required : true
    },
    videoUrl :{
        type : String,
    },
    isPreviewFree : {
        type : Boolean
    },
    description :{
        type:String,
    },
    quiz :{
        type :mongoose.Schema.Types.ObjectId,
        ref:"Quiz"
    }
},{timestamps:true})

const Lecture = mongoose.model("Lecture",lectureSchema)
export default Lecture