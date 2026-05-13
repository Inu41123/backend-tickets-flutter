// src/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
    crearTicket, 
    obtenerTickets, 
    actualizarEstado, 
    actualizarTicket, 
    eliminarTicket 
} = require('../controllers/ticketController');

// ¡LA PIEZA QUE FALTABA! Importamos al cadenero
const { verificarToken } = require('../middlewares/authMiddleware'); 

// 2. Configuramos las reglas del cadenero de spam
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 4, 
    message: { 
        mensaje: "¡Tranquilo viejo! Has creado demasiados tickets seguidos. Espera un minuto antes de mandar otro." 
    }
});

// 3. Agregamos "verificarToken" a TODAS las rutas porque nadie sin login debería andar aquí
router.post('/', verificarToken, limiter, crearTicket);          
router.get('/', verificarToken, obtenerTickets);        
router.put('/:id', verificarToken, actualizarTicket);   
router.put('/:id/status', verificarToken, actualizarEstado); 
router.delete('/:id', verificarToken, eliminarTicket);  

module.exports = router;