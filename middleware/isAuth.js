import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const isAuth = async (req, res, next) => {
  try {
    let { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    };
  

    let verifyToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!verifyToken) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.userId = verifyToken.userId;
    next();
  } catch (error) {
  return res.status(401).json({
    message: "Unauthorized",
  });
}
};

export default isAuth;
