const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const SECRET = "secretkey";

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("database connected"))
.catch((err) => console.log(err));

const userschema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
});

const User = mongoose.model("User", userschema);

const postschema = new mongoose.Schema({
    title: {type: String, required: true },
    content: String,
    author: {type: String, required: true},
    date: {type: Date, default: Date.now}
});

const Post = mongoose.model("Post", postschema);

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed});
    await user.save();
    res.json({msg: "Signup Successful"});
});

function auth (req, res, next){
    const token  = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) res.status(401).json({msg: "No Token"});
    try{
        req.user = jwt.verify(token, SECRET);
        next();
    }
    catch{
        res.status(400).json({msg: "Invalid token"});
    }
}

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({msg: "Invalid credentials"});
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(400).json({msg: "Invalid credentials"});
    const token = jwt.sign({id: user._id, name: user.name}, SECRET, {expiresIn: "1h"});
    res.json({token});
});

app.get('/posts', async (req, res) => {
    await Post.find()
    .then(post => res.json(post));
});

app.post('/posts', auth, async (req, res) => {
    const post = new Post({...req.body, author: req.user.name});
    await post.save();
    res.json(post);
});

app.put('/posts/:id', auth, async (req, res) => {
    const post = await Post.findOneAndUpdate({_id: req.params.id}, req.body, {new: true});
    if(!post){
        res.status(404).json({msg: "post not found"});
    }
    if (post.author != req.user.name) return res.status(403).json({msg: "Not Allowed"});
    res.json(post).json({msg: "post updated"}); 
});

app.delete('/posts/:id', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if(post){
        if(post.author != req.user.name) return res.status(403).json({msg:"Not Allowed"});
        await Post.findByIdAndDelete(req.params.id);
        res.json({msg: "post deleted"});
    }
    res.status(404).json({msg: "post not found"});
});

app.listen(3000, () => console.log('server running at http://localhost:3000'));
