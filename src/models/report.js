const mongoose=require('mongoose');

const ReportSchema=mongoose.Schema({
    authorID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    author:{
        type: String
    },
    description:{
        type: String
    },
    category:{
        type: String,
        choice: ['Robo de Casa', 'Robo de Vehiculo', 'Violencia', 'Secuestro', 
        'Accidente', 'Delincuencia', 'Actividad Sospechosa', 'Otro'],
        require: [true, 'Please enter your report type.'],
    },
    photo:{
        type: String,
    },
    address: {
        type: String
    },
    locality:{
        type: String
    },
    position: {
        lat: Number,
        lng: Number
    },
    createAt:{
        type: Date,
        default: Date.now
    }
});

const Report=mongoose.model('Report', ReportSchema);
module.exports=Report;