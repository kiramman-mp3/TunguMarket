# TunguMarket 🛒

TunguMarket es una plataforma integral de marketplace diseñada específicamente para apoyar a los pequeños y medianos emprendimientos de la región de Tungurahua (Ecuador). Permite a los usuarios descubrir, comprar y vender productos locales de forma segura, fomentando el comercio y la economía de la comunidad.

## 🌟 Características Principales

*   **Multiplataforma:** Experiencia unificada tanto en web (React) como en dispositivos móviles (React Native/Expo).
*   **Gestión de Usuarios:** Registro, inicio de sesión seguro (JWT), verificación de correo electrónico y recuperación de contraseñas.
*   **Roles Dinámicos:** Usuarios generales que pueden actuar como compradores y vendedores simultáneamente, y un panel de administración para gestionar la plataforma.
*   **Catálogo de Productos:** Exploración, búsqueda y filtros por categorías. Visualización detallada con imágenes y stock en tiempo real.
*   **Carrito y Compras:** Flujo de checkout completo, gestión de direcciones de envío y confirmación de pedidos.
*   **Billetera Virtual (Wallet):** Sistema interno de pagos y recargas para agilizar las transacciones sin depender constantemente de pasarelas externas.
*   **Panel de Vendedor:** Gestión integral para comerciantes: publicación de productos, control de inventario, seguimiento de ventas y solicitudes de retiro de fondos hacia cuentas bancarias.
*   **Notificaciones:** Sistema de alertas en tiempo real (vía Server-Sent Events) para actualizaciones de pedidos, mensajes y actividades importantes.

## 🏗️ Arquitectura y Tecnologías

El proyecto está dividido en tres módulos principales y utiliza Docker para orquestar la base de datos y facilitar el despliegue.

### 1. Backend (`/backend`)
API RESTful que maneja la lógica de negocio, autenticación y persistencia de datos.
*   **Node.js & Express.js**
*   **PostgreSQL** (Base de datos relacional).
*   **Autenticación:** JSON Web Tokens (JWT) & bcryptjs.
*   **Otros:** Multer (subida de imágenes), Nodemailer (correos electrónicos), Web-Push.

### 2. Frontend Web (`/frontend`)
Aplicación web moderna y responsiva orientada a usuarios y administradores.
*   **React 19**
*   **Vite** (Bundler ultrarrápido).
*   **Tailwind CSS** (Estilos y utilidades).
*   **Framer Motion** (Animaciones fluidas y transiciones de interfaz).
*   **React Router v7** (Navegación).

### 3. Aplicación Móvil (`/mobile`)
Aplicación para iOS y Android construida con Expo, enfocada en la experiencia de compra en cualquier lugar.
*   **React Native** & **Expo** (Router basado en archivos).
*   **NativeWind** (TailwindCSS para React Native).
*   **React Navigation** (Gestión de pestañas inferiores y navegación nativa).

## 📂 Estructura del Proyecto

```text
TunguMarket/
├── backend/                  # API REST y lógica de servidor
│   ├── src/
│   │   ├── config/           # Configuración de BD y entorno
│   │   ├── controllers/      # Lógica de las rutas
│   │   ├── middlewares/      # Autenticación, validación, uploads
│   │   ├── models/           # Interacción con PostgreSQL
│   │   ├── routes/           # Definición de endpoints
│   │   └── utils/            # Funciones auxiliares y scripts (seeds)
│   └── server.js             # Punto de entrada de la API
├── frontend/                 # Aplicación Web SPA
│   ├── src/
│   │   ├── api/              # Llamadas fetch al backend
│   │   ├── components/       # Componentes UI reutilizables (Modales, Tarjetas)
│   │   ├── context/          # Estados globales (Auth, Cart)
│   │   └── pages/            # Vistas principales (Home, Perfil, Checkout)
│   └── vite.config.js
├── mobile/                   # Aplicación Móvil Híbrida
│   ├── app/                  # Sistema de enrutamiento de Expo Router
│   ├── assets/               # Imágenes, fuentes e íconos estáticos
│   └── src/
│       ├── api/              # Endpoints conectados al backend
│       ├── components/       # Componentes móviles
│       └── constants/        # Tema, colores y configuraciones
└── docker-compose.yml        # Configuración para levantar la base de datos local
```

## 🚀 Requisitos Previos

Asegúrate de tener instalado en tu sistema local:
*   [Node.js](https://nodejs.org/) (v18 o superior)
*   [Docker](https://www.docker.com/) y Docker Compose (para levantar la base de datos PostgreSQL)
*   [Git](https://git-scm.com/)

## ⚙️ Instalación y Configuración

Sigue estos pasos para ejecutar TunguMarket en tu entorno local.

## 🛠️ Herramientas de Desarrollo y Utilidades

TunguMarket viene equipado con una serie de utilidades para facilitar enormemente el entorno de desarrollo local y la población de datos (seeding).

### Gestor de Docker (`/Utils`)
*   **`Iniciar dockers.js`**: Un orquestador CLI interactivo escrito en Node.js exclusivo para facilitar el desarrollo (especialmente en Windows). Te permite con un solo comando limpiar contenedores, reconstruir imágenes, arrancar la BD e iniciar ventanas de logs independientes por colores para Frontend, Backend, Mobile y Base de datos. 

### Utilidades del Backend (`backend/src/utils`)
*   **`init-db.js`**: Script que crea automáticamente todas las tablas relacionales de la base de datos PostgreSQL, tipos ENUM, triggers y extensiones necesarias (`uuid-ossp`).
*   **`seed-users.js` & `seed-productos.js`**: Seeders para popular la base de datos con usuarios y productos falsos, lo que permite empezar a probar la plataforma inmediatamente sin tener que crear registros manualmente.
*   **`create-admin.js`**: Script de línea de comandos para crear la cuenta de Administrador general del marketplace.
*   **`download-seeds.js`**: Descarga imágenes reales para adjuntarlas a los productos de prueba.
*   **`cronJobs.js`**: Tareas programadas en segundo plano que corren en el servidor (por ejemplo, validaciones periódicas).


## 🔒 Seguridad y Privacidad

TunguMarket implementa buenas prácticas de seguridad:
*   Las contraseñas nunca se guardan en texto plano (hashing con Bcrypt).
*   Las transacciones y solicitudes sensibles están protegidas mediante middlewares JWT.
*   Validaciones estrictas tanto del lado del cliente (React/Expo) como en el servidor (Express Validator) para prevenir inyecciones SQL y asegurar la integridad de datos.


