const mongoose = require('mongoose');

const TelefonoSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    numero: {
        type: String,
        required: [true, 'El número de teléfono es obligatorio'],
        trim: true
    },
    tipo: {
        type: String,
        enum: ['Celular', 'Casa', 'Trabajo'],
        default: 'Celular'
    },
    numeroVerificado: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Telefono', TelefonoSchema);