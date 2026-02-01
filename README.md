# CUXUI Media Host

Landing con link a Skool; panel admin (login Supabase) para subir archivos, listar y copiar link. Archivos en Supabase Storage; metadatos en Postgres.

## Uso

1. Servir la raíz (local: `python -m http.server 8000` o GitHub Pages).
2. Admin: icono engranaje → login con usuario Supabase → subir, copiar link, eliminar.

## Configuración

- **supabase-config.js**: copiar desde `supabase-config.example.js`. Completar SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET (Dashboard → Settings → API; Storage → bucket).
- **Supabase**: ejecutar [supabase/setup.sql](supabase/setup.sql) en SQL Editor (tabla `files`, RLS, políticas Storage, función `soft_delete_file`). Bucket público.
- **Auth**: Authentication → Providers → Email → **Enable email signups** OFF. Usuarios solo desde Dashboard → Users → Add user.

## Purga (opcional)

Borrado en el admin es lógico (`deleted_at`). Para borrar definitivamente lo marcado hace más de 5 días: desplegar Edge Function `cleanup-deleted` y programar cron diario; ver [supabase/cron-cleanup-deleted.sql](supabase/cron-cleanup-deleted.sql).

## Checklist

- [ ] supabase-config.js con URL, anon key, bucket.
- [ ] setup.sql ejecutado; bucket creado y público.
- [ ] Email signups OFF; usuarios creados en Dashboard.
- [ ] Probar login, subida y link.
