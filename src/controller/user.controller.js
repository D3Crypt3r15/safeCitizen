const {User, sign, check}=require('../models/user');
const sendMail=require('../services/send.mail');
const fetch=require('node-fetch');

const API_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6IjEyMjE1MTFAc2VuYXRpLnBlIn0.wysyDhNoCsw7oYKtKiPL43kjF3iZtCWmMrOzZ8PaOkw";
const HOST='https://safecitezen.com';
class AuthController{
    static download=async (req, resp)=>{
        try{
            resp.set("Content-Disposition", 'attachment; filename="safecitizen.apk"');
            resp.sendFile('./assets/release/app-release.apk', {root: '.'});
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static verify=async (req, resp)=>{
        try{
            const token=req.query.token;
            const user=await User.verifyAuthToken(token);
            const user2=await User.findById(user._id);
            user.settings=user2.settings;
            user.place=user2.place;
            user.role=user2.role;
            user.avatar=user2.avatar;

            resp.status(200).json({
                status: 200,
                message: 'Verificacion correcta.',
                data: {
                    user: user,
                    token: token
                }
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static register=async (req, resp)=>{
        try{
            if (!req.body.dni){
                throw new Error('DNI es requerido.');
            }else if (!req.body.place){
                throw new Error('Ciudad es requerida.');
            }else if (!req.body.password){
                throw new Error('Contraseña es requerida.');
            }
            
            const email=req.body.email;
            const _DNI=req.body.dni;
            const _codeVerification=req.body.codeVerification;
            const _fullName=req.body.username;
            const URI="https://dniruc.apisperu.com/api/v1";
            await User.validateEmail(email, true);
            await User.validateDNI(_DNI, true);

            //REQUEST USER DATA ON NET
            const FULL_URI=URI+'/dni/'+_DNI+'?token='+API_TOKEN;
            const raw=await fetch(FULL_URI);
            const json=await raw.json();
            if (json['success'] === false){
                throw new Error('DNI '+_DNI+' no encontrado.');
            }
            const fullName=json['nombres'] + " " + json['apellidoPaterno'] + " " + json['apellidoMaterno'];
            const codeVerification=json['codVerifica'];

            if (fullName.toLocaleLowerCase() === _fullName.toLocaleLowerCase()){
                const TOKEN=sign(req.body);
                const URL=HOST+'/save/'+TOKEN;
                console.log('SIGNUP URL: ', URL);
                const msg="<span>Token para terminar de registrarse es <a href='"+URL+"'>"+URL+"</a></span>";
                sendMail(req.body.email, 'Crear cuenta en SafeCitezen.', msg);
                resp.status(200).json({
                    status:200,
                    message: 'Email enviado a '+req.body.email,
                });
            }else{
                throw new Error('Nombre de usuario no coincide con el numero de DNI.');
            }
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static save=async (req, resp)=>{
        try{
            const userData=check(req.params.token);
            const user=new User(userData);
            user.settings.isPrivate=false;
            user.settings.newAlerts=true;
            user.settings.sound=true;
            await user.save();
            resp.status(200).json({
                status:200,
                message: 'Registro exitoso.',
                data: {
                    user: user
                }
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static login=async (req, resp)=>{
        try{
            const credentials={
                email:req.query.email,
                password:req.query.password
            }

            const user=await User.findByCredentials(credentials);
            const data=await user.generateAuthToken();
            resp.status(200).json({
                status: 200,
                message: 'Login exitoso.',
                data: data
            });
        }catch(error){
            resp.status(400).json({
                status:400,
                message: error.message,
            });
        }
    }
    static logout=async (req, resp)=>{
        try{
            const _token=req.query.token;
            const token=await User.removeAuthToken(_token);
            resp.status(200).json({
                status: 200,
                message: 'Cerrar sesion exitoso.',
                data: {
                    token: token
                }
            });
        }catch(error){
            resp.status(400).json({
                status:400,
                message: error.message,
            });
        }
    }
    static forgot=async (req, resp)=>{
        try{
            await User.validateEmail(req.body.email, false);
            const TOKEN=sign(req.body);
            const URL=HOST+'/recover/'+TOKEN;
            console.log("RECOVER URL: ",URL);
            const msg="<span>Token para recuperar cuenta: <a href='"+URL+"'>"+URL+"</a></span>";
            sendMail(req.body.email, 'Recupera el acceso a SafeCitizen.', msg);
            resp.status(200).json({
                status:200,
                message: 'E-mail enviado a '+req.body.email
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static recover=async (req, resp)=>{
        try{
            const email=check(req.params.token).email;
            const user=await User.getUser(null, email);
            await user.resetPassword(req.query.newPassword);
 
            resp.status(200).json({
                status:200,
                message: 'Recuperacion de cuenta exitosa.',
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }      
    }

    static changePassword=async (req, resp)=>{
        try{
            const email=check(req.params.token).email;
            const credentials={
                email: email,
                password: req.query.oldPassword
            }

            const user=await User.findByCredentials(credentials);
            await user.resetPassword(req.query.newPassword);
 
            resp.status(200).json({
                status:200,
                message: 'Recuperacion de cuenta exitosa.',
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }      
    }
    static listAll=async (req, resp)=>{
        try{
            const role=check(req.query.token).role;

            if (role === 'admin'){
                const users=await User.find({}, {username: 1, place: 1, email: 1, dni: 1, role: 1});
                resp.status(200).json({
                    status:200,
                    message: 'Usuarios Encontrados.',
                    data:  {
                        users: users
                    }
                });
            }else{
                throw new Error('Permisos insuficientes.');
            }

        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }      
    }

    static update=async (req, resp)=>{
        try{
            const token=req.body.token;
            const userID=req.body.userID;
            const user=await User.verifyAuthToken(token);

            if (user._id === userID){
                throw new Error('No puedes cambiar el rol de tu mismo usuario.');
            }
            if (user.role === 'admin'){
                await User.findByIdAndUpdate(userID, {role: req.body.newRole});
            }else{
                throw new Error('No tienes los permisos suficientes para actualizar el usuario.');          
            }
            resp.status(200).json({
                status: 200,
                message: 'Usuario Actualizado.',
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static updateConfig=async (req, resp)=>{
        try{
            const token=req.body.token;
            const newSettings=req.body.newSettings;
            const newPlace=req.body.place;
            const newAvatar=req.body.avatar;
            const user=await User.verifyAuthToken(token);

            await User.findByIdAndUpdate(user._id, {avatar: newAvatar, place: newPlace, settings: newSettings});
            resp.status(200).json({
                status: 200,
                message: 'Configuracion Actualizada.',
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static delete=async (req, resp)=>{
        try{
            const token=req.query.token;
            const userID=req.query.userID;
            const user=await User.verifyAuthToken(token);

            if (user._id === userID){
                throw new Error('No puedes eliminar tu mismo usuario.');
            }
            if (user.role === 'admin'){
                await User.deleteOne({_id: userID});
            }else{
                throw new Error('No tienes los permisos suficientes para elimnar el usuario.');          
            }
            resp.status(200).json({
                status: 200,
                message: 'Usuario Eliminado.',
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }

}
module.exports=AuthController;