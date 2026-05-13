const Ticket = require('../models/Ticket');

// POST: Crear un nuevo ticket
const crearTicket = async (req, res) => {
    try {
        const datosTicket = {
            ...req.body,
            usuario: req.user.id 
        };
        const nuevoTicket = new Ticket(datosTicket);
        await nuevoTicket.save();
        res.status(201).json(nuevoTicket);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear el ticket', error });
    }
};

// GET: Obtener tickets (Separados por rol)
const obtenerTickets = async (req, res) => {
    try {
        let tickets;
        
        if (req.user.rol === 'admin') {
            tickets = await Ticket.find().populate('usuario', 'nombreCompleto correo');
        } else {
            tickets = await Ticket.find({ usuario: req.user.id });
        }
        
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los tickets', error });
    }
};

// PUT: Actualizar el estado de un ticket
const actualizarEstado = async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403)

    try {
        const { id } = req.params;
        const { estado } = req.body;

        const ticketActualizado = await Ticket.findByIdAndUpdate(
            id,
            { estado },
            { new: true } 
        );

        if (!ticketActualizado) {
            return res.status(404).json({ mensaje: 'Ticket no encontrado' });
        }

        res.status(200).json(ticketActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el ticket', error });
    }
};



// PUT: Editar todo el ticket (nombre, problema, prioridad, etc.)
const actualizarTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticketActualizado = await Ticket.findByIdAndUpdate(
            id,
            req.body, 
            { new: true, runValidators: true }
        );

        if (!ticketActualizado) {
            return res.status(404).json({ mensaje: 'Ticket no encontrado' });
        }

        res.status(200).json(ticketActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar el ticket', error });
    }
};

// DELETE: Eliminar un ticket
const eliminarTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticketEliminado = await Ticket.findByIdAndDelete(id);

        if (!ticketEliminado) {
            return res.status(404).json({ mensaje: 'Ticket no encontrado' });
        }

        res.status(200).json({ mensaje: 'Ticket eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el ticket', error });
    }
};

module.exports = { 
    crearTicket, 
    obtenerTickets, 
    actualizarEstado, 
    actualizarTicket, 
    eliminarTicket 
};