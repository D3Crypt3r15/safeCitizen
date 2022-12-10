const readline = require('readline');
const User=require('./models/user').User;
require('./db/mongoose');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>'
});


function updateOne(){
    rl.question('DNI de usuario: ', (DNI) => {
        var rlDNI=DNI;
        rl.question('Nueva Contraseña: ', async (newPassword) => {
            try{
                const user=await User.getUser(null, null, rlDNI);
                if (user){
                    await user.resetPassword(newPassword);
                }
            }catch (e){
                console.log(e.message);
            }finally{
                rl.close();
            }
        });
    });
}

async function updateTwo(){
    rl.question('DNI de usuario: ', (DNI) => {
        rl.question('Elija un rol:\n[0] Usuario Final.\n[1] Administrador.\n', async (newRole) => {
            const ROLES=['end_user', 'admin']
            const response=await User.findOneAndUpdate({dni: DNI}, {role: ROLES[newRole], token: ''});
            if (response){
                console.log('Rol Actualizado.');
            }else{
                console.log('Usuario no encontrado.');
            }
            rl.close();
        });
    });
}

setTimeout(()=>{
    rl.question('\nHola, Bienvenido(a). ¿Que deseas realizar?\n[0] Leer Usuarios.\n[1] Actualizar Usuario.\n[2] Borrar Usuario.\n', async function (action) {
        const ACTION=parseInt(action);
        switch (ACTION){
            case 0:
                const users=await User.find();
                console.log("\nUsuario\t\t\t\t\tDNI\t\tRol");
                for (let index in users){
                    let user=users[index];
                    console.log(`${user.username}\t${user.dni}\t${user.role}`);
                }
                rl.close();
            case 1:
                console.clear();
                rl.question('¿Que desea actualizar?\n[0] Contraseña.\n[1] Rol\n', function (update) {
                    const UPDATE=parseInt(update);
                    
                    if(UPDATE === 0){
                        updateOne();
                    }else if (UPDATE === 1){
                        updateTwo();
                    }else{
                        console.log('Opcion no valida.');
                    }
                });
            case 2:
                console.clear();
                rl.question('DNI de usuario a borrar: ', async function (DNI) {
                    const response=await User.findOneAndRemove({dni: DNI});
                    if (response){
                        console.log('Usuario Eliminado.');
                    }else{
                        console.log('Usuario no encontrado.');
                    }
                    rl.close();
                });
                break
            default:
                console.log('Opcion no valida.');
        }
    });

    rl.on('close', function () {
        console.log('\nBYE BYE !!!');
        process.exit(0);
    });
}, 100);