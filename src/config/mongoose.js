const mongoose = require('mongoose')

const localhost = 'mongodb://127.0.0.1:27017/jc8ReactMongoose'
const atlas = 'mongodb+srv://reyraditya:satuduatiga123@cluster0-im2il.mongobd.net/jc8ReactMongoose?retryWrites=true'
const atlas2 = 'mongodb+srv://hanif:hakim321@cluster0-bsaj2.mongodb.net/dbku?retryWrites=true'
mongoose.connect(atlas2,{ // Generate connection to database
    useNewUrlParser: true, // Parsing URL to the form mongodb needs
    useCreateIndex: true, // Auto generate Indexes from mongodb, to get access to the data
    useFindAndModify: false //  deprecated
}).then(() => { // if all is ok we will be here
    return server.start();
})
.catch(err => { // we will not be here...
    console.error('App starting error:', err.stack);
    process.exit(1);
});
