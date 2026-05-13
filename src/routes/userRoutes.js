// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
    registrarUsuario, 
    loginUsuario, 
    obtenerPerfil, 
    actualizarPerfil, 
    eliminarCuenta,
    solicitarCodigoRecuperacion, // <-- Te faltaba esta
    restablecerPassword,         // <-- Te faltaba esta
    obtenerTodosLosUsuarios,     // <-- Y te faltaba la del Admin
    verificarCuenta
} = require('../controllers/userController');
// const verificarToken = require('../middlewares/authMiddleware');

// Cadenero anti-spam para el login y registro
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // Máximo 10 intentos
    message: { mensaje: "Demasiados intentos. Espera 5 minutos." }
});
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

const { googleLogin } = require('../controllers/userController'); 

// Rutas Públicas (No requieren Token)
router.post('/registro', authLimiter, registrarUsuario);
router.post('/login', authLimiter, loginUsuario);

// Rutas Privadas (SÍ requieren Token, por eso llevan verificarToken en medio)
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.delete('/eliminar-cuenta', verificarToken, eliminarCuenta);

// Rutas de cambio de contraseña (Requieren Token para validar identidad, pero no rol específico)
router.post('/solicitar-codigo', authLimiter, solicitarCodigoRecuperacion);
router.post('/restablecer-password', authLimiter, restablecerPassword);

// Rutas de Admin (Requieren Token y Rol de Admin)
router.get('/todos', verificarToken, esAdmin, obtenerTodosLosUsuarios);

router.post('/verificar-cuenta', authLimiter, verificarCuenta);

// Ruta para el Login de Google
router.post('/google-login', googleLogin);

module.exports = router;