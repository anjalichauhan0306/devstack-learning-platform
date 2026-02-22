import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"


const uploadOnCloudinary =  async (filePath) => {
    cloudinary.config({
        cloud_name : process.env.CLOUDINARY_NAME,
        api_key : process.env.CLOUDINARY_API_KEY,
        api_secret : process.env.CLOUDINARY_API_SECRET,
        secure : true
    });

    try {
        if(!filePath) {
            return null;
        }
        const uploadResult =await cloudinary.uploader.upload(filePath , {resource_type : 'auto'});
        fs.unlinkSync(filePath);
        return uploadResult.secure_url;

    } catch (error) {
        fs.unlinkSync(filePath);
        console.error("Error uploading image to Cloudinary:", error);
        return null;
    }
}

export default uploadOnCloudinary;