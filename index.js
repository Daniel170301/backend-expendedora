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
    const datosPago = req.body;
    
    const monto = datosPago.monto;
    const producto = datosPago.producto;

    console.log(`💰 ¡Notificación de pago recibida! Monto: S/ ${monto}`);

    // Si el pago es correcto, enviamos la orden
    if (monto === '2.50') {
        const orden = `DESPACHAR:${producto}`;
        
        client.publish(topicMaquina, orden);
        console.log(`🚀 Orden enviada a la máquina: ${orden}`);
        
        res.status(200).send({ status: 'OK', mensaje: 'Orden de despacho enviada' });
    } else {
        console.log('❌ Error: El monto no es el esperado.');
        res.status(400).send({ status: 'ERROR', mensaje: 'Monto inválido' });
    }
});

// --- 3. ENCENDEMOS EL SERVIDOR ---
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`🌐 Servidor Backend encendido y escuchando en el puerto ${PUERTO}`);
});