const fs=require('fs');
const express=require('express');
const app=express();

const httpsOptions={
    key: fs.readFileSync('./certs/private.key'),
    cert: fs.readFileSync('./certs/certificate.crt'),
    ca: [
        fs.readFileSync('./certs/ca_bundle.crt')
    ]
}
const https=require('https').createServer(httpsOptions, app);
const io=require('socket.io')(https, {
    cors: {
        origins: ['http://localhost:8080'],
        methods: ['GET', 'POST']  
    }
});
const cors=require('cors');

require('./db/mongoose');
const userRouter=require('../src/routers/user.router');
const reportRouter=require('../src/routers/report.router');
const User=require('../src/models/user').User;
const Report=require('../src/models/report');

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use('/static', express.static('./assets'));
app.use(cors());
app.use(userRouter);
app.use(reportRouter);

io.use(async (socket, next)=>{
    const token=socket.handshake.auth.token;
    try{
        const user=await User.verifyAuthToken(token);
        const user2=await User.findById(user._id);
        user.settings=user2.settings;
        user.place=user2.place;

        socket.user=user;
        next();
    }catch(e){
        console.log('Error: %s', e.message);
        return next(new Error(e.message));
    }
});
io.on('connection', async (socket)=>{
    socket.join(socket.user.place);
    socket.on('disconnect', ()=>{
        console.log('User disconnected!');
    });
    socket.on('new-report', async (msg)=>{
        msg.authorID=socket.user._id
        const report=new Report(msg);
        await report.save();

        socket.broadcast.to(msg.locality).emit('server-new-report', msg);
    });
});

const PORT=443;
https.listen(PORT, ()=>{
    console.log('Listening on *:' + PORT);
});