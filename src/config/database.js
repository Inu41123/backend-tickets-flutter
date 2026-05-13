const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB conectado con éxito');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        process.exit(1); 
    }
};

module.exports = connectDB;