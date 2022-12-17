const express=require('express');
const router=express.Router();
const AuthController=require('../controller/user.controller');

router.get('/download', AuthController.download);
router.get('/api/v1/logout', AuthController.logout);
router.get('/api/v1/verify', AuthController.verify);
router.get('/api/v1/login', AuthController.login);
router.post('/api/v1/register', AuthController.register);
router.get('/api/v1/save/:token', AuthController.save);
router.post('/api/v1/forgot', AuthController.forgot);
router.get('/api/v1/recover/:token', AuthController.recover);
router.get('/api/v1/change-password/:token', AuthController.changePassword);

router.get('/api/v1/users', AuthController.listAll);
router.put('/api/v1/user', AuthController.update);
router.put('/api/v1/user/config', AuthController.updateConfig);
router.delete('/api/v1/user', AuthController.delete);
module.exports=router;
