# AGENTS.md — TeMusic Project Rules

> Archivo de contrato del proyecto. Todos los agentes de Antigravity IDE deben leer y respetar estas reglas antes de realizar cualquier acción.

---

## 🗂️ Proyecto

**Nombre:** TeMusic
**Path local:** `/Users/Telolco/TeMusic`
**Stack:** Next.js 16 App Router · TypeScript · Spotify OAuth · Supabase · SWR
**Módulos:** OS (métricas y overview) · LAB (playlists) · DISCOVERY (recomendaciones)

---

## ⛔ REGLA CRÍTICA DE SEGURIDAD — LEER ANTES DE CUALQUIER ACCIÓN

**NUNCA incluyas en ningún archivo que pueda subirse a Git, desplegarse o compartirse:**

- Tokens de Spotify (`access_token`, `refresh_token`, `client_secret`)
- Claves de Supabase (`service_role_key`, `anon_key`, `JWT secret`)
- Secretos de sesión (`SESSION_SECRET`)
- Credenciales de usuario reales
- Variables de entorno con valores reales (solo placeholders)
- IDs de usuario o datos personales en código fuente
- Logs que impriman tokens o contraseñas completas

**Antes de cualquier commit o deploy, verifica:**
1. Que `.env.local` esté en `.gitignore`
2. Que ningún archivo de código source contenga valores reales hardcodeados
3. Que los `console.error` y `console.log` no expongan tokens completos (usa truncate: `token.slice(0, 8) + '...'`)
4. Que las rutas API nunca devuelvan tokens o datos sensibles al frontend
5. Que Supabase `service_role_key` NUNCA se use en código cliente

Si detectas cualquier dato sensible expuesto, reporta el hallazgo ANTES de continuar.

---

## 📐 Reglas Generales de Trabajo

- Nunca editar archivos fuera del módulo afectado sin justificación explícita.
- Antes de modificar, inspeccionar el flujo completo de datos del área afectada.
- No hacer refactors amplios si el problema puede resolverse con un fix mínimo.
- Cada bug debe entregarse con: causa raíz · archivo exacto · fix propuesto · validación esperada.
- Ningún fetcher puede ignorar `response.ok` ni el campo `error` del backend.
- Toda ruta API protegida debe validar sesión y devolver errores claros y descriptivos.
- No romper el flujo OAuth, las cookies de sesión ni la persistencia de tokens.
- Toda vista que dependa de datos remotos debe tener: loading state · empty state · error state explícito.
- Toda modificación debe explicarse en lenguaje claro al final de la respuesta.
- Si hay más de un problema, priorizarlos por impacto y resolverlos uno a uno.

---

## 🔐 Reglas de Auth y Sesión

- La sesión se maneja con JWT en cookie HTTP-only `temusc_session`.
- El secreto de sesión se lee de `process.env.SESSION_SECRET`.
- Toda ruta API de datos usa `getAuthenticatedUser()` como primer paso.
- Si `getAuthenticatedUser()` retorna `null`, la respuesta es `401` inmediato.
- Los tokens de Spotify se guardan en Supabase, no en el cliente ni en variables de entorno de runtime.
- El refresh de token debe ser transparente: reintentar con nuevo token si el actual expiró.
- Los logs de auth deben identificar el punto exacto de falla sin exponer el token completo.

---

## 🔄 Reglas de Datos y SWR

- Los hooks de SWR deben manejar explícitamente los estados `isLoading`, `error` y `data === undefined`.
- El fetcher base debe lanzar error si `!response.ok` o si `json.error` existe.
- Las respuestas de todas las rutas API siguen este contrato:
  ```json
  { "data": <payload | null>, "error": <string | null>, "status": <number> }
  ```
- Nunca devolver datos parciales sin señalizar el error en el mismo payload.

---

## 🎵 Reglas de Spotify API

- Usar solo los scopes estrictamente necesarios.
- Todo endpoint de Spotify debe manejar: rate limit (429) · token expirado (401) · error genérico (500).
- Los mappers (`mapTrack`, `mapArtist`) deben ser estables y documentados.
- No mezclar tipos raw de Spotify con tipos internos de la app fuera de los mappers.

---

## 🗄️ Reglas de Supabase

- Nunca usar `service_role_key` en código cliente.
- Las queries deben manejar el caso `null` explícitamente.
- Los tipos de Supabase deben estar sincronizados con el esquema real de la BD.
- No hardcodear IDs de usuario ni IDs de tabla en código fuente.

---

## 🚀 Reglas de Cambios Seguros

- Cambios pequeños y reversibles.
- Un bug = un patch lógico.
- No mezclar fix técnico con mejoras visuales en el mismo cambio.
- Antes de editar: inspección. Después de editar: validación.
- Separar siempre la fase de diagnóstico de la fase de implementación.

---

## 📋 Formato de Respuesta Obligatorio

Todo agente debe entregar respuestas con esta estructura cuando resuelve un problema técnico:

```
### Diagnóstico
[qué encontré y dónde]

### Causa Raíz
[por qué está fallando]

### Fix Propuesto
[cambio mínimo necesario]

### Validación Esperada
[cómo verificar que el fix funcionó]

### Cambios Realizados
[qué archivos se editaron y por qué]
```

---

## 🔁 Flujo de Agentes

```
temusic-orchestrator
    ├── temusic-auth-debugger    → bugs de login, sesión, tokens, OAuth
    ├── temusic-data-flow        → hooks, SWR, fetchers, UI vacía
    ├── temusic-spotify-engine   → Spotify API, scopes, mappings, playlists
    ├── temusic-supabase-auditor → queries BD, persistencia, snapshots
    └── temusic-ui-qa            → estados visuales, UX, empty/error/loading
```

Siempre invocar `temusic-orchestrator` cuando el problema sea ambiguo.
Invocar agentes especializados directamente cuando el módulo afectado sea claro.
Cerrar siempre con `temusic-ui-qa` después de cualquier fix técnico.

