const express = require('express');
const cors = require('cors');

const ticketRoutes = require('./routes/ticketRoutes'); 
const userRoutes = require('./routes/userRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());

app.use('/tickets', ticketRoutes); 
app.use('/usuarios', userRoutes); 

app.get('/', (req, res) => {
    res.json({ mensaje: '¡API funcionando al 100!' });
});

module.exports = app;