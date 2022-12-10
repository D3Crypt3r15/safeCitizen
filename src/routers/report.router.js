const express=require('express');
const router=express.Router();
const ReportController=require('../controller/report.controller');

router.get('/api/v1/report', ReportController.read);
router.post('/api/v1/report', ReportController.create);
router.put('/api/v1/report', ReportController.update);
router.delete('/api/v1/report', ReportController.delete);

module.exports=router;
