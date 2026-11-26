# Trazabilidad — Malla INF, Laboratorio 6

## 1. Evidencias de integración continua

Las ejecuciones de GitHub Actions indicadas a continuación fueron verificadas. Los jobs de CI se ejecutan en pull requests hacia `main` y en pushes a `main`.

| Evidencia | Run | Resultado |
| --- | --- | --- |
| TDD RED | [Run 45902806755](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45902806755) | Fallo del job `build`; 41 pruebas nuevas fallidas y 43 preexistentes aprobadas en la fase inicial local. |
| TDD GREEN | [Run 45903781662](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45903781662) | 89 pruebas aprobadas, 5 suites, 97.11% de cobertura de líneas. |
| Cobertura RED | [CI #10](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45904714199) | 31 pruebas aprobadas; cobertura 50%; umbral 80% incumplido, exit code 1. |
| Cobertura GREEN | [CI #11](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45904853669) | 89 pruebas aprobadas; cobertura 97.11%. |
| SCA RED | [CI #12](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45905141158) | `build` exitoso; `sca` fallido; 1 vulnerabilidad High en Lodash, exit code 1. |
| SCA GREEN | [CI #14](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45905692581) | `build` y `sca` exitosos; 0 vulnerabilidades. |
| Secretos RED inicial | [CI #15](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45906182088) | 24 commits analizados; 2 hallazgos, exit code 1. |
| Secretos RED detallado | [CI #16](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45906475049) | 25 commits analizados; 2 hallazgos identificados, exit code 1. |
| Secretos GREEN / CI completo | [CI #17](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45906796333) | `build`, `sca` y `secrets` exitosos; 26 commits analizados, sin hallazgos no exceptuados en ambos modos de Gitleaks. |

## 2. Requisito → prueba o gate → evidencia

En los criterios 1.1–4.4, la herramienta de prueba es Jest/Supertest (`tests/habilitados.test.js`) y el job que verifica las pruebas es `build`. RED corresponde a la fase inicial de TDD, no a una reproducción del prototipo vulnerable. GREEN corresponde a las pruebas aprobadas en CI. Los estados se refieren al fallo o éxito del job, no a una configuración de protección de rama que impida el merge.

| Requisito | Prueba o gate (condición/umbral) | Política | Etapa | Evidencia RED | Evidencia GREEN |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `responde 200 con los seis campos del contrato` | Bloqueante | PR / main | 404, ruta ausente | PASS |
| 1.2 | `devuelve todos y solo los cursos habilitados` | Bloqueante | PR / main | 404 | PASS |
| 1.3 | `lista vacía devuelve exactamente los cursos sin requisitos` | Bloqueante | PR / main | 404 | PASS |
| 1.4 | `duplicados no alteran el resultado` | Bloqueante | PR / main | 404 | PASS |
| 1.5 | `códigos desconocidos no alteran el resultado` | Bloqueante | PR / main | 404 | PASS |
| 1.6 | `caso de referencia devuelve 27 cursos` | Bloqueante | PR / main | 404 | PASS: 27 cursos |
| 1.7 | `caso de referencia incluye los cuatro IDs esperados` | Bloqueante | PR / main | 404 | PASS: 1INF29, 1INF30, 1INF31, 1INF32 |
| 1.8 | `normaliza minúsculas y capitalización mixta` | Bloqueante | PR / main | 404 | PASS |
| 2.1 | `sin body responde 400`; `Content-Type text/plain responde 400`; `Content-Type application/json con charset válido se acepta` | Bloqueante | PR / main | 404 | PASS |
| 2.2 | `falta el campo aprobados responde 400` | Bloqueante | PR / main | 404 | PASS |
| 2.3 | `aprobados como string u otro no-array responde 400`; casos parametrizados de tipos incorrectos | Bloqueante | PR / main | 404 | PASS: HTTP 400 |
| 2.4 | `elemento %s responde 400` (número, null, objeto, booleano) | Bloqueante | PR / main | 404 | PASS |
| 2.5 | `código con %s responde 400` (etiqueta HTML, espacio, salto de línea, longitud 1, longitud 11, cadena vacía, guión) | Bloqueante | PR / main | 404 | PASS |
| 2.6 | `JSON malformado responde 400` | Bloqueante | PR / main | HTTP 500 antes de distinguir los errores del parser | PASS: HTTP 400 |
| 3.1 | `201 elementos se rechazan sin calcular` | Bloqueante | PR / main | 404 | PASS; cálculo no invocado |
| 3.2 | `exactamente 200 elementos válidos responde 200`; `exactamente 199 elementos válidos responde 200` | Bloqueante | PR / main | 404 | PASS |
| 3.3 | `5000 códigos válidos responden 400` | Bloqueante | PR / main | 404 | PASS: HTTP 400 |
| 3.4 | `201 duplicados se rechazan antes de deduplicar` | Bloqueante | PR / main | 404 | PASS; cálculo no invocado |
| 4.1 | `código con script tag responde 400` | Bloqueante | PR / main | 404 | PASS: HTTP 400 |
| 4.2 | `error inesperado responde 500 genérico`; `SyntaxError interno (no del parser) responde 500, no 400` | Bloqueante | PR / main | 404 | PASS: HTTP 500 genérico |
| 4.3 | `errores 400 no exponen detalles internos`; `errores 500 no exponen detalles internos` | Bloqueante | PR / main | 404 / 500, según el caso inicial | PASS: sin detalles internos |
| 4.4 | `formato inválido no invoca el cálculo` | Bloqueante | PR / main | 404 | PASS; cálculo no invocado |
| 5.1 | Jest: cobertura global de líneas ≥ 80%, `npm test -- --coverage` | Bloqueante | PR / main (`build`) | [50%, FAIL](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45904714199) | [97.11%, PASS](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45904853669) |
| 5.2 | `npm audit --audit-level=high`: ninguna vulnerabilidad High/Critical | Bloqueante | PR / main (`sca`) | [1 High, FAIL](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45905141158) | [0 vulnerabilidades, PASS](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45905692581) |
| 5.3 | Gitleaks 8.21.2: cero hallazgos no exceptuados, historial y snapshot HEAD | Bloqueante | PR / main (`secrets`) | [2 hallazgos, FAIL](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45906475049) | [Ambos modos PASS](https://github.com/Ryoukyougan22/INF384-lab6-base/actions/runs/45906796333) |

## 3. TDD y hallazgos de seguridad del endpoint

| Hallazgo del enunciado | Nombre exacto de prueba | Criterio | RED | GREEN |
| --- | --- | --- | --- | --- |
| DoS por cantidad de códigos | `5000 códigos válidos responden 400` | 3.3 | FAIL, HTTP 404 | PASS, HTTP 400 |
| Entrada con etiqueta script | `código con script tag responde 400` | 2.5 / 4.1 | FAIL, HTTP 404 | PASS, HTTP 400 |
| Tipo de dato incorrecto | `aprobados como string u otro no-array responde 400` | 2.3 | FAIL, HTTP 404 | PASS, HTTP 400 |

Los tres casos inicialmente fallaron por ausencia del endpoint. No se reprodujeron las vulnerabilidades del prototipo anterior ni se midieron sus 40 segundos de respuesta. La prueba de JSON malformado sí observó HTTP 500 antes de la corrección del parser. Tras implementar el endpoint, los casos de seguridad pasan. El límite de 200 elementos se evalúa sobre el array original antes de deduplicar; el formato y los tipos se validan antes del cálculo. Se mantiene el límite del parser de 100 KB como defensa adicional.

| Fase | Pruebas aprobadas | Pruebas fallidas | Total |
| --- | ---: | ---: | ---: |
| RED (resultado local de tarea 1) | 43 | 41 | 84 |
| GREEN (CI #17) | 89 | 0 | 89 |

El caso de referencia devuelve 27 cursos, incluyendo 1INF29, 1INF30, 1INF31 y 1INF32. La cobertura final verificada en CI #17 es 97.11% de líneas, 97.29% de sentencias, 86.27% de ramas y 100% de funciones.

## 4. Quality Gate de cobertura

- Herramienta: Jest, cobertura de código automatizada.
- Umbral: `coverageThreshold.global.lines = 80`, configurado en `jest.config.js`.
- Política: bloqueante para el job `build`; una cobertura inferior al umbral produce salida distinta de cero.
- Etapa: pull requests hacia `main` y pushes a `main`.
- Demostración: en la rama aislada `test/coverage-gate` se retiraron temporalmente `tests/habilitados.test.js` y `tests/formato.test.js`. El CI #10 falló por cobertura insuficiente (50%) aunque sus 31 pruebas pasaron. Se restauraron las pruebas sin reducir el umbral ni modificar el código fuente; CI #11 recuperó 97.11% y 89 pruebas aprobadas. Esta rama de demostración no debe fusionarse a `main`.

## 5. Security Gate SCA

- Herramienta: `npm audit --audit-level=high`, job independiente `sca`.
- Umbral: ninguna vulnerabilidad High o Critical; las severidades inferiores no bloquean por este umbral.
- Política: bloqueante; una auditoría fallida impide que el job termine exitosamente.
- Etapa: pull requests hacia `main` y pushes a `main`.
- Justificación: analiza las dependencias instaladas y el árbol resuelto por el lockfile, evitando introducir dependencias con vulnerabilidades conocidas de severidad alta o crítica.

Antes de la corrección, Lodash 4.17.20 produjo 1 vulnerabilidad High y cuatro avisos de seguridad:

- GHSA-35jh-r3h4-6jhm: Command Injection.
- GHSA-29mw-wpgm-hmr9: Regular Expression Denial of Service (ReDoS).
- GHSA-r5fr-rjxr-66jc: Code Injection mediante `_.template`.
- GHSA-xxjr-mmjv-4gpg: Prototype Pollution.

Se actualizó la dependencia directa a Lodash 4.18.1 de forma dirigida. CI #14 confirmó cero vulnerabilidades y 89 pruebas aprobadas con 97.11% de cobertura; CI #17 mantuvo los mismos resultados. La auditoría refleja los avisos conocidos en la fecha de ejecución, no una garantía de ausencia permanente de vulnerabilidades.

## 6. Security Gate de detección de secretos

- Herramienta: Gitleaks CLI v8.21.2, versión fijada, job independiente `secrets`.
- Umbral: cero hallazgos no exceptuados justificadamente.
- Política: bloqueante; `--exit-code 1`, sin `continue-on-error` ni `|| true`.
- Etapa: pull requests hacia `main` y pushes a `main`.
- Alcance: historial alcanzable desde HEAD (`fetch-depth: 0` y `--log-opts="HEAD"`) y snapshot de archivos versionados generado con `git archive HEAD`.
- Justificación: detectar valores sensibles tanto en los cambios históricos como en el estado actual del repositorio, sin analizar dependencias instaladas ni excluir archivos completos.

Se conservan las reglas por defecto de `gitleaks.toml` con `useDefault = true`. Se activa la salida detallada del historial con redacción de secretos. En CI #16 se identificaron dos ocurrencias del mismo valor:

| Archivo | Línea histórica | Regla | Commit |
| --- | ---: | --- | --- |
| `config/ejemplo.env` | 4 | `generic-api-key` | `7506fec` |
| `TRAZABILIDAD.md` | 136 | `generic-api-key` | `cc4556e` |

El primer valor procedía de una plantilla de configuración del repositorio base; la segunda ocurrencia se introdujo al documentar el hallazgo. Se retiró el valor literal de ambos archivos actuales, dejando vacía la variable de configuración de ejemplo. Se eliminó la exclusión general por ruta y se registraron únicamente las dos huellas históricas exactas en `.gitleaksignore`. No se deshabilitó ninguna regla ni se excluyó ningún archivo completo. La corrección no reescribe ni borra los commits históricos.

**Justificación y condición de las excepciones:** se limitan a dos ocurrencias históricas de un valor de plantilla, no a futuras coincidencias. Debe confirmarse con el responsable del laboratorio que el valor es ficticio e inerte o que, si fue una credencial real, fue revocado. El origen en una plantilla y el resultado verde de CI no prueban por sí solos su inactividad. Si no puede confirmarse, corresponde tratarlo como potencialmente comprometido y gestionar su revocación y remediación antes de integrar.

CI #15 y #16 demuestran el fallo por hallazgos existentes; no fue necesario insertar un secreto adicional. CI #17 confirmó 26 commits analizados y `no leaks found` en ambos modos, con las excepciones históricas indicadas y sin hallazgos en el snapshot actual.

## 7. Dos cambios a la propuesta original de Kiro

| Documento / criterio | Propuesta original | Modificación | Justificación |
| --- | --- | --- | --- |
| `requirements.md`, 3.2 | MIENTRAS el array `aprobados` tenga 200 elementos o menos, EL Sistema DEBE procesar la solicitud dentro de los límites normales de respuesta sin degradación observable. | CUANDO el array `aprobados` contenga exactamente 200 elementos con códigos de formato válido y la solicitud cumpla los demás requisitos de validación, EL Sistema DEBE responder HTTP 200. | Reemplazar una expresión ambigua por una condición de frontera verificable. Los casos de 199, 200, 201 y 5000 elementos comprueban el comportamiento de aceptación y rechazo. No constituye una garantía de latencia. |
| `requirements.md`, 5.2 | THE Sistema DEBE operar sin dependencias de terceros que tengan vulnerabilidades de severidad alta o crítica conocidas al momento de la integración. | SI se detecta al menos una vulnerabilidad de severidad alta o crítica en las dependencias del proyecto, EL Pipeline DEBE fallar. | La propuesta ya incluía el umbral de severidad; la modificación añade una consecuencia observable y automatizable: el fallo del pipeline, demostrado por los runs RED y GREEN del SCA. |

## 8. Estado de integración y entrega

La ejecución completa CI #17 corresponde al pull request de `feature/habilitados` hacia `main`, no a un push final en `main`. Los tres jobs finalizaron exitosamente. El merge final debe realizarse después de confirmar las excepciones históricas, completar la documentación y comprobar los controles en el PR. Tras integrar, verificar la ejecución generada por el push a `main` y registrar su enlace. Si se exige bloqueo efectivo de merge, configurar y verificar checks obligatorios `build`, `sca` y `secrets` en la protección de `main`.
