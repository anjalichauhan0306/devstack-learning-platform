import User from "../model/userModel.js";

const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

export default isAdmin;