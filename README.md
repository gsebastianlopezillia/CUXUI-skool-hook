# CUXUI Media Host

Sistema simple para subir archivos multimedia y obtener URLs permanentes. Landing redirige a Skool; panel admin con login Firebase para subir y copiar links.

## Funcionalidad

- **Landing**: comunidad UXUI, link a Skool; acceso al panel por icono en esquina inferior izquierda.
- **Panel admin**: login (Firebase Auth), subir archivos (máx. 5 MB), listar y copiar link. Archivos en Firebase Storage; metadatos en Firestore.

## Cómo usar

1. Abrí la raíz del sitio (local: `http://localhost:8000/` o la URL de GitHub Pages).
2. Para el panel: icono de engranaje abajo a la izquierda → inicia sesión con tu cuenta Firebase.
3. Subí archivos arrastrando o eligiendo; copiá el link de cada uno.

## Desarrollo local

```bash
npm install   # si hace falta
python -m http.server 8000
```

Abrir `http://localhost:8000/`.

## Configuración

- **Firebase**: `firebase-config.js` (en el repo para GitHub Pages). Usuarios en Firebase Console → Authentication.
- **Reglas**: Firestore y Storage deben estar en modo producción (ver abajo).

## Estructura del proyecto

```
├── index.html
├── admin.html
├── firebase-config.js
├── firebase-config.example.js
├── assets/           # logo, favicon
├── css/admin.css
├── js/
│   ├── auth-simple.js
│   └── admin-simple.js
├── .github/workflows/
└── README.md
```

---

## Producción: reglas Firebase y GitHub Pages

La config de Firebase en el repo es pública; la seguridad depende de las **reglas** en Firebase Console.

### Reglas de Firestore

1. Firebase Console → proyecto → **Firestore Database** → pestaña **Rules**.
2. Reemplazá todo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /files/{fileId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

3. **Publicar**.

### Reglas de Storage

1. Firebase Console → **Storage** → pestaña **Rules**.
2. Reemplazá todo por:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **Publicar**.

### Dominios autorizados

Firebase Console → **Authentication** → **Settings** → **Authorized domains**: que estén `localhost` y tu dominio de Pages (ej. `gseba.github.io`).

### GitHub Pages

1. Repo → **Settings** → **Pages** → Source: **Deploy from a branch** → rama `main`, carpeta **/ (root)** → Save.
2. El sitio queda en `https://<usuario>.github.io/<repo>/`.

### Checklist producción

- [ ] Firestore Rules publicadas (create + read/update/delete por `ownerId`).
- [ ] Storage Rules publicadas (`users/{userId}/...`, `request.auth.uid == userId`).
- [ ] Authorized domains con localhost y dominio de Pages.
- [ ] GitHub Pages activado; probar login, subida y link en la URL pública.
