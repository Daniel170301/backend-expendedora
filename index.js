const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');

const app = express();

// --- NUEVO: Le decimos a Express que acepte TODO como Texto Plano ---
app.use(bodyParser.text({ type: '*/*' })); 

// --- 1. CONFIGURACIÓN DEL MENSAJERO MQTT ---
const brokerUrl = 'mqtt://broker.hivemq.com'; 
const topicMaquina = 'jaimez/expendedora/comandos';

console.log('Conectando al Broker MQTT...');
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('✅ Conectado a HiveMQ con éxito');
});

// --- 2. EL WEBHOOK ---
app.post('/api/pago-recibido', (req, res) => {
    
    // Como usamos bodyParser.text, req.body ahora es directamente el texto de MacroDroid
    const textoNotificacion = req.body || "";
    console.log(`📩 Notificación entrante:\n${textoNotificacion}`);

    // Buscamos dinámicamente "S/ " seguido del número (Ej: "S/ 2.50")
    const extraccion = textoNotificacion.match(/S\/\s*(\d+\.\d{2})/);

    if (extraccion) {
        const montoPagado = extraccion[1]; 
        console.log(`💰 ¡Monto detectado automáticamente!: S/ ${montoPagado}`);
        
        const orden = `PAGO:${montoPagado}`;
        client.publish(topicMaquina, orden);
        console.log(`🚀 Orden enviada a la máquina: ${orden}`);
        
        res.status(200).send('Monto procesado correctamente');
    } else {
        console.log('❌ Error: No se encontró un formato de dinero válido (S/ X.XX).');
        res.status(400).send('No se detectó el precio');
    }
});

// --- 3. ENCENDEMOS EL SERVIDOR ---
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`🌐 Servidor Backend encendido en el puerto ${PUERTO}`);
});
