import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

/**
 * Función para obtener la IP local de la máquina (IPv4)
 * que no sea la dirección de loopback (127.0.0.1).
 */
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Buscamos una IPv4 que no sea interna (no loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Si falla, volvemos a localhost
}

const localIp = getLocalIp();

// Obtener rutas para el contexto (estamos dentro de Utils/, bajamos al nivel principal -raíz-)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, '..');

console.log('====================================================');
console.log('🛠️ PREPARANDO PARA INICIAR LOS SERVICIOS DE DOCKER 🛠️');
console.log('====================================================\n');
console.log('Ejecutando: "docker-compose up --build"...');
console.log(`Detectada IP Local: ${localIp}`);
console.log('Esto puede tomar unos minutos la primera vez.\n');

// Ejecutamos docker-compose en modo shell para facilitar la interfaz y mantenemos el buffer in/out.
const dockerCmd = spawn('docker-compose', ['up', '--build'], {
    cwd: rootPath,
    stdio: 'inherit',
    shell: true,
    env: { 
        ...process.env, 
        REACT_NATIVE_PACKAGER_HOSTNAME: localIp 
    }
});

dockerCmd.on('error', (error) => {
    console.error(`\n❌ Ha ocurrido un error al intentar ejecutar docker-compose: ${error.message}`);
    console.error('Asegúrate de tener Docker Desktop encendido (o el servicio iniciado).');
});

dockerCmd.on('close', (code) => {
    if (code !== 0) {
        console.log(`\n⚠️  El comando de Docker finalizó con el código de salida: ${code}`);
    } else {
        console.log('\n✅ Contenedores detenidos correctamente.');
    }
});

// Manejo elegante si el usuario aprieta `CTRL+C` en su terminal de Node
process.on('SIGINT', () => {
    console.log('\nDeteniendo procesos, por favor espera...');
    // docker-compose up con un SIGINT desde la terminal original hace la parada gracefully.
});
