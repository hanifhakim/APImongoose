const express = require('express')
const port = require('./config/index')
const cors = require('cors')
const multer = require('multer')
const sharp = require('sharp')

const User = require('./models/user')
const Task = require('./models/task')
require('./config/mongoose')

const app = express()
app.use(cors())
app.use(express.json())


//REGISTER USER
app.post('/users', async(req,res) =>{
    const user = new User(req.body)

    try {
        await user.save() 
        res.status(200).send(user)       
    } catch (error) {
        res.status(400).send(error.message)
        
    }
})

//LOGIN USER
app.post('/users/login', async (req, res) => {
    const {email, password} = req.body

    try {
        const user = await User.findByCredentials(email, password) // Function buatan sendiri
        res.status(200).send(user)
    } catch (e) {
        res.status(404).send(e)
    }
})

//CREATE TASK BY USER ID
app.post('/tasks/:userid', async (req, res) => {//create by user id
    try {
        const user = await User.findById(req.params.userid) // search user by id
        if(!user){ // jika user tidak ditemukan
            throw new Error("Unable to create task")
        }
        const task = new Task({...req.body, owner: user._id}) // membuat task dengan menyisipkan user id di kolom owner
        user.tasks = user.tasks.concat(task._id) // tambahkan id dari task yang dibuat ke dalam field 'tasks' user yg membuat task
        await task.save() // save task
        await user.save() // save user
        res.status(201).send(task)
    } catch (e) {
        res.status(404).send(e)
    }
})

//GET TASKS WITH USERID
app.get('/tasks/:userid', async (req, res) => {
    try {
        //find mengirim dalam bentuk array
       const user = await User.find({_id: req.params.userid})
                     .populate({path:'tasks',
                    options:{sort: {completed:'asc'},
                    limit: 5}
                    }
                     ).exec()
    
       res.send(user[0].tasks)//ambil data yg dibutuhkan di dlm array
    } catch (e) {
       res.send(e);
        
    }
})

//DELETE TASKS
app.delete('/tasks', async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.body.id})
        const user = await User.findOne({_id: req.body.userid, tasks:req.body.id})
        // console.log(user.tasks);
        var z = user.tasks.filter((val)=>{
            return val.toString() !== req.body.id
            //tanpa return bisa
        })
        // console.log(user.tasks[0]);
        // console.log(typeof(user.tasks[0]));
        // console.log(req.body.id);
        // console.log(typeof(req.body.id));
        
        user.tasks = z
        if(!z){
            return res.status(404).send("Delete failed")
        }
        await user.save()
        res.status(200).send({task, user})
    } catch (e) {
        res.status(500).send(e)
    }
})

//EDIT TASKS, T/F
app.patch('/tasks/:taskid/:userid', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({err: "Invalid request!"})
    }

    try {
        const task = await Task.findOne({_id: req.params.taskid, owner: req.params.userid})
        
        if(!task){
            return res.status(404).send("Update Request")
        }
        
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        
        res.send("update berhasil")
        
        
    } catch (e) {
        res.send(e)
    }
})

//FILTERING IMG
const upload = multer({
    limits:{
        fileSize: 1000000 // in byte
    },
    fileFilter(req, file, callback){//file: gambar yg masuk, cb: memberi response
        const picture = file.originalname.match(/\.(jpg|jpeg|png)$/)
        if(!picture){
            //throw err
            return callback(new Error('Please upload image with ext (jpg, jpeg, or png)'))
        }
        //diterima
        callback(undefined, true)//ketentuan dari multer
        //ditolak
        // callback(undefined, false) bisa dipakai di !picture, namun tidak mengirim error ke FE, hanya mencegah aplod
    }
})

//POST IMG
app.post('/users/:userid/avatar', upload.single('avatar'), async (req, res) => {
    try {
    const buffer = await sharp(req.file.buffer).resize({width: 250}).png().toBuffer()
    console.log(buffer);
    
    const user = await User.findById(req.params.userid)
    if (!user) {
        throw new Error ("Unable to upload")
    }

    user.avatar = buffer
    await user.save()//baru nyimpan di db, belum di web server
    res.status(200).send("upload success!")

    } catch (e) {
        res.send(e)
    }
})

//GET IMG
app.get('/users/:userid/avatar/:img', async (req, res) => {
    try {
        const user = await User.findById(req.params.userid)
        if (!user || !user.avatar) {
            throw new Error("Not found")//tdk ketemu user || ketemu user tanpa avaatar
        }
        res.set('Content-Type', 'image/png')//settingan default JSON kita ubah supaya nyimpen img
        res.send(user.avatar)
    } catch (e) {
        res.send(e)
    }
})

//DELETE AVA
app.delete('/users/:userid/avatar', async (req, res)=>{
    try {
        const {userid}=req.params
        const user = await User.findByIdAndUpdate(userid, {$set:{avatar:''}})
        // user.avatar = null
        if (!user) {
            throw new Error("Tidak ada")
        }
        await user.save()
        res.send("SUKSES DELETE AVA")
    } catch (e) {
        res.send(e);
        
    }
})

//DELETE USER
app.delete('/users/:userid', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userid)
        if(!user){
            throw new Error("unable to delete")
            
        }
        await Task.deleteMany({owner: user._id}).exec()
        res.send("delete successful")
    } catch (e) {
        res.send(e)
    }
})

// Edit profile
app.patch('/users/:userid', async (req, res) => {
    const {password} = req.body
    if (password ==="") {
        var updates = Object.keys(req.body)
        var allowedUpdates = ['name', 'email', 'age']
        var isValidOperation = updates.every(update => allowedUpdates.includes(update))
            
    } else {
        var updates = Object.keys(req.body)
        var allowedUpdates = ['name', 'email', 'password', 'age']
        var isValidOperation = updates.every(update => allowedUpdates.includes(update))
        
    }

     if(!isValidOperation) {
        return res.status(400).send({err: "Invalid request!"})
    }

     try {
        const user = await User.findOne({_id: req.params.userid})

        if(!user){
            return res.status(404).send("Update Request")
        }

        updates.forEach(update => user[update] = req.body[update])
        await user.save()
        res.send("Update succeeded")

    } catch(e) {
        res.send(e)
    }
})


app.listen(port, ()=> console.log('API berhasil running di port', port))