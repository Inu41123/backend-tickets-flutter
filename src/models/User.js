const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    correo: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    rol: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    },
    codigoRecuperacion: {
        type: String,
        default: null
    },
    expiracionCodigo: {
        type: Date,
        default: null
    },
    // ... debajo del rol o de los campos de recuperación
    verificado: {
        type: Boolean,
        default: false
    },
    codigoVerificacion: {
        type: String,
        default: null
    }
}, { 
    timestamps: true // Esto crea automáticamente createdAt y updatedAt
});

module.exports = mongoose.model('User', UserSchema);