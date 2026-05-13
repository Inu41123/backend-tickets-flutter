// src/controllers/userController.js
const User = require('../models/User');
const Direccion = require('../models/Direccion');
const Telefono = require('../models/Telefono');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// 1. REGISTRO DE USUARIO
// ==========================================
const registrarUsuario = async (req, res) => {
    try {
        const { nombreCompleto, correo, password } = req.body;

        // Verificar si el correo ya existe
        const existeUsuario = await User.findOne({ correo });
        if (existeUsuario) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear el usuario
        const nuevoUsuario = new User({
            nombreCompleto,
            correo,
            password: passwordHash
        });

        const usuarioGuardado = await nuevoUsuario.save();

        // Crear registros vacíos en las otras colecciones (Relación 1:1)
        await new Direccion({ usuarioId: usuarioGuardado._id, calle: 'Pendiente' }).save();
        await new Telefono({ usuarioId: usuarioGuardado._id, numero: '0000000000' }).save();
        
        // 1. Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        usuarioGuardado.codigoVerificacion = codigo;
        await usuarioGuardado.save();

        // ==========================================
        // 2. ENVIAR EL CORREO (AISLADO PARA QUE NO TRUENE)
        // ==========================================
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            await transporter.sendMail({
                from: '"Soporte de Tickets" <no-reply@tusistema.com>',
                to: usuarioGuardado.correo,
                subject: 'Verifica tu cuenta',
                html: `<h3>¡Bienvenido a la plataforma!</h3>
                       <p>Tu código de verificación es: <strong>${codigo}</strong></p>
                       <p>Ingrésalo en la aplicación para activar tu cuenta.</p>`
            });
            console.log("✅ Correo enviado con éxito a:", usuarioGuardado.correo);

        } catch (errorCorreo) {
            // Si el correo falla por culpa de Render/Google, entra aquí y NO MATA LA APP.
            console.error("❌ Error de Nodemailer:", errorCorreo.message);
            console.log("\n==========================================");
            console.log(`💡 CÓDIGO DE EMERGENCIA PARA ${usuarioGuardado.correo}: ${codigo}`);
            console.log("==========================================\n");
        }

        // 3. RESPONDEMOS SÍ O SÍ A FLUTTER PARA QUE QUITE LA RUEDITA
        res.status(201).json({ 
            mensaje: 'Usuario registrado. Revisa tu correo (o los logs de Render XD) para verificar tu cuenta.' 
        });

    } catch (error) {
        console.error("Error fatal en registro:", error);
        res.status(500).json({ mensaje: 'Error al registrar usuario', error });
    }
};

// ==========================================
// 2. LOGIN (Generación de Token)
// ==========================================
// ==========================================
// 2. LOGIN (Generación de Token)
// ==========================================
const loginUsuario = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // 1. Buscar usuario
        const usuario = await User.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        // 2. Verificar si la cuenta está verificada (El código que causaba el error)
        if (usuario.verificado === false) {
            return res.status(403).json({ mensaje: 'Cuenta no verificada. Por favor ingresa el código que enviamos a tu correo.' });
        }

        // 3. Verificar contraseña
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        // 4. Generar Token JWT (Dura 24 horas)
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol },
            process.env.JWT_SECRET || 'firma_secreta_provisional',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombreCompleto,
                rol: usuario.rol
            }
        });
    } catch (error) {
        // Le agregamos error.message para que si vuelve a fallar, nos diga el chisme completo en JSON
        res.status(500).json({ mensaje: 'Error en el login', error: error.message });
    }
};

// ==========================================
// 3. OBTENER PERFIL COMPLETO (Con Dirección y Teléfono)
// ==========================================
const obtenerPerfil = async (req, res) => {
    try {
        const userId = req.user.id;

        const usuario = await User.findById(userId).select('-password');
        const direccion = await Direccion.findOne({ usuarioId: userId });
        const telefono = await Telefono.findOne({ usuarioId: userId });

        res.status(200).json({ usuario, direccion, telefono });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener perfil', error });
    }
};

// ==========================================
// 4. ACTUALIZAR PERFIL (Usuario, Dirección o Teléfono)
// ==========================================
const actualizarPerfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombreCompleto, calle, numero, colonia, telefono } = req.body;

        // Actualizar datos básicos
        if (nombreCompleto) {
            await User.findByIdAndUpdate(userId, { nombreCompleto });
        }

        // Actualizar dirección
        await Direccion.findOneAndUpdate(
            { usuarioId: userId },
            { calle, numero, colonia },
            { new: true }
        );

        // Actualizar teléfono
        if (telefono) {
            await Telefono.findOneAndUpdate(
                { usuarioId: userId },
                { numero: telefono },
                { new: true }
            );
        }

        res.status(200).json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar perfil', error });
    }
};

// ==========================================
// 5. ELIMINAR CUENTA (Borrado en Cascada)
// ==========================================
const eliminarCuenta = async (req, res) => {
    try {
        const userId = req.user.id;

        // Borrar todo lo relacionado
        await Direccion.findOneAndDelete({ usuarioId: userId });
        await Telefono.findOneAndDelete({ usuarioId: userId });
        await User.findByIdAndDelete(userId);

        res.status(200).json({ mensaje: 'Cuenta eliminada permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar cuenta', error });
    }
};

//=========================================
// 6. Cambiar contraseña (Requiere un codigo enviado a correo actual para validar)
//==========================================

const nodemailer = require('nodemailer');

const solicitarCodigoRecuperacion = async (req, res) => {
    try {
        const { correo } = req.body;
        const usuario = await User.findOne({ correo });

        // Por seguridad, si el correo no existe, mandamos un OK genérico
        // Así los atacantes no pueden usar este endpoint para "adivinar" qué correos están registrados
        if (!usuario) {
            return res.status(200).json({ mensaje: 'Si el correo existe, se enviará un código de recuperación.' });
        }

        // Generar código de 6 dígitos aleatorio (ej. 482910)
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código y expiración (15 minutos a partir de ahorita)
        usuario.codigoRecuperacion = codigo;
        usuario.expiracionCodigo = Date.now() + 15 * 60 * 1000; 
        await usuario.save();

        // Configurar nodemailer (Ejemplo usando Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Tu correo en el .env
                pass: process.env.EMAIL_PASS  // Tu "Contraseña de aplicación" de Google en el .env
            }
        });

        // Enviar el correo
        await transporter.sendMail({
            from: '"Soporte de Tickets" <no-reply@tusistema.com>',
            to: usuario.correo,
            subject: 'Código de recuperación de contraseña',
            html: `<h3>Recuperación de cuenta</h3>
                   <p>Tu código de seguridad es: <strong>${codigo}</strong></p>
                   <p>Este código expirará en 15 minutos. Si no solicitaste este cambio, ignora este correo.</p>`
        });

        res.status(200).json({ mensaje: 'Código enviado al correo proporcionado.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al solicitar el código', error });
    }
};



const restablecerPassword = async (req, res) => {
    try {
        const { correo, codigo, nuevaPassword } = req.body;

        const usuario = await User.findOne({
            correo,
            codigoRecuperacion: codigo,
            expiracionCodigo: { $gt: Date.now() } // $gt significa "greater than" (mayor que la hora actual)
        });

        if (!usuario) {
            return res.status(400).json({ mensaje: 'El código es incorrecto o ya ha expirado.' });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaPassword, salt);

        usuario.codigoRecuperacion = null;
        usuario.expiracionCodigo = null;

        await usuario.save();

        res.status(200).json({ mensaje: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al restablecer la contraseña', error });
    }
};




//=========================================
// 7.- Traer todos los usuarios (Solo admin) para mostrar en un panel de administración
//==========================================

const obtenerTodosLosUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find().select('-password');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la lista de usuarios', error });
    }
};



console.log("==========================================");
console.log(`CÓDIGO DE VERIFICACIÓN PARA ${nuevoUsuario.correo}: ${codigoVerificacion}`);
console.log("==========================================");

const verificarCuenta = async (req, res) => {
    try {
        const { correo, codigo } = req.body;
        const usuario = await User.findOne({ correo, codigoVerificacion: codigo });

        if (!usuario) {
            return res.status(400).json({ mensaje: 'Código incorrecto o usuario no encontrado.' });
        }

        usuario.verificado = true;
        usuario.codigoVerificacion = null; // Limpiamos el código
        await usuario.save();

        res.status(200).json({ mensaje: 'Cuenta verificada con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar cuenta', error });
    }
};





const { OAuth2Client } = require('google-auth-library');
// Asegúrate de tener tu GOOGLE_CLIENT_ID en tu archivo .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

// ==========================================
// LOGIN CON GOOGLE
// ==========================================
const googleLogin = async (req, res) => {
    try {
        const { token } = req.body; // El Token gigante que nos manda Flutter

        // 1. Le preguntamos a Google: "¿Este token es real?"
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        // 2. Sacamos los datos del usuario de Gmail
        const { name, email, picture } = ticket.getPayload();

        // 3. Buscamos si ya estaba registrado en tu BD
        let usuario = await User.findOne({ correo: email });

        if (!usuario) {
            // Si es nuevo, lo registramos en MongoDB
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(Math.random().toString(36), salt); // Pass aleatorio

            usuario = new User({
                nombreCompleto: name,
                correo: email,
                password: passwordHash,
                verificado: true // Viene de Google, ya es de confianza
            });

            const usuarioGuardado = await usuario.save();

            // Creamos sus tablas extra para que no truene tu Perfil
            await new Direccion({ usuarioId: usuarioGuardado._id, calle: 'Pendiente' }).save();
            await new Telefono({ usuarioId: usuarioGuardado._id, numero: '0000000000' }).save();
        }

        // 4. Le damos TU propio Token JWT para que navegue por la app
        const sessionToken = jwt.sign(
            { id: usuario._id, rol: usuario.rol },
            process.env.JWT_SECRET || 'firma_secreta_provisional',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token: sessionToken,
            usuario: { id: usuario._id, nombre: usuario.nombreCompleto, rol: usuario.rol }
        });

    } catch (error) {
        console.log("Error en googleLogin:", error);
        res.status(400).json({ mensaje: 'Token de Google inválido', error: error.message });
    }
};


module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil,
    eliminarCuenta,
    obtenerTodosLosUsuarios,
    solicitarCodigoRecuperacion,
    restablecerPassword,
    verificarCuenta,
    googleLogin
};