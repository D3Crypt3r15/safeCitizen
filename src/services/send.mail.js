const nodemailer=require('nodemailer');

const USER='sheylaanaytalvaradocampos@gmail.com';
const PASS='rceaanuzumpuoajl';

function send(to, subject, msg){
    try{    
        const transporter=nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: USER,
                pass: PASS
            }
        });
        const mailConfigurations={
            from: USER,
            to: to,
            subject: subject,
            html: msg
        }

        transporter.sendMail(mailConfigurations, function(error, info){
            if (error) throw new Error(error);
            console.log('Email sent successfully');
            //console.log(info);
        });
    }catch(e){
        console.error(e.message);
    }
}
module.exports=send;
