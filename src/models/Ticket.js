const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del problema es obligatorio'],
        trim: true
    },
    problema: {
        type: String,
        required: [true, 'La descripción del problema es obligatoria']
    },
    prioridad: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        default: 5
    },
    estado: {
        type: Boolean,
        enum: [true, false], 
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    }   
});

module.exports = mongoose.model('Ticket', TicketSchema);