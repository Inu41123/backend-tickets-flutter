# ⚙️ GestiónTech — Backend API

[![Node.js Version](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)

Este es el repositorio del backend para el sistema **GestiónTech** (Sistema Integral de Gestión de Tickets). Proporciona una API RESTful construida con Node.js y Express, encargada de manejar la lógica de negocio, autenticación de usuarios y persistencia de datos.

---

## 🛠️ Stack Tecnológico

| Tecnología | Descripción |
| :--- | :--- |
| **🟢 Entorno** | Node.js |
| **🚀 Framework** | Express.js |
| **🗄️ Base de Datos** | MongoDB (Mongoose) |
| **🔐 Autenticación** | JWT (JSON Web Tokens) y validación de Firebase. |

---

## 📁 Estructura del Proyecto (`src/`)

La arquitectura del proyecto está estructurada de forma modular para garantizar el mantenimiento y la escalabilidad:

* **⚙️ `config/`**: Configuraciones globales (ej. conexión a la base de datos).
* **🎛️ `controllers/`**: Lógica de negocio para cada endpoint (`ticketController.js`, `userController.js`).
* **🛡️ `middlewares/`**: Interceptores de seguridad y validación (`authMiddleware.js`, `rateLimiter.js`).
* **📦 `models/`**: Esquemas de base de datos (`Ticket.js`, `User.js`, `Direccion.js`, `Telefono.js`).
* **🛣️ `routes/`**: Definición de las rutas y endpoints de la API (`ticketRoutes.js`, `userRoutes.js`).

---

## 🚀 Instalación y Ejecución Local

Para ejecutar el servidor de desarrollo en tu máquina local:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto. Asegúrate de incluir las siguientes variables clave:
   * `PORT` (por defecto se espera que sea `3005` para compatibilidad con el frontend).
   * `MONGODB_URI` (Tu cadena de conexión a la base de datos).
   * `JWT_SECRET` (Llave secreta para la generación de tokens).

3. **Ejecutar el servidor:**
   * Modo desarrollo (con recarga automática):
     ```bash
     npm run dev
     ```
   * Modo producción:
     ```bash
     npm start
     ```

---

## 🔒 Seguridad
Se han implementado medidas de seguridad robustas, incluyendo un **Rate Limiter** para mitigar ataques de denegación de servicio (DDoS) o fuerza bruta, así como **Middlewares de Autenticación** para proteger las rutas privadas mediante tokens JWT.
