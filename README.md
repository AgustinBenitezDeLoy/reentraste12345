# Reentraste - Sistema de Reventa de Entradas

## 🚀 Instalación Rápida

### 1. Requisitos previos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- Git

### 2. Clonar el repositorio
```bash
git clone [tu-repositorio]
cd reentrasteapp/backend
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar la base de datos

#### Opción A: Crear base de datos manualmente
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE reentraste_db;

# Salir
\q

# Ejecutar el script SQL
psql -U postgres -d reentraste_db -f database.sql
```

#### Opción B: Usar los scripts npm
```bash
npm run db:create
npm run db:setup
```

### 5. Configurar variables de entorno
Crear archivo `.env` en la raíz de `/backend`:

```env
# Base de datos
DB_USER=postgres
DB_PASSWORD=tu_password_postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reentraste_db

# JWT Secret (cambiar por una clave segura)
JWT_SECRET=clave_super_secreta_cambiar_esto_123456789

# Puerto
PORT=3002

# Entorno
NODE_ENV=development
```

### 6. Compilar TypeScript
```bash
npm run build
```

### 7. Crear carpeta de uploads
```bash
mkdir -p uploads
```

### 8. Iniciar el servidor
```bash
# Producción
npm start

# Desarrollo (con hot reload)
npm run dev
```

## 📁 Estructura del proyecto

```
backend/
├── dist/               # Código compilado (generado)
├── public/             # Archivos estáticos (HTML, CSS, JS)
│   ├── admin.html      # Panel de administración
│   ├── index.html      # Página principal
│   ├── login.html      # Login
│   ├── register.html   # Registro
│   └── vendedor.html   # Panel del vendedor
├── src/                # Código fuente TypeScript
│   ├── controllers/    # Controladores
│   ├── middlewares/    # Middlewares
│   ├── routes/         # Rutas
│   ├── types/          # Tipos TypeScript
│   └── utils/          # Utilidades
├── uploads/            # Archivos subidos
├── .env                # Variables de entorno
├── database.sql        # Script de base de datos
├── package.json        # Dependencias
└── tsconfig.json       # Configuración TypeScript
```

## 🔑 Credenciales por defecto

**Usuario Admin:**
- Email: `admin@reentraste.com`
- Contraseña: `admin123`

## 📱 Uso de la aplicación

1. **Acceder al sistema**: `http://localhost:3002/login.html`
2. **Registrarse**: `http://localhost:3002/register.html`
3. **Panel admin**: `http://localhost:3002/admin.html` (solo admins)
4. **Panel vendedor**: `http://localhost:3002/vendedor.html`

## 🛠️ Comandos útiles

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Iniciar en producción
npm start

# Verificar tipos
npm run type-check
```

## 🐛 Solución de problemas

### Error: "JWT_SECRET no configurado"
- Verificar que existe el archivo `.env`
- Reiniciar el servidor después de crear `.env`

### Error: "No se puede conectar a la base de datos"
- Verificar que PostgreSQL está corriendo
- Verificar credenciales en `.env`
- Verificar que la base de datos existe

### Error: "Cannot find module"
- Ejecutar `npm install`
- Ejecutar `npm run build`

### Error de permisos en uploads
```bash
chmod 755 uploads
```

## 📊 Estructura de la base de datos

- **users**: Usuarios del sistema
- **events**: Eventos disponibles
- **tickets**: Entradas publicadas para reventa
- **compras**: Registro de compras realizadas

## 🔒 Seguridad

1. **Cambiar JWT_SECRET**: Usar una clave segura en producción
2. **Configurar CORS**: Ajustar según necesidades
3. **HTTPS**: Usar certificado SSL en producción
4. **Validación**: Toda entrada de usuario es validada

## 📝 API Endpoints principales

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/events/todos` - Listar eventos
- `POST /api/tickets/nuevo` - Publicar entrada
- `GET /api/tickets/mias` - Mis entradas
- `POST /api/compras/comprar/:id` - Comprar entrada
- `GET /api/admin/*` - Rutas de administración (requiere admin)

## 💡 Tips

- El sistema maneja automáticamente la conversión de tipos booleanos en PostgreSQL
- Las imágenes de cédulas y QR se guardan en `/uploads`
- Los tokens JWT expiran en 12 horas
- El sistema incluye protección contra usuarios bloqueados