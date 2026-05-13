const mongoose = require('mongoose');

const DireccionSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Asegura la relación 1:1 (un usuario, una dirección)
    },
    calle: { type: String, required: true },
    numero: { type: String },
    colonia: { type: String },
    ciudad: { type: String },
    estado: { type: String },
    codigoPostal: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Direccion', DireccionSchema);