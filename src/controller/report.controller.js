const {User}=require('../models/user');
const Report=require('../models/report');
const Excel=require('exceljs');

class ReportController{
    static create=async (req, resp)=>{
        try{
            const token=req.query.token;
            await User.verifyAuthToken(token);

            const report=new Report(req.body);
            await report.save();
     
            resp.status(200).json({
                status: 200,
                message: 'Reporte creado.',
                data: {
                    report: report
                }
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
    static read=async (req, resp)=>{
        try{
            const token=req.query.token;
            const locality=req.query.locality;
            const lng=req.query.lng;
            const lat=req.query.lat;
            const user=await User.verifyAuthToken(token);
            const FORMAT=req.query.format;
            const COUNT=req.query.count;

            var reports=[];
            var reports2=[];
            if (lng && lat){
                const HOST='https://safecitezen.com';
                reports=await Report.find({"$position.lng": lng, "position.lat": lat}, {position: 0}, {sort: '-createAt'});

                for (let index in reports){
                    if(reports[index].photo.trim() === ''){
                        reports[index].photo=HOST + '/static/sin_imagen.jpg';
                    }
                }
            }else if (locality && !COUNT){
                reports=await Report.aggregate([
                    {$match: {locality: locality}},
                    {$group: {_id: {position: "$position", address: "$address"}}},
                    {$project: {_id: 0, position: "$_id.position", address: "$_id.address"}}
                ]);
            }else{
                if (user.role === 'end_user'){
                    reports=await Report.find({author: user.username}, {}, {sort: '-createAt'});
                }else{
                    if (COUNT){
                        reports=await Report.aggregate([
                            {$match: {locality: locality}},
                            {$group : {_id:"$category", count:{$sum:1}}}
                        ]);
                        reports2=await Report.aggregate([
                            {$group : {_id:"$locality", count:{$sum:1}}}
                        ]);
                    }else{
                        reports=await Report.find({}, {}, {sort: '-createAt'});
                    }                    
                }
            }

            if (FORMAT === 'excel'){
                for (let index in reports){
                    reports[index].photo='';
                }
                resp.writeHead(200, {
                    'Content-Disposition': 'attachment; filename="file.xlsx"',
                    'Transfer-Encoding': 'chunked',
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  })
                const options = {
                    stream: resp,
                    useStyles: true,
                    useSharedStrings: true
                };
                
                const workBook=new Excel.stream.xlsx.WorkbookWriter(options);
                const workSheet=workBook.addWorksheet('Reportes', {properties:{tabColor:{argb:'FFC0000'}}});
                workSheet.columns = [
                    { header: 'Autor', key: 'author', width: 25},
                    { header: 'Descripcion', key: 'description', width: 30},
                    { header: 'Categoria', key: 'category', width: 14},
                    {header: 'Coordenadas', key: 'position', width: 15},
                    { header: 'Direccion', key: 'address', width: 25},
                    { header: 'Ciudad', key: 'locality', width: 10},
                    { header: 'Fecha', key: 'createAt', width: 10}
                ];
                reports.forEach(function(row){ workSheet.addRow(row); });
                workSheet.commit();
                workBook.commit()

            }else{
                resp.status(200).json({
                    status: 200,
                    message: 'Reportes Encontrados.',
                    data: {
                        reports: reports,
                        reports2: reports2
                    }
                });
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
            const token=req.query.token;
            const user=await User.verifyAuthToken(token);
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
    static delete=async (req, resp)=>{
        try{
            const token=req.query.token;
            const reportID=req.query.reportID;
            const user=await User.verifyAuthToken(token);

            if (user.role === 'admin'){
                await Report.deleteOne({_id: reportID});
            }else{
                const report=await Report.findById(reportID);
                if(report.authorID.toString() === user._id){
                    await Report.deleteOne({_id: reportID});
                }else{
                    throw new Error('No tienes los permisos suficientes para elimnar el reporte.');
                }            
            }
            resp.status(200).json({
                status: 200,
                message: 'Reporte Eliminado.',
            });
        }catch(error){
            resp.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
}

module.exports=ReportController;