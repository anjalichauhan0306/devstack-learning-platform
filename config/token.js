import jwt from 'jsonwebtoken';

const genToken = async (userId) => {
    try {
        if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables!");
        return;
        }
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });
        return token;
    } catch (error) {
        console.log(error);
    }
}

export { genToken };