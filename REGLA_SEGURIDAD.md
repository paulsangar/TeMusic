# Regla de Seguridad — TeMusic (Para agregar a AGENTS.md o como regla independiente)

---

## ⛔ REGLA CRÍTICA DE SEGURIDAD

> Esta regla aplica a TODOS los agentes, en TODAS las tareas, SIEMPRE.
> Leerla y aplicarla antes de cualquier acción, commit, deploy o compartición de archivos.

---

## Qué NUNCA debe aparecer en código fuente, commits o deployments

| Categoría | Ejemplos de datos sensibles |
|-----------|----------------------------|
| Spotify | `client_secret`, `access_token`, `refresh_token` |
| Supabase | `service_role_key`, `anon_key`, `JWT secret` |
| Sesión | `SESSION_SECRET`, cualquier secreto de firma JWT |
| Usuario | emails reales, IDs de usuario en strings literales |
| Variables de entorno | valores reales (solo placeholders como `your-secret-here`) |
| Logs | tokens completos, contraseñas, claves |

---

## Verificación obligatoria antes de cualquier commit o deploy

```bash
# 1. Verificar que .env.local está en .gitignore
grep -r "\.env\.local" .gitignore

# 2. Buscar posibles datos sensibles hardcodeados
grep -r "client_secret" src/ --include="*.ts" --include="*.tsx"
grep -r "service_role_key" src/ --include="*.ts" --include="*.tsx"
grep -r "SESSION_SECRET" src/ --include="*.ts" --include="*.tsx"

# 3. Verificar que no hay tokens en logs
grep -r "console.log.*token" src/ --include="*.ts"
grep -r "console.log.*secret" src/ --include="*.ts"
```

---

## Patrón seguro para logs de tokens

```typescript
// MAL — expone el token completo
console.error('Token:', accessToken);

// BIEN — muestra solo los primeros 8 caracteres
console.error('Token (truncated):', accessToken?.slice(0, 8) + '...');
```

---

## Variables de entorno: uso correcto

```typescript
// MAL — valor hardcodeado
const secret = 'mi-super-secreto-real-123';

// BIEN — desde variables de entorno
const secret = process.env.SESSION_SECRET;
if (!secret) throw new Error('SESSION_SECRET is not set');
```

---

## Supabase: dónde puede usarse cada clave

| Clave | Uso permitido | Uso prohibido |
|-------|---------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend y backend | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend (con RLS activo) | Sin RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo API Routes (server-side) | Nunca en cliente |

---

## Si detectas datos sensibles expuestos

1. **Detente** — no continúes con la tarea actual
2. **Reporta** el hallazgo: archivo, línea, tipo de dato expuesto
3. **Revoca** la credencial expuesta desde el panel del servicio (Supabase, Spotify, etc.)
4. **Genera** nueva credencial
5. **Actualiza** solo el `.env.local` (nunca el código fuente)
6. **Verifica** que el archivo con la credencial expuesta no esté en el historial de Git

