const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const validator=require('validator');

const JWT_KEY='1f216aad2222c5697c9851f4fd761fbd5190d96557508b5bdae5e668c4ee8988';
function sign(data, days='3'){
    return jwt.sign(data, JWT_KEY, {expiresIn: days+'d'});
}

function check(token){
    return jwt.verify(token, JWT_KEY);
}

const UserSchema=mongoose.Schema({
    avatar:{
        type: String,
        default: '/static/avatar/avatar.png'
    },
    username: {
        type: String,
        unique: [true, 'Nombre de usuario ya existe.'],
        required: [true, 'Por favor, ingresa tu nombre de usuario.'],
        trim: true
    },
    place: {
        type: String,
        required: [true, 'Ubicacion no encontrada. Intentalo mas tarde.'],
    },
    email:{
        type: String,
        required: [true, 'Por favor, ingresa tu e-mail.'],
        trim: true,
        lowercase: true,
        unique: [true, 'E-mail ya existe.'],
        validate(value){
            if (!validator.isEmail(value)){
                throw new Error('E-mail invalido.');
            }
        }
    },
    dni: {
        type: String,
        required: [true, 'Por favor, ingresa tu DNI.'],
        unique: [true, 'DNI  ya existe.'],
        validate(value){
            if (!/^[\d]{8}$/.test(value)){
                throw new Error('DNI invalido.');
            }
        }
    },
    role:{
        type: String,
        enum: ['admin', 'end_user'],
        lowercase: true,
        default: 'end_user'
    },
    password:{
        type: String,
        required: [true, 'Por favor, ingresa tu contraseña.'],
        trim: true,
        minlength: [7, 'La contraseña debe ser de longitud mayor a 7.'],
        validate(value){
            if (value.toLowerCase().includes('password')){
                throw new Error('Contraseña no debe incluir \'password\'');
            }
        }
    },
    settings: {
        isPrivate: {
            type: Boolean,
            default: false
        },
        newAlerts: {
            type: Boolean,
            default: true
        },
        sound: {
            type: Boolean,
            default: true
        }
    },
    token: {
        type: String
    }
});

UserSchema.pre('save', async function(next){
    const user=this;
    if (user.isModified('password')){
        user.password=await bcrypt.hash(user.password, 8);
    }
    next();
});
UserSchema.statics.validateEmail=async function(email, verify_exists){
    if (!email){
        throw new Error('Email requerido.');
    }
    const user=await User.findOne({email: email});
    if (verify_exists){
        if (user){
            throw new Error('E-mail ya existe.');
        }else{
            return email
        }
    }else{
        if (user){
            return email;
        }else{
            throw new Error('No se pudo encontrar E-mail '+email+' .');
        }
    }
}
UserSchema.statics.validateDNI=async function(dni, verify_exists){
    if (!dni){
        throw new Error('DNI requerido.');
    }
    const user=await User.findOne({dni: dni});
    if (verify_exists){
        if (user){
            throw new Error('DNI ya existe.');
        }else{
            return dni;
        }
    }else{
        if (user){
            return dni;
        }else{
            throw new Error('No se puede encontrar DNI '+dni+' .');
        }
    }
}
UserSchema.statics.getUser=async function(uid, email, dni){
    var user=null;
    if (uid){
        user=await User.findById(uid);
    }else if (dni){
        user=await User.findOne({dni: dni});
    }
    else{
        user=await User.findOne({email: email});
    }
    if (!user){
        throw new Error('No se pudo encontrar usuario.');
    }
    return user;
}
UserSchema.methods.resetPassword=async function(new_password){
    const user=this;
    user.password=new_password;
    await user.save();
    return new_password;
}
UserSchema.methods.generateAuthToken=async function(){
    const user=this;
    const userData= {
        _id: user._id.toString(),
        avatar: user.avatar,
        username: user.username,
        place: user.place,
        email: user.email,
        dni: user.dni,
        role: user.role,
        settings: user.settings
    };
    const token=sign(userData);
    user.token=token;
    await user.save();
    return {token: token, user: userData};
};
UserSchema.statics.verifyAuthToken=async function(token){
    if (!token){
        throw new Error('Token requerido.');
    }
    const user=await User.findOne({token: token});
    if (!user){
        throw new Error('No se pudo encontrar el Token.');
    }
    const userData=check(user.token);
    return userData;
}
UserSchema.statics.removeAuthToken=async function(token){
    if (!token){
        throw new Error('Token requerido.');
    }
    const user= await User.findOne({token: token});
    if (!user){
        throw new Error('No se pudo encontrar el Token.');
    }
    user.token='';
    await user.save();
    return token;
}
UserSchema.statics.findByCredentials= async function(cred){
    if (!cred.email || !cred.password){
        throw new Error('E-mail o contraseña requeridos.');
    }
    
    const user= await User.findOne({email: cred['email']});
    if (!user){
        throw new Error('E-mail no encontrado.');
    }

    const isMatch=await bcrypt.compare(cred.password, user.password);
    if (!isMatch){
        throw new Error('Contraseña incorrecta.');
    }
    return user;
}

const User=mongoose.model('User', UserSchema);
module.exports={
    sign: sign,
    check: check,
    User: User
}