const jwt = require('jsonwebtoken')

module.exports = function() {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
            next()
        }
        try {
            const token = req.headers.authorization.split(' ')[1] 
            if (!token) {
                return res.status(401).json({message: "Не авторизован"})
            }
            // const decoded = jwt.verify(token, process.env.SECRET_KEY)
            // console.log(decoded)
            // if (decoded.id !== id) {
            //     return res.status(403).json({message: "Нарушение прав доступа"})
            // }
            // req.user = decoded;
            next()
        } catch (e) {
            res.status(401).json({message: "Не авторизован"})
        }
    };
}