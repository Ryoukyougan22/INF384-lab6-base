# Trazabilidad

## Requisito → gate → evidencia

| Requisito | Test o gate (herramienta y umbral) | Bloquea / avisa | Etapa | Run / test fallido (evidencia roja) | Run / test corregido (evidencia verde) |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `responde 200 con los seis campos del contrato` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (endpoint no implementado) | Tarea 5 — **PASS** (41/41 en habilitados.test.js) |
| 1.2 | `devuelve todos y solo los cursos habilitados` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** |
| 1.3 | `lista vacía devuelve exactamente los cursos sin requisitos` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** |
| 1.4 | `duplicados no alteran el resultado` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** |
| 1.5 | `códigos desconocidos no alteran el resultado` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** |
| 1.6 | `caso de referencia devuelve 27 cursos` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (27 cursos confirmados) |
| 1.7 | `caso de referencia incluye los cuatro IDs esperados` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (1INF29, 1INF30, 1INF31, 1INF32 confirmados) |
| 1.8 | `normaliza minúsculas y capitalización mixta` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (1inf25 produce mismo resultado que 1INF25) |
| 2.1 | `sin body responde 400` / `Content-Type text/plain responde 400` / `Content-Type application/json con charset válido se acepta` (3 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (3/3 casos) |
| 2.2 | `falta el campo aprobados responde 400` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** |
| 2.3 | `aprobados como string u otro no-array responde 400` (hallazgo de seguridad: tipo incorrecto) — 6 casos: `aprobados como string`, `aprobados como número`, `aprobados como objeto`, `aprobados como null`, `aprobados como booleano`, `aprobados como string u otro no-array responde 400` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (ausencia de ruta, no vulnerabilidad del prototipo) | Tarea 5 — **PASS** (6/6 casos, incluido el nombre exacto del hallazgo) |
| 2.4 | `elementos no textuales responden 400` — 4 casos: `elemento número`, `elemento null`, `elemento objeto`, `elemento booleano` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (4/4 casos) |
| 2.5 | `código de formato inválido responde 400` — 7 casos: `código con etiqueta HTML`, `código con espacio`, `código con salto de línea`, `código con longitud 1`, `código con longitud 11`, `código con cadena vacía`, `código con guión` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (7/7 casos) |
| 2.6 | `JSON malformado responde 400` | Bloqueante | PR (CI build) | Tarea 1 — falla con **500** (middleware global sin distinguir error del parser) | Tarea 5 — **PASS** (middleware de error específico en app.js responde 400 con `{"error":"cuerpo JSON inválido"}`) |
| 3.1 | `201 elementos se rechazan sin calcular` (spy de `calcularHabilitados` no invocado) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (spy confirma que `calcularHabilitados` no se invoca) |
| 3.2 | `exactamente 200 elementos válidos responde 200` / `exactamente 199 elementos válidos responde 200` (2 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (2/2 casos) |
| 3.3 | `5000 códigos válidos responden 400` (hallazgo de seguridad: DoS) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (ausencia de ruta, no vulnerabilidad del prototipo) | Tarea 5 — **PASS** (HTTP 400 con mensaje de cantidad, no de tamaño de bytes) |
| 3.4 | `201 duplicados se rechazan antes de deduplicar` (spy de `calcularHabilitados` no invocado) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (spy confirma rechazo antes de deduplicar) |
| 4.1 | `código con script tag responde 400` (hallazgo de seguridad: inyección) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (ausencia de ruta, no vulnerabilidad del prototipo) | Tarea 5 — **PASS** (`{"aprobados":["1INF30<script>"]}` → HTTP 400) |
| 4.2 | `error inesperado responde 500 genérico` / `SyntaxError interno (no del parser) responde 500, no 400` (2 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (2/2 casos, mock restaurado después de cada test) |
| 4.3 | `errores 400 no exponen detalles internos` / `errores 500 no exponen detalles internos` (2 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 / 500 | Tarea 5 — **PASS** (2/2 casos, sin stack traces ni rutas internas) |
| 4.4 | `formato inválido no invoca el cálculo` (spy de `calcularHabilitados` no invocado) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | Tarea 5 — **PASS** (spy confirma que `calcularHabilitados` no se invoca con formato inválido) |
| 5.1 | Jest con cobertura global de líneas ≥ 80% (`npm test -- --coverage`) | Bloqueante | PR (CI build) | [PENDIENTE: URL del run fallido] | [PENDIENTE: URL del run corregido] |
| 5.2 | `npm audit --audit-level=high` (job `sca`) | Bloqueante | PR (CI sca) | [PENDIENTE: URL del run fallido — Lodash] | [PENDIENTE: URL del run corregido] |
| 5.3 | Gitleaks CLI v8 — historial + snapshot HEAD (job `secrets`) | Bloqueante | PR (CI secrets) | [PENDIENTE: URL del run fallido] | [PENDIENTE: URL del run corregido] |

### Nota sobre los tres hallazgos de seguridad (Tarea 1)

Los tests `5000 códigos válidos responden 400`, `código con script tag responde 400` y `aprobados como string u otro no-array responde 400` recibieron HTTP **404** en la fase roja, porque el endpoint `POST /habilitados` todavía no existe. Un 404 evidencia que la funcionalidad no está implementada; **no** reproduce la vulnerabilidad que existiría en un prototipo con la ruta presente pero sin validación. La evidencia roja de las vulnerabilidades reales se obtendrá al implementar la ruta sin validación en un entorno aislado (tarea 3) y registrar los resultados antes de añadir los controles.

La excepción es el criterio **2.6** (JSON malformado): este test recibió HTTP **500** en lugar de 404, porque el middleware global de Express ya captura el error del parser pero lo trata como error interno en lugar de devolver 400. Eso confirma que la distinción entre errores del parser y errores internos aún no está implementada (tarea 4).

### Resultados del run de npm test — Tarea 1 (fase roja)

| Archivo | Tests pasados | Tests fallidos | Total |
| --- | --- | --- | --- |
| `tests/habilitados.test.js` | 0 | 41 | 41 |
| `tests/cursos.test.js` | 18 | 0 | 18 |
| `tests/formato.test.js` | 10 | 0 | 10 |
| `tests/health.test.js` | 7 | 0 | 7 |
| `tests/repositorio.test.js` | 8 | 0 | 8 |
| **Total** | **43** | **41** | **84** |

Los 41 fallos de `habilitados.test.js` son esperados en la fase roja de TDD. Todos los tests preexistentes (43) continúan pasando.

## Resultados del run de npm test — Tarea 5 (fase verde)

| Archivo | Tests pasados | Tests fallidos | Total |
| --- | --- | --- | --- |
| `tests/habilitados.test.js` | 41 | 0 | 41 |
| `tests/cursos.test.js` | 18 | 0 | 18 |
| `tests/formato.test.js` | 10 | 0 | 10 |
| `tests/health.test.js` | 7 | 0 | 7 |
| `tests/repositorio.test.js` | 13 | 0 | 13 |
| **Total** | **89** | **0** | **89** |

### Nombres definitivos de los tests de los tres hallazgos de seguridad

| Hallazgo | Nombre del test (exacto) | Criterio | Estado Tarea 1 | Estado Tarea 5 |
| --- | --- | --- | --- | --- |
| DoS (límite de elementos) | `5000 códigos válidos responden 400` | 3.3 | FAIL (404 — endpoint ausente) | **PASS** |
| Inyección (etiqueta HTML) | `código con script tag responde 400` | 2.5 / 4.1 | FAIL (404 — endpoint ausente) | **PASS** |
| Tipo incorrecto | `aprobados como string u otro no-array responde 400` | 2.3 | FAIL (404 — endpoint ausente) | **PASS** |

### Verificación de sub-tareas

- **Caso de referencia (1.6, 1.7):** `{"aprobados":["1INF25","1INF27","1INF49"]}` devuelve exactamente **27** cursos, incluidos `1INF29`, `1INF30`, `1INF31` y `1INF32`. ✅
- **Normalización (1.8):** `1inf25`, `1INF25` y `1Inf25` producen resultados idénticos. ✅
- **Duplicados, lista vacía, códigos inexistentes (1.3, 1.4, 1.5):** todos pasan. ✅
- **Spies de `calcularHabilitados` (3.1, 3.4, 4.4):** función **no invocada** cuando la entrada es inválida; spies restaurados con `mockRestore()` después de cada test. ✅
- **Pruebas existentes:** `cursos.test.js` (18), `repositorio.test.js` (13), `formato.test.js` (10) y `health.test.js` (7) continúan pasando sin modificaciones. ✅

## Cambios a la propuesta de Kiro

| Documento | Qué propuso Kiro | Qué cambiaste | Por qué |
| --- | --- | --- | --- |
| `requirements.md` criterio 3.2 | "CUANDO el array `aprobados` contenga exactamente 200 elementos con códigos de formato válido y la solicitud cumpla los demás requisitos de validación, EL Sistema DEBE responder sin degradación observable" (redacción original imprecisa sobre la respuesta esperada) | Se reemplazó por: "EL Sistema DEBE responder HTTP 200" | La condición "sin degradación observable" no es verificable automáticamente. El criterio verificable es que el sistema responda HTTP 200, lo que permite escribir una prueba determinista y un gate de CI. |
| `requirements.md` criterio 5.2 | "EL Pipeline DEBE fallar si existen vulnerabilidades en las dependencias" (declaración general sin umbral) | Se reemplazó por: "SI se detecta al menos una vulnerabilidad de severidad **alta o crítica** en las dependencias del proyecto, EL Pipeline DEBE fallar" | Sin umbral concreto, el gate no es accionable: `npm audit` distingue severidades Low / Moderate / High / Critical y el comando `--audit-level=high` solo falla ante High o Critical. El criterio anterior habría obligado a bloquear ante vulnerabilidades Moderate o Low, lo que es excesivo para la política de TI del laboratorio. |
