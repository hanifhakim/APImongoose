const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({
    description:{
        type: String,
        required: true,
        trim: true,
        validate(value){
            value = parseInt(value)
            if(!isNaN(value)){
                throw new Error ("Tidak boleh angka")
            }
        }
    },
    completed:{
        type: Boolean,
        default: false
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

const Task = mongoose.model('Task', taskSchema)
module.exports = Task
