
import jwt from 'jsonwebtoken';

const isAuth = async (req,res,next) => {
    try {
        let {token} = req.cookies;

        if(!token){
            return res.status(401).json({
                message : "Unauthorized"
            });
        }

        let verifyToken = jwt.verify(token , process.env.JWT_SECRET);

        if(!verifyToken){
            return res.status(401).json({
                message : "Unauthorized"
            });
        }

        req.userId = verifyToken.userId;
        next();
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : `IsAuth Error : ${error.message}`
        });
    }
}

export default isAuth;