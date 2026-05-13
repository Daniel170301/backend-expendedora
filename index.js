const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');

const app = express();
app.use(bodyParser.json());

// --- 1. CONFIGURACIÓN DEL MENSAJERO MQTT ---
const brokerUrl = 'mqtt://broker.hivemq.com'; 
const topicMaquina = 'jaimez/expendedora/comandos';

console.log('Conectando al Broker MQTT...');
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('✅ Conectado a HiveMQ con éxito');
});

// --- 2. EL WEBHOOK (Donde MacroDroid enviará el aviso) ---
app.post('/api/pago-recibido', (req, res) => {
    const datos = req.body;
    
    // Extraemos el texto completo que envía MacroDroid
    const textoNotificacion = datos.texto_notificacion || ""; 
    console.log(`📩 Notificación entrante: ${textoNotificacion}`);

    // Buscamos dinámicamente "S/ " seguido del número (Ej: "S/ 4.50" -> "4.50")
    const extraccion = textoNotificacion.match(/S\/\s*(\d+\.\d{2})/);

    if (extraccion) {
        // ¡Magia! Extraemos solo el número, sin importar qué producto sea
        const montoPagado = extraccion[1]; 
        console.log(`💰 ¡Monto detectado automáticamente!: S/ ${montoPagado}`);
        
        // Enviamos SOLO EL MONTO a la máquina. Ejemplo: "PAGO:4.50"
        const orden = `PAGO:${montoPagado}`;
        client.publish(topicMaquina, orden);
        console.log(`🚀 Orden enviada a la máquina: ${orden}`);
        
        res.status(200).send({ status: 'OK', mensaje: 'Monto extraído y enviado al ESP32' });
        
    } else {
        // En caso de que estés haciendo pruebas manuales enviando solo el número
        if (datos.monto && !isNaN(parseFloat(datos.monto))) {
            const orden = `PAGO:${datos.monto}`;
            client.publish(topicMaquina, orden);
            console.log(`🚀 Orden enviada (modo prueba manual): ${orden}`);
            return res.status(200).send({ status: 'OK', mensaje: 'Monto manual enviado' });
        }

        console.log('❌ Error: No se encontró un formato de dinero válido (S/ X.XX) en el mensaje.');
        res.status(400).send({ status: 'ERROR', mensaje: 'No se detectó el precio' });
    }
});
// --- 3. ENCENDEMOS EL SERVIDOR ---
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`🌐 Servidor Backend encendido y escuchando en el puerto ${PUERTO}`);
});
