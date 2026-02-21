import User from '../model/userModel.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { genToken } from '../config/token.js';
import sendMail from '../config/sendMail.js';


export const signUp = async (req , res) => {
    try {
        const {name , email , password , role} = req.body;

        let userExist = await User.findOne({email});

        if(userExist){
            return res.status(400).json({
                message : "User already exists"
            })
        }

        if(password.length < 6){
            return res.status(400).json({
                message : "Password must be at least 6 characters"
            })
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message : "Please enter a valid email"
            })
        }

        const hashedPassword = await bcrypt.hash(password , 10);
        const user = await User.create({
            name,
            email,
            password : hashedPassword,
            role
        });

        let token = await genToken(user._id);
        res.cookie("token" , token , {
            httpOnly : true,
            secure : false,
            //process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

        
        return res.status(201).json({
            message : "User created successfully",
            user
        });


    } catch (error) {
        return res.status(500).json({
            message : `SignUp Error ${error.message}`
        });
    }
}

export const login = async (req , res) => { 
    try {
        const {email , password} = req.body;
        const user = await User.findOne({email});
        
        if(!user){
            return res.status(400).json({
                message : "Invalid email or password"
            });
        }

        const isValid = await bcrypt.compare(password , user.password);

        if(!isValid){
            return res.status(400).json({
                message : "Invalid password"
            });
        }

        let token = await genToken(user._id);
        res.cookie("token" , token , {
            httpOnly : true,
            secure : false,
            //process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message : "Login successful",
            user
        }); 

    }
    catch (error) {
        return res.status(500).json({
            message : `Login Error ${error.message}`
        });
    }
}

export const logout = async (req , res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({
            message : "Logout successful"
        });
    } catch (error) {
        return res.status(500).json({
            message : `Logout Error ${error.message}`
        }); 
    }
}


export const sendOtp = async (req , res) => {
    try {
        const {email} = req.body;
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                message : "User with this email does not exist"
            });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        user.resetPasswordOTP = otp;
        user.otpExpiryTime = Date.now() + 5 * 60 * 1000;
        user.isOTPVerified = false;

        await user.save();

        await sendMail(email , otp);

        return res.status(200).json({
            message : "OTP sent to your email"
        });

    } catch (error) {
        return res.status(500).json({
            message : `Send OTP Error ${error.message}`
        });   
    }
}

export const verifyOtp = async (req , res) => {
    try {
        const {email , otp} = req.body;
        const user = await User.findOne({email});

        if (!user ||user.resetPasswordOTP !== otp ||user.otpExpiryTime < Date.now()) {
            return res.status(400).json({
                message : "Invalid OTP or expired"
            });
        }
        user.isOTPVerified = true;
        user.resetPasswordOTP = undefined;
        user.otpExpiryTime = undefined;
        
        await user.save();

        return res.status(200).json({
            message : "OTP verified successfully"
        });

    } catch (error) {
        return res.status(500).json({

            message : `Verify OTP Error ${error.message}`
        });
    }
}
export const resetPassword = async (req , res) => {
    try {
        const {email , password} = req.body;
        const user = await User.findOne({email});

        if(!user || !user.isOTPVerified){
            return res.status(400).json({
                message : "verify OTP before resetting password"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        if(!password || password.length < 6){
            return res.status(400).json({
                message : "Password must be at least 6 characters"
            });
        }

        //  const isSamePassword = await bcrypt.compare(password, user.password);
        
        //  if (isSamePassword) {
        //     return res.status(400).json({
        //     message: "New password must be different from old password"
        //     });
        // }

        user.password = hashedPassword;
        user.isOTPVerified = false;
        
        await user.save();
        return res.status(200).json({
            message : "Password reset successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message : `Reset Password Error ${error.message}`
        });
    }   
}