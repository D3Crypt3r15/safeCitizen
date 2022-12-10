const mongoose=require('mongoose');

const MONGO_URL='mongodb://127.0.0.1:27017/safecitizen';
mongoose.connect(MONGO_URL, {useUnifiedTopology: true, useNewUrlParser: true}, ()=>{
    console.log('Conectado a Base de Datos!');
});
