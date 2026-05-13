// src/middlewares/rateLimiter.js

// Este objeto va a ser la memoria de nuestro servidor.
// Aquí guardaremos las IPs de los que intenten crear tickets.
const memoriaDePeticiones = {};

const cadeneroManual = (req, res, next) => {
    // 1. Sacamos la IP de la persona que está haciendo la petición
    const ipUsuario = req.ip; 
    const tiempoActual = Date.now();
    const ventanaDeTiempo = 60 * 1000; // 1 minuto en milisegundos
    const limiteTickets = 4; // Máximo 4 tickets

    // 2. Si es la primera vez que esta IP entra, le abrimos su expediente
    if (!memoriaDePeticiones[ipUsuario]) {
        memoriaDePeticiones[ipUsuario] = {
            contador: 1,
            primerIntento: tiempoActual
        };
        return next();
    }

    // 3. Si ya estaba en la memoria, revisamos su expediente
    const expediente = memoriaDePeticiones[ipUsuario];
    const tiempoTranscurrido = tiempoActual - expediente.primerIntento;

    // 4. ¿Ya pasó el minuto de castigo/espera?
    if (tiempoTranscurrido > ventanaDeTiempo) {
        // Le reiniciamos la cuenta porque ya pasó el tiempo
        expediente.contador = 1;
        expediente.primerIntento = tiempoActual;
        return next(); // Pásale
    }

    // 5. Si NO ha pasado el minuto, le sumamos un intento a su cuenta
    expediente.contador++;

    // 6. ¡El momento de la verdad! ¿Se pasó del límite?
    if (expediente.contador > limiteTickets) {
        return res.status(429).json({
            mensaje: "¡Tranquilo viejo! (Versión hecha a mano XD). Espera un minuto."
        });
    }

    // Si llegó hasta aquí, es porque va en el intento 2, 3 o 4. Lo dejamos pasar.
    next();
};

module.exports = cadeneroManual;