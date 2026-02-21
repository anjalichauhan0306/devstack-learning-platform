import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transorter = nodemailer.createTransport({
    service: 'Gmail',
    port : 465,
    secure: true,
    auth :{
        user : process.env.USER_EMAIL,
        pass : process.env.USER_PASSWORD
    }
})


const sendMail = async (to,otp) => {
    await transorter.sendMail({
        from : process.env.USER_EMAIL,
        to : to,
        subject : "OTP for Password Reset - DevTrack",
        html : `<h2>Your OTP for password reset is : <strong>${otp}</strong></h2>
                <p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
               
               <p>Best Regards <br/>DevTrack Team</p>
               <p> This is an auto-generated email, please do not reply to this email.</p>
               
               <h1> Thank you for using DevTrack! </h1>`
    })
}

export default sendMail;