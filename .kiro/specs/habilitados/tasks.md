# Implementation Plan: Cursos habilitados para matrícula

- [x] 1. Crear las pruebas de aceptación inicialmente fallidas
  - Crear `tests/habilitados.test.js` con los casos de la matriz de pruebas del `design.md` (criterios 1.1–4.4). Los spies o mocks que dependan de funciones todavía inexistentes se completan en las tareas 2–5; no introducir errores de importación ni simular resultados.
  - Incluir los tests red-green de los tres hallazgos de seguridad con sus nombres exactos de la tabla de pruebas:
    - `5000 códigos válidos responden 400` (hallazgo DoS, criterio 3.3)
    - `código con script tag responde 400` (hallazgo inyección, criterios 2.5 / 4.1)
    - `aprobados como string u otro no-array responde 400` (hallazgo tipo incorrecto, criterio 2.3)
  - Ejecutar `npm test` y registrar los resultados reales (nombres de tests fallidos/pasados) en `TRAZABILIDAD.md`.
  - No implementar el endpoint todavía. Registrar los estados HTTP reales; si las pruebas fallan con 404 por ausencia de la ruta, documentar que esto evidencia una funcionalidad no implementada, no la reproducción de las vulnerabilidades del prototipo. Confirmar que las pruebas existentes pasan. Mantener estos cambios únicamente en la rama de implementación.
  - Conservar todas las pruebas existentes en los otros archivos de test.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Implementar `calcularHabilitados(aprobadosSet)` en el repositorio
  - Añadir la función `calcularHabilitados(aprobadosSet)` en `src/data/repositorio.js` según la interfaz de diseño: filtrar `listar()` descartando cursos cuyo `id` esté en el `Set` y conservando solo los que tienen todos sus `prerequisites` en el `Set`.
  - Verificar contra los datos reales de `data/cursos.json` que `listar()` preserva el campo `prerequisites` como array de strings de IDs y que el formato y capitalización de los códigos cumplen el diseño. No alterar el catálogo para forzar los resultados.
  - Exportar la función junto a las existentes (`listar`, `listarPorCiclo`, `obtener`).
  - Escribir tests unitarios en `tests/repositorio.test.js` que cubran: lista vacía de aprobados, caso de referencia de 27 cursos con `["1INF25","1INF27","1INF49"]`, cursos ya aprobados excluidos, curso con prerrequisitos parcialmente satisfechos excluido.
  - Verificar que las pruebas existentes de `repositorio.test.js` siguen pasando.
  - _Requisitos: 1.1, 1.2, 1.3, 1.6, 1.7_

- [x] 3. Implementar `POST /habilitados` con validación completa de entrada
  - Crear `src/routes/habilitados.js` con el router Express y el handler `POST /`.
  - Aplicar el orden de validación del diseño (decisión 7): verificar explícitamente Content-Type application/json (admitir charset válido), presencia del cuerpo como objeto y presencia y tipo de `aprobados` (array); longitud bruta ≤ 200 antes de deduplicar; cada elemento es string con formato `/^[A-Z0-9]{2,10}$/i` y coincidencia de cadena completa (rechazar saltos de línea finales); normalizar a mayúsculas con `toUpperCase()`; deduplicar con `Set`; descartar códigos no presentes en el repositorio usando `repositorio.obtener`; invocar `repositorio.calcularHabilitados(aprobadosSet)`; responder 200 con el array de cursos con los campos `id`, `name`, `credits`, `cycle`, `type` y `prerequisites`.
  - Montar el router en `src/app.js` bajo `/habilitados`, antes del middleware global de error.
  - Verificar que la respuesta para `["1INF25","1INF27","1INF49"]` es exactamente 27 cursos e incluye `1INF29`, `1INF30`, `1INF31` y `1INF32`.
  - Usar mensajes de error fijos del contrato del diseño (sin interpolación de input).
  - Verificar que las rutas existentes (`GET /cursos`, `GET /cursos/:codigo`, `GET /health`) siguen pasando sus pruebas.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.4_

- [x] 4. Implementar manejo seguro de errores del parser y errores inesperados
  - Añadir en `src/app.js` un middleware de error específico para los errores del parser de Express, antes del middleware genérico de 500. Identificar `err.type === 'entity.parse.failed'` → 400 `{"error":"cuerpo JSON inválido"}`; `err.type === 'entity.too.large'` → 413 `{"error":"cuerpo de solicitud demasiado grande"}`.
  - Configurar `express.json()` con `{ limit: '100kb' }` para activar la protección de tamaño de bytes. Identificar otros errores esperados del parser (por ejemplo charset o encoding no soportado) y responder con un 4xx seguro según design.md.
  - Verificar el control de `Content-Type` incorrecto o body ausente del handler (devuelve 400 `{"error":"se requiere un cuerpo JSON"}`).
  - Verificar que ninguna respuesta de error (400, 413, 500) incluye stack trace, rutas internas ni mensajes de excepción.
  - Verificar que un `SyntaxError` producido por código del handler (no del parser) produce 500, no 400.
  - Ejecutar los tests de criterios 2.1, 2.6, 4.2, 4.3 y el test adicional del límite de bytes.
  - Verificar que las rutas existentes siguen pasando con el nuevo middleware de error ampliado.
  - _Requisitos: 2.1, 2.6, 4.2, 4.3_

- [x] 5. Completar y verificar todas las pruebas funcionales y de seguridad
  - Completar los spies, mocks y casos pendientes de la tarea 1; restaurar los mocks después de cada test. Ejecutar `npm test` completo y verificar que todos los tests de `tests/habilitados.test.js` pasan, incluyendo los tests red-green de los tres hallazgos.
  - Confirmar que el caso de referencia `["1INF25","1INF27","1INF49"]` devuelve exactamente 27 cursos e incluye los IDs `1INF29`, `1INF30`, `1INF31` y `1INF32`.
  - Confirmar que los tests de normalización (`1inf25` → mismo resultado que `1INF25`) pasan (criterio 1.8).
  - Confirmar que los tests de duplicados, lista vacía y códigos inexistentes pasan (criterios 1.3, 1.4, 1.5).
  - Verificar que los spies confirman que `calcularHabilitados` no se invoca con entrada inválida (criterios 3.1, 3.4, 4.4).
  - Registrar en `TRAZABILIDAD.md` los nombres definitivos de los tests y su estado (pass/fail antes y después de cada corrección).
  - Confirmar que las pruebas existentes de `cursos.test.js`, `repositorio.test.js`, `formato.test.js` y `health.test.js` siguen pasando.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Verificar el Quality Gate de cobertura global de líneas ≥ 80%
  - Confirmar que `jest.config.js` tiene `coverageThreshold: { global: { lines: 80 } }` (ya existe del spec `consulta-cursos`; no bajar el umbral).
  - Ejecutar `npm test -- --coverage` localmente y verificar que la cobertura global de líneas es ≥ 80%.
  - Realizar una comprobación controlada en una rama de prueba aislada creada desde la rama de implementación: retirar temporalmente suficientes pruebas para reducir la cobertura por debajo del 80%, manteniendo intactos el código fuente, la configuración y el umbral. Confirmar localmente con `npm test -- --coverage` que los tests restantes pasan y que el fallo se debe a cobertura insuficiente.
  - Hacer commit y push de la rama de prueba y abrir un pull request hacia `main` del fork para activar CI. Guardar la URL del run fallido y el porcentaje real. Restaurar las pruebas, hacer commit y push en ese mismo PR y guardar el run corregido con la cobertura real. Cerrar el PR de prueba sin fusionarlo; regresar a la rama de implementación.
  - No bajar el umbral del 80% ni excluir archivos de cobertura para inflar el porcentaje.
  - Registrar en `TRAZABILIDAD.md`: URL del run fallido, URL del run corregido, cobertura antes y después.
  - _Requisitos: 5.1_

- [x] 7. Implementar el gate SCA (`npm audit`) y obtener evidencia del run fallido por Lodash
  - Añadir un job independiente `sca` en `.github/workflows/ci.yml` con: `actions/checkout@v4`, `actions/setup-node@v4` (Node 22, cache npm), `npm ci` y `npm audit --audit-level=high`.
  - No corregir Lodash antes de obtener la evidencia. Verificar su versión instalada mediante `npm ls lodash` y los advisories reales mediante `npm audit`; no asumir una versión exacta ni un resultado futuro. No desplegar el servicio vulnerable.
  - Hacer commit y push en `feature/habilitados` y abrir o actualizar su PR hacia `main` del fork; verificar que el job `sca` falla por la vulnerabilidad High/Critical y guardar la URL real del run antes de corregir Lodash.
  - Registrar en `TRAZABILIDAD.md`: versión de Lodash instalada (`npm ls lodash`), advisory reportado, URL del run fallido.
  - _Requisitos: 5.2_

- [ ] 8. Corregir la vulnerabilidad de Lodash y obtener evidencia del gate SCA corregido
  - Revisar primero si Lodash se utiliza en el proyecto y si es dependencia directa o transitiva. Si es directa y no se utiliza, evaluar eliminarla; en caso contrario, actualizar de forma dirigida a una versión compatible sin vulnerabilidades High/Critical según el audit, o actualizar la dependencia que la incorpora. Evitar `npm audit fix --force` indiscriminado. Revisar package.json y package-lock.json.
  - Verificar que `npm audit --audit-level=high` retorna código 0 localmente.
  - Ejecutar `npm test -- --coverage` para confirmar que las pruebas existentes siguen pasando con la versión actualizada.
  - Ejecutar `npm ci` para verificar la instalación reproducible desde el lockfile actualizado; volver a comprobar pruebas, cobertura y audit tras la instalación.
  - Hacer commit y push en la misma rama de implementación con el PR abierto; verificar que el job `sca` pasa en GitHub Actions y guardar la URL del run corregido.
  - Registrar en `TRAZABILIDAD.md`: versión anterior, versión nueva (o eliminación), URL del run corregido.
  - _Requisitos: 5.2_

- [ ] 9. Implementar el gate de detección de secretos con Gitleaks
  - Añadir un job independiente `secrets` en `.github/workflows/ci.yml` en paralelo con `build` y `sca`, sin dependencia entre jobs, con: `actions/checkout@v4` (con `fetch-depth: 0`), instalación de Gitleaks CLI v8 con versión concreta fijada desde su distribución oficial.
  - Ejecutar dos modos explícitos: (1) `gitleaks git --log-opts="HEAD" --redact --exit-code 1 .` para el historial completo alcanzable desde HEAD; (2) `gitleaks dir --redact --exit-code 1 "$TRACKED_SNAPSHOT"` donde `TRACKED_SNAPSHOT` es un directorio temporal con el snapshot de `git archive HEAD` (solo archivos versionados, sin `.git` ni `node_modules`).
  - Ejecutar inicialmente sin exclusiones nuevas y revisar los hallazgos reales, incluyendo los posibles hallazgos en `config/ejemplo.env`. Aplicar excepciones específicas únicamente tras verificar que se trata de un falso positivo o de una clave previamente revocada/rotada, documentando el motivo y usando la configuración o `.gitleaksignore` de forma coherente en ambos modos. Conservar las reglas por defecto y nunca exceptuar secretos activos.
  - No usar `continue-on-error`, `|| true` ni exclusiones de reglas completas.
  - Hacer commit y push en la rama de implementación con su PR abierto; verificar los resultados del job `secrets`, guardar la URL y corregir o diagnosticar cualquier fallo real.
  - Registrar en `TRAZABILIDAD.md`: configuración de Gitleaks usada, hallazgos reales encontrados, excepciones aplicadas (si las hay) con su justificación.
  - _Requisitos: 5.3_

- [ ] 10. Obtener evidencia de fallo y corrección del gate de secretos
  - Si ya existe evidencia de un hallazgo real corregido en la tarea 9, reutilizarla. Si se requiere una demostración adicional, crear una rama de prueba aislada desde la implementación limpia que contiene el gate, sin introducir cambios en `main` ni en `feature/habilitados`.
  - Utilizar exclusivamente un fixture ficticio, inerte y no operativo que active una regla de Gitleaks. Verificar que el detector reconoce el fixture; no incluir el valor literal en tasks.md ni en TRAZABILIDAD.md. Nunca usar credenciales reales o activas.
  - Hacer commit y push de la rama de prueba y abrir un pull request hacia `main` del propio fork para activar el pipeline. Verificar que el job `secrets` falla por el hallazgo y guardar la URL del run y el tipo de hallazgo con salida redactada.
  - Cerrar el PR de prueba sin fusionar sus commits. El borrado de un archivo en un commit posterior no elimina el hallazgo del historial. Obtener la ejecución corregida desde el historial limpio de `feature/habilitados` o de una rama limpia equivalente, sin trasladar el commit del fixture, y registrar el URL del run exitoso.
  - Documentar el procedimiento, la regla detectada, el alcance del escaneo y los enlaces de ambas ejecuciones. Si el modo de escaneo impide demostrar algún estado rojo/verde, explicar el motivo y registrar únicamente resultados reales, conforme al enunciado.
  - _Requisitos: 5.3_

- [ ] 11. Completar `TRAZABILIDAD.md` con todos los requisitos, evidencias y cambios
  - Completar `TRAZABILIDAD.md` con una tabla que cubra todos los requisitos no funcionales (criterios 2.1–5.3) incluyendo: requisito, test o gate, condición, política, etapa, URL/nombre del run o test fallido (evidencia roja), URL/nombre del run o test corregido (evidencia verde).
  - Registrar los nombres definitivos de los tests de los tres hallazgos de seguridad con sus resultados reales (antes y después de la corrección).
  - Documentar los dos cambios reales realizados a la propuesta inicial de Kiro con justificación: (1) cambio en criterio 3.2 de `requirements.md`: reemplazo de "límites normales de respuesta sin degradación observable" por el caso verificable de exactamente 200 elementos válidos que responde HTTP 200; (2) cambio en criterio 5.2 de `requirements.md`: reemplazo de una declaración general por la condición concreta de fallo del pipeline ante High/Critical en las dependencias.
  - Registrar la versión de Lodash antes y después de la corrección.
  - No inventar URLs, nombres de ejecuciones ni resultados. Dejar marcadores `[PENDIENTE: URL del run]` para evidencias que aún no existan al momento de redactar.
  - Verificar primero que los tres jobs del PR de implementación pasan. Completar y marcar las tareas efectivamente realizadas; hacer commit y push de TRAZABILIDAD.md y tasks.md. Revisar y fusionar únicamente el PR limpio de implementación hacia main del propio fork, nunca los PR de prueba.
  - Verificar después de integrar que el último run de `main` muestra `build`, `sca` y `secrets` exitosos. Si se agrega un enlace o diagnóstico final a TRAZABILIDAD.md, hacer commit y push y volver a comprobar el último run. No declarar completada la entrega si quedan fallos o evidencias sin verificar.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

## Notas
- Las tareas se ejecutan individualmente y en orden. El usuario revisa los cambios y realiza commit y push después de cada tarea; Kiro no debe hacer commits, pushes, PR ni merges automáticamente. Trabajar en `feature/habilitados`, con un PR hacia `main` del propio fork para activar CI; usar ramas separadas para las pruebas controladas de cobertura y secretos. Integrar solo cuando los tres jobs pasen.
- No instalar `fast-check` ni otras dependencias de testing adicionales.
- No publicar implementaciones deliberadamente vulnerables en `main`.
- No inventar resultados, evidencias, URLs ni nombres de ejecuciones; usar marcadores `[PENDIENTE]` para evidencias futuras.
- No incluir código fuente directamente en este documento; los detalles de implementación están en `design.md`.
- Antes de ejecutar cada tarea, leer `requirements.md`, `design.md` y los steering files; son la fuente de verdad del contrato y las decisiones aprobadas. Registrar resultados observados, no supuestos. Los fallos esperados en TDD no deben ocultar regresiones de pruebas existentes.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": [
        "1"
      ]
    },
    {
      "id": 1,
      "tasks": [
        "2"
      ]
    },
    {
      "id": 2,
      "tasks": [
        "3"
      ]
    },
    {
      "id": 3,
      "tasks": [
        "4"
      ]
    },
    {
      "id": 4,
      "tasks": [
        "5"
      ]
    },
    {
      "id": 5,
      "tasks": [
        "6"
      ]
    },
    {
      "id": 6,
      "tasks": [
        "7"
      ]
    },
    {
      "id": 7,
      "tasks": [
        "8"
      ]
    },
    {
      "id": 8,
      "tasks": [
        "9"
      ]
    },
    {
      "id": 9,
      "tasks": [
        "10"
      ]
    },
    {
      "id": 10,
      "tasks": [
        "11"
      ]
    }
  ]
}
```
