# TeMusic — Flujo de Trabajo con Agentes en Antigravity IDE

---

## Cómo Usar la Ventana de Agente en Antigravity

### Paso 1: Abrir el panel de Agentes
- En Antigravity IDE, busca el ícono de **Agent** en la barra lateral (generalmente un ícono de robot o persona)
- Haz clic en **New Agent** o **+ Add Agent**
- Asigna un nombre (ej. `temusic-auth-debugger`)

### Paso 2: Configurar el agente
- En el campo **Instructions** o **System Prompt**: pega el contenido del prompt correspondiente
- En el campo **Context** o **Files**: puedes agregar los archivos relevantes del proyecto
- Guarda la configuración del agente

### Paso 3: Invocar el agente
- Selecciona el agente en el panel
- Escribe tu problema en el chat del agente
- El agente usará su prompt de sistema + el contexto del proyecto para responder

---

## Diagrama del Flujo Completo

```
┌─────────────────────────────────────────────────────┐
│                  TÚ (desarrollador)                  │
│           Describes el problema en lenguaje libre    │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              temusic-orchestrator                    │
│  ¿El problema es claro y sabes qué módulo es?        │
│  NO → usa orchestrator para diagnóstico inicial      │
│  SÍ → ve directo al agente especializado             │
└────────────┬──────────────────────────────┬─────────┘
             │ asigna módulo                │ plan generado
             ▼                              ▼
   ┌─────────────────┐            Ir al agente especializado
   │  Módulo afectado│
   │  identificado   │
   └────────┬────────┘
            │
     ┌──────┴──────────────────────────────────┐
     │                                          │
     ▼                  ▼            ▼          ▼           ▼
┌──────────┐   ┌────────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│  auth-   │   │  data-     │ │ spotify- │ │supabase│ │  ui-qa   │
│ debugger │   │  flow      │ │ engine   │ │auditor │ │          │
│          │   │            │ │          │ │        │ │          │
│Login     │   │Hooks/SWR   │ │API calls │ │BD      │ │Visuals   │
│Sesión    │   │Fetchers    │ │Playlists │ │Queries │ │UX States │
│JWT       │   │UI vacía    │ │Scopes    │ │Tokens  │ │Empty/Err │
│Tokens    │   │Shape JSON  │ │Mappings  │ │Schema  │ │Loading   │
└────┬─────┘   └─────┬──────┘ └────┬─────┘ └───┬────┘ └──────────┘
     │               │             │            │          ▲
     └───────────────┴─────────────┴────────────┘          │
                              │                             │
                     Fix mínimo aplicado                    │
                              │                             │
                              └─────────────────────────────┘
                              Siempre terminar con ui-qa
```

---

## Flujos por Tipo de Tarea

### Bug: "El dashboard no muestra datos"
```
1. temusic-orchestrator  → identifica módulo
2. temusic-auth-debugger → ¿la sesión resuelve usuario y token?
3. temusic-data-flow     → ¿el fetcher recibe y mapea bien la respuesta?
4. temusic-ui-qa         → ¿el usuario ve loading/error/data correctamente?
```

### Bug: "Error al crear playlist"
```
1. temusic-spotify-engine → ¿scope correcto? ¿endpoint correcto? ¿respuesta de Spotify?
2. temusic-data-flow      → ¿el hook recibe la confirmación de creación?
3. temusic-ui-qa          → ¿el usuario ve feedback de éxito o error?
```

### Bug: "Snapshots no se guardan"
```
1. temusic-supabase-auditor → ¿query correcta? ¿user_id existe? ¿RLS bloqueando?
2. temusic-ui-qa            → ¿el usuario recibe confirmación visual?
```

### Nueva feature: "Top artists por período"
```
1. temusic-orchestrator    → plan de implementación
2. temusic-spotify-engine  → endpoint, scope, mapper
3. temusic-data-flow       → hook nuevo o extensión del existente
4. temusic-ui-qa           → loading/empty/data states del nuevo componente
```

### Auditoría de seguridad antes de deploy
```
1. temusic-orchestrator    → revisión global del proyecto
2. temusic-auth-debugger   → verificar que no haya tokens expuestos
3. temusic-supabase-auditor → verificar que service_role_key no esté en cliente
4. temusic-spotify-engine  → verificar que client_secret no esté en código fuente
```

---

## Plantillas de Invocación por Situación

### Para empezar desde cero (bug ambiguo)
```
Tengo este problema en TeMusic:
[descripción del síntoma]

Por favor:
1. Identifica el módulo afectado
2. Formula hipótesis
3. Dime qué agente debo usar
4. Dame el plan de validación antes de editar código
```

### Para inspección sin editar
```
Inspecciona este flujo en TeMusic sin editar nada todavía:
[área o archivo a inspeccionar]

Quiero:
- diagnóstico,
- hipótesis ordenadas por probabilidad,
- archivos responsables,
- validación sugerida.
```

### Para aplicar fix
```
Aplica el fix mínimo para este problema ya diagnosticado:
[descripción del problema diagnosticado]

Restricciones:
- Solo el cambio necesario
- No refactorices fuera del flujo afectado
- Explica exactamente qué cambiaste y por qué
- Verifica que no haya datos sensibles expuestos en el cambio
```

### Para validación después del fix
```
Valida el resultado después del fix aplicado en [módulo].
Revisa:
- que los estados loading/empty/error sean visibles y correctos
- que no haya impactos colaterales en otros módulos
- que no se haya expuesto ningún dato sensible en el cambio
```

### Para auditoría de seguridad
```
Realiza una auditoría de seguridad en TeMusic antes del próximo deploy.
Verifica específicamente:
- que .env.local esté en .gitignore
- que no haya tokens o claves hardcodeadas en código fuente
- que las rutas API no devuelvan datos sensibles al frontend
- que service_role_key no esté accesible desde el cliente
- que los logs no impriman tokens completos
Reporta cada hallazgo con: archivo, línea, riesgo, fix recomendado.
```

---

## Tabla de Referencia Rápida

| Síntoma | Agente principal | Agente secundario |
|---------|-----------------|-------------------|
| Dashboard vacío sin error | auth-debugger | data-flow |
| 401 en rutas de métricas | auth-debugger | — |
| SWR retorna undefined | data-flow | auth-debugger |
| Error de Spotify 403 | spotify-engine | — |
| Playlist no se crea | spotify-engine | data-flow |
| Usuario no encontrado en BD | supabase-auditor | auth-debugger |
| Snapshot no se guarda | supabase-auditor | — |
| Pantalla en blanco silenciosa | data-flow | ui-qa |
| UX confusa o sin feedback | ui-qa | — |
| Bug en múltiples módulos | orchestrator | todos |
| Antes de hacer deploy | orchestrator | auth+supabase+spotify |

