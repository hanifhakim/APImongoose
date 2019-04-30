const mongoose = require("mongoose")
const validator = require('validator/lib/isEmail')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({//membuat collection di mongoose, nama user akan dirubah toLowerCase dan dibuat plural (tambah s) oleh mongoose scr otomatis
    name:{
        type: String,
        required: true,//wajib diisi, akan error saat mau disave
        trim: true, //menghapus spasi dibelakang dan didepan
        validate(value){
            value = parseInt(value)
            if(!isNaN(value)){
                throw new Error ("Tidak boleh angka")
            }
        }
    },
    email:{
        type: String,
        required: true,
        validate(value){
        if(!validator(value)){
            throw new Error ("Email tidak valid")
            }
        }
    },
    age:{
        type: Number,
        //default: 0, nilai default apabila user tdk mengisi
        required: true,
        validate(value){//without validator extention
            if(value<18){
                throw new Error ("Umur tidak valid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("Password tidak boleh mengandung 'password'")
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tasks : [{
        type: mongoose.Schema.Types.ObjectId,//ambil data obj dari collection task
        ref: 'Task'
    }]
},{
    timestamps:true
})

//hash password before save
userSchema.pre('save', async function (next) { // do something before save the document () next akan diisi oleh mongoose
    const user = this // access to the user document {name, age, email, password}
    if(user.isModified('password')){//apakah password mengalami
        user.password = await bcrypt.hash(user.password, 8) // hash the new incoming password
    }

    next() // finish
})

userSchema.statics.findByCredentials = async (email, password) => {
    // mencari by email
    const user = await User.findOne({email})

    if(!user){
        throw new Error ('Unable to login')
    }
    //compare password
    const isMatch = await bcrypt.compare(password, user.password)//password adalah string, output berupa boolean

    if(!isMatch){
        throw new Error ('Unable to login')
    }

    return user
}

const User = mongoose.model('User', userSchema)

module.exports = User