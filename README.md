# 🏥 MedControl - Control de Notas Médicas

Sistema PWA para el registro y control de notas de evolución médica. Funciona como aplicación web instalable con sincronización en tiempo real via Firebase.

## ✨ Características

- 📱 **PWA** - Instalable en cualquier dispositivo (móvil, tablet, desktop)
- 🔄 **Tiempo real** - Sincronización instantánea con Firebase Firestore
- 👤 **Auth anónimo** - Sin registro, cada dispositivo tiene un UID único
- 📋 **Expedientes** - Registro de pacientes con nombre, edad, diagnóstico y cama
- 📝 **Notas de evolución** - Hallazgos quirúrgicos, signos vitales, plan e indicaciones
- 📄 **Exportar PDF** - Genera expedientes en formato PDF profesional
- 📶 **Offline** - Funciona sin conexión gracias al Service Worker

## 🚀 Setup Rápido

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un proyecto nuevo
3. Habilita **Authentication** → Sign-in method → **Anonymous**
4. Habilita **Cloud Firestore** (modo test para desarrollo)
5. Copia tu `firebaseConfig` desde Configuración del proyecto → General

### 2. Configurar credenciales

Edita `js/firebase-config.js` y reemplaza los valores placeholder:

```javascript
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-project-id",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 3. Desplegar

#### Opción A: GitHub Pages
1. Sube el código a GitHub
2. Settings → Pages → Source: `main` branch → `/root`
3. Tu app estará en `https://tuusuario.github.io/medControl/`

#### Opción B: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### Opción C: Servidor local (desarrollo)
```bash
# Cualquier servidor estático sirve:
npx serve .
# o
python -m http.server 8080
```

## 📁 Estructura del Proyecto

```
control de notas/
├── index.html              # Página principal
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker (cache offline)
├── css/
│   └── styles.css          # Estilos personalizados
├── js/
│   ├── app.js              # Punto de entrada principal
│   ├── firebase-config.js  # Configuración de Firebase
│   ├── ui.js               # Módulo de interfaz (drawer, modales, toasts)
│   ├── patients.js         # CRUD de pacientes
│   ├── records.js          # CRUD de notas de evolución
│   └── pdf-export.js       # Generación de PDF
├── icons/                  # Iconos PWA
└── README.md
```

## 🔥 Estructura Firestore

```
artifacts/{appId}/users/{uid}/
├── patients/
│   ├── {patientId}/
│   │   ├── name: string
│   │   ├── age: string
│   │   ├── dx: string
│   │   ├── cama: string
│   │   ├── createdAt: timestamp
│   │   └── records/
│   │       └── {recordId}/
│   │           ├── hallazgos: string
│   │           ├── antecedentes: string
│   │           ├── signos: { fc, ta, fr, temp, spo2 }
│   │           ├── indicaciones: string
│   │           ├── plan: string
│   │           ├── pendientes: string
│   │           └── createdAt: timestamp
```

## 📱 Instalar como App

1. Abre la app en Chrome (Android) o Safari (iOS)
2. Android: Toca el banner "Instalar MedControl" o menú → "Instalar app"
3. iOS: Compartir → "Agregar a pantalla de inicio"

## 🛡️ Reglas de Firestore (Producción)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📄 Licencia

MIT
