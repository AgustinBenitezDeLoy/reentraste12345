/**
 * SEED DATA SCRIPT - REENTRASTE
 * ==============================
 * Script para poblar la base de datos con datos iniciales
 * 
 * Archivo: /scripts/seed-data.js
 */

const mongoose = require('mongoose');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// ==========================================================================
// CONEXIÓN A BASE DE DATOS
// ==========================================================================

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reentraste');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// ==========================================================================
// DATOS DE VENUES
// ==========================================================================

const venuesData = [
  {
    nombre: "Antel Arena",
    slug: "antel-arena",
    nombreNormalizado: "antel arena",
    tipo: "arena",
    direccion: "Av. Dr. Américo Ricaldoni 2222",
    ciudad: "Montevideo",
    departamento: "Montevideo",
    pais: "Uruguay",
    coordenadas: {
      latitud: -34.8992847,
      longitud: -56.1315336
    },
    capacidad: {
      total: 14000,
      sectores: [
        { nombre: "Campo", capacidad: 8000, precio_referencia: 2500 },
        { nombre: "Platea", capacidad: 4000, precio_referencia: 3500 },
        { nombre: "VIP", capacidad: 2000, precio_referencia: 5000 }
      ]
    },
    caracteristicas: {
      aire_acondicionado: true,
      estacionamiento: true,
      acceso_discapacitados: true,
      bar: true,
      restaurante: true,
      wifi: true,
      seguridad: true,
      sonido_profesional: true,
      iluminacion_profesional: true
    },
    contacto: {
      telefono: "+598 2480 8080",
      email: "eventos@antelarena.com.uy",
      sitio_web: "https://antelarena.com.uy"
    },
    estado: "activo",
    verificado: true,
    destacado: true,
    keywords: ["antel", "arena", "montevideo", "conciertos", "eventos"]
  },
  
  {
    nombre: "Estadio Centenario",
    slug: "estadio-centenario",
    nombreNormalizado: "estadio centenario",
    tipo: "estadio",
    direccion: "Av. Dr. Ricaldoni s/n",
    ciudad: "Montevideo",
    departamento: "Montevideo",
    pais: "Uruguay",
    coordenadas: {
      latitud: -34.8943,
      longitud: -56.1639
    },
    capacidad: {
      total: 60000,
      sectores: [
        { nombre: "Campo", capacidad: 20000, precio_referencia: 1500 },
        { nombre: "Tribuna", capacidad: 30000, precio_referencia: 2000 },
        { nombre: "Palcos", capacidad: 10000, precio_referencia: 4000 }
      ]
    },
    caracteristicas: {
      estacionamiento: true,
      acceso_discapacitados: true,
      bar: true,
      seguridad: true,
      sonido_profesional: true,
      iluminacion_profesional: true
    },
    contacto: {
      telefono: "+598 2480 1259",
      email: "eventos@estadiocentenario.com.uy"
    },
    estado: "activo",
    verificado: true,
    destacado: true,
    keywords: ["centenario", "estadio", "futbol", "conciertos", "montevideo"]
  },
  
  {
    nombre: "Sala del Museo",
    slug: "sala-del-museo",
    nombreNormalizado: "sala del museo",
    tipo: "teatro",
    direccion: "Av. 18 de Julio 950",
    ciudad: "Montevideo",
    departamento: "Montevideo",
    pais: "Uruguay",
    coordenadas: {
      latitud: -34.9058,
      longitud: -56.1913
    },
    capacidad: {
      total: 2000,
      sectores: [
        { nombre: "Platea", capacidad: 1200, precio_referencia: 1800 },
        { nombre: "Palco", capacidad: 400, precio_referencia: 2500 },
        { nombre: "Paraíso", capacidad: 400, precio_referencia: 1200 }
      ]
    },
    caracteristicas: {
      aire_acondicionado: true,
      acceso_discapacitados: true,
      bar: true,
      wifi: true,
      seguridad: true,
      sonido_profesional: true,
      iluminacion_profesional: true
    },
    contacto: {
      telefono: "+598 2901 3323",
      email: "sala@museonacional.gub.uy"
    },
    estado: "activo",
    verificado: true,
    keywords: ["sala", "museo", "teatro", "espectaculos", "montevideo"]
  },
  
  {
    nombre: "Complejo Sacude",
    slug: "complejo-sacude",
    nombreNormalizado: "complejo sacude",
    tipo: "club",
    direccion: "Rambla Armenia y Paysandú",
    ciudad: "Montevideo",
    departamento: "Montevideo",
    pais: "Uruguay",
    coordenadas: {
      latitud: -34.9178,
      longitud: -56.1619
    },
    capacidad: {
      total: 3000,
      sectores: [
        { nombre: "Pista", capacidad: 2000, precio_referencia: 2200 },
        { nombre: "VIP", capacidad: 500, precio_referencia: 3500 },
        { nombre: "Terraza", capacidad: 500, precio_referencia: 2800 }
      ]
    },
    caracteristicas: {
      aire_acondicionado: true,
      estacionamiento: true,
      bar: true,
      wifi: true,
      seguridad: true,
      sonido_profesional: true,
      iluminacion_profesional: true
    },
    contacto: {
      telefono: "+598 2711 6976",
      email: "info@sacude.com",
      sitio_web: "https://sacude.com"
    },
    estado: "activo",
    verificado: true,
    keywords: ["sacude", "electronica", "fiesta", "discoteca", "montevideo"]
  },
  
  {
    nombre: "Auditorio del Sodre",
    slug: "auditorio-sodre",
    nombreNormalizado: "auditorio del sodre",
    tipo: "teatro",
    direccion: "Av. 18 de Julio 930",
    ciudad: "Montevideo",
    departamento: "Montevideo",
    pais: "Uruguay",
    coordenadas: {
      latitud: -34.9052,
      longitud: -56.1911
    },
    capacidad: {
      total: 2000,
      sectores: [
        { nombre: "Platea", capacidad: 1100, precio_referencia: 2000 },
        { nombre: "1er Piso", capacidad: 500, precio_referencia: 1800 },
        { nombre: "2do Piso", capacidad: 400, precio_referencia: 1500 }
      ]
    },
    caracteristicas: {
      aire_acondicionado: true,
      acceso_discapacitados: true,
      bar: true,
      wifi: true,
      sonido_profesional: true,
      iluminacion_profesional: true
    },
    estado: "activo",
    verificado: true,
    keywords: ["sodre", "auditorio", "clasica", "opera", "montevideo"]
  }
];

// ==========================================================================
// DATOS DE EVENTOS
// ==========================================================================

const eventsData = [
  {
    nombre: "Creamfields Uruguay 2025",
    slug: "creamfields-uruguay-2025",
    nombreNormalizado: "creamfields uruguay 2025",
    descripcion: "El festival de música electrónica más grande de Uruguay regresa con los mejores DJs del mundo.",
    fecha: new Date('2025-12-31T22:00:00Z'),
    fechaFin: new Date('2026-01-01T06:00:00Z'),
    ubicacion: {
      venue: "Antel Arena",
      direccion: "Av. Dr. Américo Ricaldoni 2222",
      ciudad: "Montevideo",
      pais: "Uruguay"
    },
    categoria: "festival",
    generos: ["electronic", "house", "techno", "trance"],
    tags: ["outdoor", "internacional", "year-end", "electronic"],
    keywords: ["creamfields", "electronic", "festival", "djs", "dance"],
    aliases: ["creamfields uy", "creamfields mvd"],
    capacidad: 14000,
    edadMinima: 18,
    estado: "activo",
    verificado: true,
    destacado: true,
    popularidad: 95,
    totalEntradas: 125,
    precioMin: 3500,
    precioMax: 8500,
    imagen: "/uploads/events/creamfields2025.jpg"
  },
  
  {
    nombre: "Peñarol vs Nacional - Clásico",
    slug: "peñarol-vs-nacional-clasico",
    nombreNormalizado: "peñarol vs nacional clasico",
    descripcion: "El clásico del fútbol uruguayo en el Estadio Centenario.",
    fecha: new Date('2025-08-15T15:00:00Z'),
    ubicacion: {
      venue: "Estadio Centenario",
      direccion: "Av. Dr. Ricaldoni s/n",
      ciudad: "Montevideo",
      pais: "Uruguay"
    },
    categoria: "deportes",
    tags: ["futbol", "clasico", "uruguay"],
    keywords: ["peñarol", "nacional", "futbol", "clasico", "derby"],
    aliases: ["clasico uruguayo", "derby montevideo"],
    capacidad: 60000,
    estado: "activo",
    verificado: true,
    destacado: true,
    popularidad: 90,
    totalEntradas: 89,
    precioMin: 1200,
    precioMax: 4500,
    imagen: "/uploads/events/clasico-futbol.jpg"
  },
  
  {
    nombre: "Coldplay - World Tour 2025",
    slug: "coldplay-world-tour-2025",
    nombreNormalizado: "coldplay world tour 2025",
    descripcion: "Coldplay llega a Uruguay con su espectacular World Tour.",
    fecha: new Date('2025-10-20T21:00:00Z'),
    ubicacion: {
      venue: "Estadio Centenario",
      direccion: "Av. Dr. Ricaldoni s/n",
      ciudad: "Montevideo",
      pais: "Uruguay"
    },
    categoria: "concierto",
    generos: ["rock", "pop", "alternative"],
    tags: ["internacional", "rock", "pop"],
    keywords: ["coldplay", "concierto", "rock", "internacional"],
    capacidad: 60000,
    estado: "activo",
    verificado: true,
    destacado: true,
    popularidad: 98,
    totalEntradas: 67,
    precioMin: 2800,
    precioMax: 12000,
    imagen: "/uploads/events/coldplay2025.jpg"
  },
  
  {
    nombre: "Tango Show - Carlos Gardel Tribute",
    slug: "tango-show-gardel-tribute",
    nombreNormalizado: "tango show carlos gardel tribute",
    descripcion: "Espectáculo de tango en homenaje a Carlos Gardel.",
    fecha: new Date('2025-07-25T21:00:00Z'),
    ubicacion: {
      venue: "Sala del Museo",
      direccion: "Av. 18 de Julio 950",
      ciudad: "Montevideo",
      pais: "Uruguay"
    },
    categoria: "teatro",
    generos: ["tango", "folclore"],
    tags: ["tango", "cultural", "tribute"],
    keywords: ["tango", "gardel", "show", "cultural"],
    capacidad: 2000,
    estado: "activo",
    verificado: true,
    popularidad: 75,
    totalEntradas: 23,
    precioMin: 1500,
    precioMax: 3500,
    imagen: "/uploads/events/tango-show.jpg"
  },
  
  {
    nombre: "Fiesta Electrónica - Summer Vibes",
    slug: "fiesta-electronica-summer-vibes",
    nombreNormalizado: "fiesta electronica summer vibes",
    descripcion: "La mejor música electrónica para despedir el verano.",
    fecha: new Date('2025-09-15T23:00:00Z'),
    fechaFin: new Date('2025-09-16T05:00:00Z'),
    ubicacion: {
      venue: "Complejo Sacude",
      direccion: "Rambla Armenia y Paysandú",
      ciudad: "Montevideo",
      pais: "Uruguay"
    },
    categoria: "fiesta",
    generos: ["house", "techno", "progressive"],
    tags: ["electronica", "noche", "summer"],
    keywords: ["electronica", "fiesta", "house", "techno"],
    capacidad: 3000,
    edadMinima: 18,
    estado: "activo",
    verificado: false,
    popularidad: 68,
    totalEntradas: 45,
    precioMin: 1800,
    precioMax: 3200,
    imagen: "/uploads/events/summer-vibes.jpg"
  }
];

// ==========================================================================
// DATOS DE USUARIOS ADMIN
// ==========================================================================

const adminUsersData = [
  {
    nombre: "Admin Principal",
    email: "admin@reentraste.com",
    password: "admin123", // Se hasheará
    phone: "+598 99 123 456",
    isAdmin: true,
    verificado: true,
    emailVerified: true,
    provider: "local"
  },
  {
    nombre: "Moderador",
    email: "moderador@reentraste.com", 
    password: "mod123",
    phone: "+598 99 654 321",
    isModerador: true,
    verificado: true,
    emailVerified: true,
    provider: "local"
  }
];

// ==========================================================================
// FUNCIONES DE SEEDING
// ==========================================================================

/**
 * Crear venues iniciales
 */
async function seedVenues() {
  try {
    console.log('🏟️ Seeding venues...');
    
    // Limpiar venues existentes
    await Venue.deleteMany({});
    
    for (const venueData of venuesData) {
      // Agregar datos calculados
      venueData.creadoPor = new mongoose.Types.ObjectId();
      venueData.ubicacionGeo = {
        type: 'Point',
        coordinates: [venueData.coordenadas.longitud, venueData.coordenadas.latitud]
      };
      
      const venue = new Venue(venueData);
      await venue.save();
      
      console.log(`✅ Venue creado: ${venue.nombre}`);
    }
    
    console.log(`✅ ${venuesData.length} venues creados`);
    
  } catch (error) {
    console.error('❌ Error seeding venues:', error);
    throw error;
  }
}

/**
 * Crear eventos iniciales
 */
async function seedEvents() {
  try {
    console.log('🎪 Seeding events...');
    
    // Obtener venues para referenciar
    const venues = await Venue.find({});
    const venueMap = {};
    venues.forEach(venue => {
      venueMap[venue.nombre] = venue._id;
    });
    
    // Limpiar eventos existentes
    await Event.deleteMany({});
    
    for (const eventData of eventsData) {
      // Agregar datos calculados
      eventData.creadoPor = new mongoose.Types.ObjectId();
      eventData.venueId = venueMap[eventData.ubicacion.venue];
      
      // Coordenadas del venue
      const venue = venues.find(v => v.nombre === eventData.ubicacion.venue);
      if (venue) {
        eventData.ubicacion.coordenadas = [
          venue.coordenadas.longitud,
          venue.coordenadas.latitud
        ];
      }
      
      const event = new Event(eventData);
      await event.save();
      
      console.log(`✅ Evento creado: ${event.nombre}`);
    }
    
    console.log(`✅ ${eventsData.length} eventos creados`);
    
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    throw error;
  }
}

/**
 * Crear usuarios admin
 */
async function seedAdminUsers() {
  try {
    console.log('👤 Seeding admin users...');
    
    for (const userData of adminUsersData) {
      // Verificar si ya existe
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ Usuario ya existe: ${userData.email}`);
        continue;
      }
      
      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;
      
      const user = new User(userData);
      await user.save();
      
      console.log(`✅ Usuario admin creado: ${user.email}`);
    }
    
    console.log('✅ Usuarios admin creados');
    
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
    throw error;
  }
}

/**
 * Crear índices de base de datos
 */
async function createIndexes() {
  try {
    console.log('📊 Creando índices...');
    
    // Índices para eventos
    await Event.collection.createIndex({ 
      nombre: "text", 
      descripcion: "text",
      keywords: "text" 
    });
    
    await Event.collection.createIndex({ estado: 1, fecha: 1 });
    await Event.collection.createIndex({ categoria: 1, fecha: 1 });
    await Event.collection.createIndex({ popularidad: -1 });
    
    // Índices para venues
    await Venue.collection.createIndex({ 
      nombre: "text", 
      descripcion: "text" 
    });
    
    await Venue.collection.createIndex({ "ubicacionGeo": "2dsphere" });
    await Venue.collection.createIndex({ ciudad: 1, tipo: 1 });
    
    console.log('✅ Índices creados');
    
  } catch (error) {
    console.error('❌ Error creando índices:', error);
    throw error;
  }
}

// ==========================================================================
// FUNCIÓN PRINCIPAL
// ==========================================================================

/**
 * Ejecuta todo el proceso de seeding
 */
async function runSeed(options = {}) {
  try {
    console.log('🌱 Iniciando seed de datos...');
    
    await connectDB();
    
    if (options.venues !== false) {
      await seedVenues();
    }
    
    if (options.events !== false) {
      await seedEvents();
    }
    
    if (options.users !== false) {
      await seedAdminUsers();
    }
    
    if (options.indexes !== false) {
      await createIndexes();
    }
    
    console.log('✅ Seed completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

/**
 * Limpiar toda la base de datos
 */
async function cleanDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    await connectDB();
    
    await Event.deleteMany({});
    await Venue.deleteMany({});
    // No borrar usuarios a menos que se especifique
    
    console.log('✅ Base de datos limpiada');
    
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// ==========================================================================
// CLI INTERFACE
// ==========================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'clean':
      cleanDatabase();
      break;
    
    case 'venues':
      runSeed({ events: false, users: false, indexes: false });
      break;
    
    case 'events':
      runSeed({ venues: false, users: false, indexes: false });
      break;
    
    case 'users':
      runSeed({ venues: false, events: false, indexes: false });
      break;
    
    case 'indexes':
      runSeed({ venues: false, events: false, users: false });
      break;
    
    default:
      runSeed();
      break;
  }
}

// ==========================================================================
// EXPORTACIONES
// ==========================================================================

module.exports = {
  runSeed,
  cleanDatabase,
  seedVenues,
  seedEvents,
  seedAdminUsers,
  createIndexes,
  venuesData,
  eventsData,
  adminUsersData
};