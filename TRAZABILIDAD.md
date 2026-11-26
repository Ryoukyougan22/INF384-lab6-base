# Trazabilidad

## Requisito → gate → evidencia

| Requisito | Test o gate (herramienta y umbral) | Bloquea / avisa | Etapa | Run / test fallido (evidencia roja) | Run / test corregido (evidencia verde) |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `responde 200 con los seis campos del contrato` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (endpoint no implementado) | [PENDIENTE] |
| 1.2 | `devuelve todos y solo los cursos habilitados` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 1.3 | `lista vacía devuelve exactamente los cursos sin requisitos` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 1.4 | `duplicados no alteran el resultado` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 1.5 | `códigos desconocidos no alteran el resultado` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 1.6 | `caso de referencia devuelve 27 cursos` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 1.7 | `caso de referencia incluye los cuatro IDs esperados` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 1.8 | `normaliza minúsculas y capitalización mixta` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 2.1 | `body ausente o Content-Type incorrecto responde 400` (3 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 2.2 | `falta el campo aprobados responde 400` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 2.3 | `aprobados como string u otro no-array responde 400` (hallazgo de seguridad: tipo incorrecto) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (ausencia de ruta, no vulnerabilidad del prototipo) | [PENDIENTE] |
| 2.4 | `elementos no textuales responden 400` (4 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 2.5 | `código de formato inválido responde 400` (7 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 2.6 | `JSON malformado responde 400` | Bloqueante | PR (CI build) | Tarea 1 — falla con **500** (middleware global sin distinguir error del parser) | [PENDIENTE] |
| 3.1 | `201 elementos se rechazan sin calcular` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 3.2 | `exactamente 200 elementos válidos responde 200` (2 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 3.3 | `5000 códigos válidos responden 400` (hallazgo de seguridad: DoS) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (ausencia de ruta, no vulnerabilidad del prototipo) | [PENDIENTE] |
| 3.4 | `201 duplicados se rechazan antes de deduplicar` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 4.1 | `código con script tag responde 400` (hallazgo de seguridad: inyección) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 (ausencia de ruta, no vulnerabilidad del prototipo) | [PENDIENTE] |
| 4.2 | `error inesperado responde 500 genérico` (2 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
| 4.3 | `errores 400 y 500 no exponen detalles internos` (2 casos) | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 / 500 | [PENDIENTE] |
| 4.4 | `formato inválido no invoca el cálculo` | Bloqueante | PR (CI build) | Tarea 1 — falla con 404 | [PENDIENTE] |
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

## Cambios a la propuesta de Kiro

| Documento | Qué propuso Kiro | Qué cambiaste | Por qué |
| --- | --- | --- | --- |
| `requirements.md` criterio 3.2 | "CUANDO el array `aprobados` contenga exactamente 200 elementos con códigos de formato válido y la solicitud cumpla los demás requisitos de validación, EL Sistema DEBE responder sin degradación observable" (redacción original imprecisa sobre la respuesta esperada) | Se reemplazó por: "EL Sistema DEBE responder HTTP 200" | La condición "sin degradación observable" no es verificable automáticamente. El criterio verificable es que el sistema responda HTTP 200, lo que permite escribir una prueba determinista y un gate de CI. |
| `requirements.md` criterio 5.2 | "EL Pipeline DEBE fallar si existen vulnerabilidades en las dependencias" (declaración general sin umbral) | Se reemplazó por: "SI se detecta al menos una vulnerabilidad de severidad **alta o crítica** en las dependencias del proyecto, EL Pipeline DEBE fallar" | Sin umbral concreto, el gate no es accionable: `npm audit` distingue severidades Low / Moderate / High / Critical y el comando `--audit-level=high` solo falla ante High o Critical. El criterio anterior habría obligado a bloquear ante vulnerabilidades Moderate o Low, lo que es excesivo para la política de TI del laboratorio. |
