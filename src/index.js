const fs=require('fs');
const path=require('path');
const express=require('express');
const multer=require('multer');
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
        origins: ['http://localhost:8080', 'http://localhost'],
        methods: ['GET', 'POST']  
    }
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '/assets/uploads/'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
  })
const upload=multer({storage: storage});
const cors=require('cors');

require('./db/mongoose');
const userRouter=require('../src/routers/user.router');
const reportRouter=require('../src/routers/report.router');
const User=require('../src/models/user').User;
const Report=require('../src/models/report');

app.use(express.urlencoded({extended: false, limit: '50mb'}));
app.use(express.json({limit: '50mb'}));
app.use('/static', express.static('./assets'));
app.use('/css', express.static('./assets/css'));
app.use('/js', express.static('./assets/js'));
app.use('/fonts', express.static('./assets/fonts'));
app.use('/img', express.static('./assets/img'));
app.use('/favicon.ico', express.static('./assets/favicon.ico'));

app.use(cors());
app.use(userRouter);
app.use(reportRouter);

app.get('(/|/save/*|/recover/*)', function(req, res) {
    res.sendFile(path.join(__dirname, '/templates/index.html'));
});
app.post('/upload', upload.single("image"), function (req,resp) {
    resp.status(200).json({
        status: 200,
        message: 'Upload!',
        data:{
            path: '/static/uploads/'+req.file.filename
        }
    });
})

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