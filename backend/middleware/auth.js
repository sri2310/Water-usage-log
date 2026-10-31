const jwt = require('jsonwebtoken');
module.exports = (req,res,next) => {
 const token = req.cookies.session;
 if(!token) return res.status(401).json({error:'Please log in first.'});
 try {req.user=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']});next();}
 catch {return res.status(401).json({error:'Session expired. Please log in.'});}
};
