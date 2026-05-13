// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // 1. Buscamos el token en las cabeceras de la petición
    // En el front, tu compañera lo mandará como "Bearer eyJhbGciOi..."
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Se requiere un token.' });
    }

    try {
        // 2. Limpiamos el string para quedarnos solo con el código del token
        const token = authHeader.replace('Bearer ', '');

        // 3. Verificamos que el token sea auténtico y no haya expirado
        // OJO: Debe usar la misma llave secreta que pusimos en el login
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'firma_secreta_provisional');

        req.user = verificado;

        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};

const esAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ mensaje: '¡Saquese! Acceso denegado. Solo administradores.' });
    }
    next(); 
};

module.exports = { verificarToken, esAdmin };