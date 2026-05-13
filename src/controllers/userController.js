// src/controllers/userController.js
const User = require('../models/User');
const Direccion = require('../models/Direccion');
const Telefono = require('../models/Telefono');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend'); // <-- IMPORTAMOS RESEND

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
        // 2. ENVIAR EL CORREO CON RESEND
        // ==========================================
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            await resend.emails.send({
                // ⚠️ CAMBIAR AQUÍ: Pon el subdominio que te vayan a dar
                from: 'Verificación <no-reply@tu-subdominio-oficial.com>', 
                to: usuarioGuardado.correo,
                subject: 'Verifica tu cuenta - GestiónTech',
                html: `<h3>¡Bienvenido a la plataforma!</h3>
                       <p>Tu código de verificación es: <strong>${codigo}</strong></p>
                       <p>Ingrésalo en la aplicación para activar tu cuenta.</p>`
            });
            console.log("Correo de registro enviado con Resend a:", usuarioGuardado.correo);

        } catch (errorCorreo) {
            // Si el correo falla, NO MATA LA APP, solo avisa en consola
            console.error("Error de Resend en registro:", errorCorreo);
        }

        // 3. RESPONDEMOS SÍ O SÍ A FLUTTER
        res.status(201).json({ 
            mensaje: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.' 
        });

    } catch (error) {
        console.error("Error fatal en registro:", error);
        res.status(500).json({ mensaje: 'Error al registrar usuario', error });
    }
};

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

        // 2. Verificar si la cuenta está verificada
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
        res.status(500).json({ mensaje: 'Error en el login', error: error.message });
    }
};

// ==========================================
// 3. OBTENER PERFIL COMPLETO
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
// 4. ACTUALIZAR PERFIL
// ==========================================
const actualizarPerfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombreCompleto, calle, numero, colonia, telefono } = req.body;

        if (nombreCompleto) {
            await User.findByIdAndUpdate(userId, { nombreCompleto });
        }

        await Direccion.findOneAndUpdate(
            { usuarioId: userId },
            { calle, numero, colonia },
            { new: true }
        );

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
// 5. ELIMINAR CUENTA
// ==========================================
const eliminarCuenta = async (req, res) => {
    try {
        const userId = req.user.id;

        await Direccion.findOneAndDelete({ usuarioId: userId });
        await Telefono.findOneAndDelete({ usuarioId: userId });
        await User.findByIdAndDelete(userId);

        res.status(200).json({ mensaje: 'Cuenta eliminada permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar cuenta', error });
    }
};

//=========================================
// 6. SOLICITAR CÓDIGO DE RECUPERACIÓN (AHORA CON RESEND)
//==========================================
const solicitarCodigoRecuperacion = async (req, res) => {
    try {
        const { correo } = req.body;
        const usuario = await User.findOne({ correo });

        if (!usuario) {
            return res.status(200).json({ mensaje: 'Si el correo existe, se enviará un código de recuperación.' });
        }

        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        usuario.codigoRecuperacion = codigo;
        usuario.expiracionCodigo = Date.now() + 15 * 60 * 1000; 
        await usuario.save();

        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            await resend.emails.send({
                // ⚠️ CAMBIAR AQUÍ: Pon el subdominio que te vayan a dar
                from: 'Soporte <soporte@tu-subdominio-oficial.com>', 
                to: usuario.correo,
                subject: 'Código de recuperación de contraseña',
                html: `<h3>Recuperación de cuenta</h3>
                       <p>Tu código de seguridad es: <strong>${codigo}</strong></p>
                       <p>Este código expirará en 15 minutos. Si no solicitaste este cambio, ignora este correo.</p>`
            });
            console.log("Correo de recuperación enviado con Resend a:", usuario.correo);

        } catch (errorCorreo) {
            console.error("Error de Resend en recuperación:", errorCorreo);
        }

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
            expiracionCodigo: { $gt: Date.now() } 
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
// 7.- TRAER TODOS LOS USUARIOS
//==========================================
const obtenerTodosLosUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find().select('-password');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la lista de usuarios', error });
    }
};

const verificarCuenta = async (req, res) => {
    try {
        const { correo, codigo } = req.body;
        const usuario = await User.findOne({ correo, codigoVerificacion: codigo });

        if (!usuario) {
            return res.status(400).json({ mensaje: 'Código incorrecto o usuario no encontrado.' });
        }

        usuario.verificado = true;
        usuario.codigoVerificacion = null;
        await usuario.save();

        res.status(200).json({ mensaje: 'Cuenta verificada con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar cuenta', error });
    }
};

// ==========================================
// LOGIN CON GOOGLE
// ==========================================
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body; 

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        const { name, email, picture } = ticket.getPayload();

        let usuario = await User.findOne({ correo: email });

        if (!usuario) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(Math.random().toString(36), salt); 

            usuario = new User({
                nombreCompleto: name,
                correo: email,
                password: passwordHash,
                verificado: true 
            });

            const usuarioGuardado = await usuario.save();

            await new Direccion({ usuarioId: usuarioGuardado._id, calle: 'Pendiente' }).save();
            await new Telefono({ usuarioId: usuarioGuardado._id, numero: '0000000000' }).save();
        }

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

// ==========================================
// 8. VERIFICAR TELÉFONO (Validado por Firebase SMS)
// ==========================================
const verificarTelefono = async (req, res) => {
    try {
        const userId = req.user.id; 

        const telefonoActualizado = await Telefono.findOneAndUpdate(
            { usuarioId: userId },
            { numeroVerificado: true },
            { new: true } 
        );

        if (!telefonoActualizado) {
            return res.status(404).json({ mensaje: 'No se encontró un teléfono registrado para este usuario.' });
        }

        res.status(200).json({ 
            mensaje: '¡Teléfono verificado con éxito en la base de datos!',
            telefono: telefonoActualizado
        });
    } catch (error) {
        console.error("Error verificando teléfono:", error);
        res.status(500).json({ mensaje: 'Error interno al verificar el teléfono', error: error.message });
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
    googleLogin,
    verificarTelefono
};