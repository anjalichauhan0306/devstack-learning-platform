import User from '../model/userModel.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { genToken } from '../config/token.js';


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

export const login = async (req , res) => { {
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