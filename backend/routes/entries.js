const router=require('express').Router();
const db=require('../supabase');const auth=require('../middleware/auth');
router.use(auth);
const categories=['Drinking','Cooking','Bathing','Laundry','Cleaning','Gardening','Other'];
function valid(body){
 const date=String(body.usage_date||''),category=String(body.category||''),liters=Number(body.liters),notes=String(body.notes||'').trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))return {error:'Choose a valid date that is not in the future.'};
 if(!categories.includes(category)||!Number.isFinite(liters)||liters<=0||liters>100000||Math.round(liters*100)!==liters*100)return {error:'Choose a category and a quantity from 0.01 to 100000 liters (up to 2 decimals).'};
 if(notes.length>300)return {error:'Notes must be 300 characters or fewer.'};
 return {usage_date:date,category,liters,notes};
}
router.get('/',async(req,res,next)=>{try{
 let q=db.from('water_entries').select('id,usage_date,category,liters,notes,created_at').eq('user_id',req.user.id).order('usage_date',{ascending:false}).order('created_at',{ascending:false}).limit(500);
 if(req.query.category){if(!categories.includes(req.query.category))return res.status(400).json({error:'Invalid category.'});q=q.eq('category',req.query.category)}
 if(req.query.from){if(!/^\d{4}-\d{2}-\d{2}$/.test(req.query.from))return res.status(400).json({error:'Invalid start date.'});q=q.gte('usage_date',req.query.from)}
 if(req.query.to){if(!/^\d{4}-\d{2}-\d{2}$/.test(req.query.to))return res.status(400).json({error:'Invalid end date.'});q=q.lte('usage_date',req.query.to)}
 const {data,error}=await q;if(error)throw error;res.json({entries:data});
}catch(e){next(e)}});
router.post('/',async(req,res,next)=>{try{const entry=valid(req.body);if(entry.error)return res.status(400).json(entry);
 const {data,error}=await db.from('water_entries').insert({...entry,user_id:req.user.id}).select().single();if(error)throw error;res.status(201).json({entry:data});
}catch(e){next(e)}});
router.put('/:id',async(req,res,next)=>{try{const entry=valid(req.body);if(entry.error)return res.status(400).json(entry);
 const {data,error}=await db.from('water_entries').update(entry).eq('id',req.params.id).eq('user_id',req.user.id).select().maybeSingle();if(error)throw error;
 if(!data)return res.status(404).json({error:'Entry not found.'});res.json({entry:data});
}catch(e){next(e)}});
router.delete('/:id',async(req,res,next)=>{try{const {data,error}=await db.from('water_entries').delete().eq('id',req.params.id).eq('user_id',req.user.id).select('id').maybeSingle();if(error)throw error;
 if(!data)return res.status(404).json({error:'Entry not found.'});res.json({message:'Entry deleted.'});
}catch(e){next(e)}});
module.exports=router;
