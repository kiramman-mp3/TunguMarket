import { spawn, execSync, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import readline from 'readline';

/**
 * GESTOR DE DOCKER PARA TUNGUMARKET
 * Esta clase centraliza la orquestación de servicios en Windows.
 */
class DockerManager {
    constructor() {
        this.localIp = this.getIp();
        const __filename = fileURLToPath(import.meta.url);
        this.rootPath = path.join(path.dirname(__filename), '..');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Obtiene la IP local (IPv4)
     */
    getIp() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }

    /**
     * Helper para preguntar al usuario
     */
    async ask(query) {
        return new Promise((resolve) => this.rl.question(query, resolve));
    }

    /**
     * Muestra el encabezado estilizado
     */
    showBrand() {
        console.clear();
        console.log('\x1b[36m%s\x1b[0m', '====================================================');
        console.log('\x1b[33m%s\x1b[0m', '🛠️   TUNGUMARKET SERVICE ORCHESTRATOR (DOCKER)  🛠️');
        console.log('\x1b[36m%s\x1b[0m', '====================================================\n');
    }

    /**
     * Limpia contenedores y volúmenes
     */
    async cleanup() {
        console.log('\x1b[31m%s\x1b[0m', '\n🗑️  Limpiando el entorno anterior (contenedores/volúmenes)...');
        execSync('docker-compose down -v', { cwd: this.rootPath, stdio: 'inherit' });
    }

    /**
     * Inicia los servicios con docker-compose
     */
    async launch(rebuild = false) {
        const flag = rebuild ? '--build' : '';
        console.log('\x1b[32m%s\x1b[0m', `\n🚀 Iniciando servicios ${rebuild ? '(reconstruyendo imágenes)' : ''}...`);
        
        // Ejecutamos docker-compose UP de forma sincrónica para ver los logs de BUILD/START en la terminal principal
        try {
            execSync(`docker-compose up -d ${flag}`, {
                cwd: this.rootPath,
                stdio: 'inherit',
                env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: this.localIp }
            });
            console.log('\x1b[32m%s\x1b[0m', '✅ Servicios en ejecución (modo background).');
        } catch (error) {
            throw new Error('No se pudo iniciar docker-compose.');
        }
    }

    /**
     * Ejecuta el script de inicialización de la base de datos
     */
    async initDB() {
        console.log('\x1b[34m%s\x1b[0m', '\n⏳ Esperando 8 segundos a que la DB esté lista...');
        await new Promise(r => setTimeout(r, 8000));

        console.log('\x1b[34m%s\x1b[0m', '📊 Ejecutando inicialización de tablas (init-db.js)...');
        try {
            const initDbPath = path.join(this.rootPath, 'backend', 'src', 'utils', 'init-db.js');
            execSync(`node "${initDbPath}"`, { 
                stdio: 'inherit', 
                env: { ...process.env, POSTGRES_HOST: 'localhost' } 
            });
            console.log('\x1b[32m%s\x1b[0m', '✅ Base de datos inicializada.');
        } catch (err) {
            console.error('\x1b[31m%s\x1b[0m', '❌ Error al cargar tablas:', err.message);
        }
    }

    /**
     * Lanza las ventanas de logs independientes (Específico para Windows)
     */
    openLogWindows() {
        console.log('\x1b[35m%s\x1b[0m', '\n🖥️  Abriendo paneles de monitoreo independientes...');
        
        const services = [
            { name: 'backend', title: '🟡 BACKEND LOGS', color: '6' },
            { name: 'frontend', title: '🔵 FRONTEND LOGS', color: '3' },
            { name: 'mobile', title: '📱 MOBILE/METRO LOGS', color: '2' },
            { name: 'db', title: '🐘 DATABASE LOGS', color: '5' }
        ];

        services.forEach(service => {
            // cmd /k "color [attr] && command" permite dar color a la terminal
            const cmdColor = `color ${service.color}`;
            const logCommand = `docker-compose logs -f ${service.name}`;
            const fullCommand = `start "${service.title}" cmd /k "${cmdColor} && ${logCommand}"`;
            
            exec(fullCommand, { cwd: this.rootPath });
        });

        console.log('\x1b[35m%s\x1b[0m', '✅ Paneles abiertos. El desarrollo puede continuar.');
    }

    /**
     * Punto de entrada principal
     */
    async start() {
        this.showBrand();
        console.log(`Detectada IP Local: \x1b[1m${this.localIp}\x1b[0m\n`);

        console.log('¿Qué deseas hacer?');
        console.log('1. 🚀 Reinicio TOTAL (Limpiar todo, rebuild e iniciar)');
        console.log('2. ⚡ Inicio RÁPIDO (Solo iniciar existentes)');
        console.log('3. ❌ Salir');

        const option = await this.ask('\nSelecciona una opción (1-3): ');

        if (option === '3' || !['1', '2'].includes(option)) {
            console.log('Saliendo...');
            this.rl.close();
            return;
        }

        try {
            if (option === '1') {
                const loadTables = await this.ask('\n📊 ¿Deseas cargar las tablas iniciales? (1=Sí, 2=No): ');
                
                await this.cleanup();
                await this.launch(true);
                
                if (loadTables === '1') {
                    await this.initDB();
                }
            } else {
                await this.launch(false);
            }

            this.openLogWindows();

        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', `\nFATAL ERROR: ${error.message}`);
        }

        console.log('\n\x1b[33m%s\x1b[0m', '--- Gestor en reposo. Presiona CTRL+C para detener este proceso ---');
        this.rl.close();
    }
}

// Inicialización
const manager = new DockerManager();
manager.start();

// Manejo de salida elegante
process.on('SIGINT', () => {
    console.log('\n\x1b[31m%s\x1b[0m', 'Deteniendo gestor principal...');
    process.exit(0);
});
