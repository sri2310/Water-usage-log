const router=require('express').Router();
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const rateLimit=require('express-rate-limit');
const db=require('../supabase');
const auth=require('../middleware/auth');
const limiter=rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many attempts. Try later.'}});
const cookieOptions=()=>({httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:24*60*60*1000});
router.post('/register',limiter,async(req,res,next)=>{try{
 const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');
 if(name.length<2||name.length>80||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||password.length>72) return res.status(400).json({error:'Enter a name, valid email, and password of 8–72 characters.'});
 const hash=await bcrypt.hash(password,12);
 const {data,error}=await db.from('app_users').insert({name,email,password_hash:hash}).select('id,name,email').single();
 if(error){if(error.code==='23505')return res.status(409).json({error:'Email already registered.'});throw error;}
 res.status(201).json({message:'Account created. Please log in.',user:data});
}catch(e){next(e)}});
router.post('/login',limiter,async(req,res,next)=>{try{
 const email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');
 const {data,error}=await db.from('app_users').select('id,name,email,password_hash').eq('email',email).maybeSingle();if(error)throw error;
 if(!data||!await bcrypt.compare(password,data.password_hash))return res.status(401).json({error:'Invalid email or password.'});
 const token=jwt.sign({id:data.id},process.env.JWT_SECRET,{expiresIn:'24h',algorithm:'HS256'});
 res.cookie('session',token,cookieOptions()).json({user:{id:data.id,name:data.name,email:data.email}});
}catch(e){next(e)}});
router.post('/logout',(req,res)=>res.clearCookie('session',{path:'/',sameSite:'lax',secure:process.env.NODE_ENV==='production'}).json({message:'Logged out'}));
router.get('/me',auth,async(req,res,next)=>{try{const {data,error}=await db.from('app_users').select('id,name,email').eq('id',req.user.id).single();if(error)throw error;res.json({user:data});}catch(e){next(e)}});
module.exports=router;
