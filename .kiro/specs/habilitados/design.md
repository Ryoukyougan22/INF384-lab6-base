# Diseño: Cursos habilitados para matrícula

## Overview

`POST /habilitados` recibe los códigos de cursos aprobados por un alumno y devuelve todos y únicamente los cursos que aún no aprobó y cuyos prerrequisitos están satisfechos. Un curso sin prerrequisitos está habilitado si no ha sido aprobado.

El cálculo se realiza sobre el catálogo cargado en memoria por `src/data/repositorio.js`. La operación es una consulta sin efectos de escritura sobre los datos, aunque utiliza POST para recibir un cuerpo JSON. No se incorporan nuevas dependencias npm para implementar el endpoint ni sus pruebas.

## Architecture

```text
POST /habilitados
        |
        v
express.json() (límite de bytes explícito: 100kb)
        |
        +-- Error del parser --> middleware de errores --> 400/413 seguro
        |
        v
Router /habilitados
        |
        +-- Entrada inválida --> 400 JSON seguro (sin calcular)
        |
        v
Normalización, descarte de IDs inexistentes y Set
        |
        v
repositorio.calcularHabilitados(aprobadosSet)
        |
        +-- Error inesperado --> next(err) --> 500 JSON seguro
        |
        v
HTTP 200 + array de cursos
```

El router se monta en `app.js` antes del middleware global de errores. El middleware de cuatro argumentos se registra después de las rutas, identifica los errores del parser por sus propiedades específicas y delega los errores inesperados al manejador genérico existente. No se altera el comportamiento exitoso de las rutas previamente implementadas.

## Components and Interfaces

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/routes/habilitados.js` | Crear | Validar entrada, normalizar, deduplicar, descartar IDs desconocidos, invocar cálculo y devolver JSON. |
| `src/data/repositorio.js` | Modificar | Exportar `calcularHabilitados(aprobadosSet)` reutilizando `listar()` y la búsqueda existente. |
| `src/app.js` | Modificar | Montar el router y manejar de manera segura errores del parser y errores inesperados. |
| `tests/habilitados.test.js` | Crear | Pruebas HTTP con Jest y Supertest, incluidos los tres hallazgos de seguridad. |
| `tests/repositorio.test.js` | Ampliar | Pruebas unitarias del cálculo, si son necesarias. |
| `jest.config.js` | Conservar/verificar | Mantener el umbral global de líneas en 80%. |
| `.github/workflows/ci.yml` | Modificar | Conservar `build` y añadir jobs independientes `sca` y `secrets`. |
| `TRAZABILIDAD.md` | Completar | Registrar decisiones y evidencias reales de falla y corrección. |

### Interfaz de cálculo

```js
// src/data/repositorio.js — propuesta de diseño, no implementación ejecutada
function calcularHabilitados(aprobadosSet) {
  return listar().filter((curso) =>
    !aprobadosSet.has(curso.id) &&
    curso.prerequisites.every((id) => aprobadosSet.has(id))
  );
}
```

Precondición: `aprobadosSet` contiene únicamente códigos reconocidos del catálogo, normalizados a mayúsculas y sin duplicados. El handler debe eliminar explícitamente los desconocidos utilizando la búsqueda del repositorio, de modo que el criterio 1.5 se cumpla incluso si se introdujera una referencia curricular inconsistente. Verificar que `listar()` conserva `prerequisites` y que los códigos y requisitos reales tienen la representación prevista; reutilizar el modelo existente, no duplicar ni modificar el catálogo para forzar resultados.

### Interfaz del handler

```text
POST / (router montado en /habilitados)
1. Validar Content-Type y cuerpo.
2. Validar presencia y tipo del campo aprobados.
3. Validar longitud bruta <= 200.
4. Validar tipo y formato de cada elemento.
5. Normalizar a mayúsculas, deduplicar y descartar códigos desconocidos.
6. Invocar calcularHabilitados.
7. Responder 200 con los campos del contrato.
```

## Data Models

### Entrada

```json
{"aprobados": ["1INF25", "1INF27", "1INF49"]}
```

| Campo | Tipo | Restricción |
|---|---|---|
| `aprobados` | Array de strings | Obligatorio; máximo 200 elementos antes de deduplicar; cada código tiene entre 2 y 10 caracteres ASCII alfanuméricos. |

Formato base: `/^[A-Z0-9]{2,10}$/i`. La validación debe exigir coincidencia de la cadena completa (incluido el rechazo de saltos de línea finales, que `$` puede tolerar en JavaScript). No recortar ni corregir caracteres inválidos. Se permiten minúsculas y se convierten a mayúsculas después de validar.

### Salida (HTTP 200)

Array de objetos con `id` (string), `name` (string), `credits` (number), `cycle` (number), `type` (string) y `prerequisites` (array de strings con IDs). El resultado conserva el orden del catálogo. Los nombres, créditos, ciclos, tipos y requisitos se obtienen de `data/cursos.json`, sin inventarlos ni hardcodearlos.

## Decisiones de diseño

### 1. Lista vacía

**Comportamiento:** `{"aprobados": []}` devuelve todos y únicamente los cursos sin prerrequisitos.

**Justificación:** permite consultar la malla a un alumno que aún no ha aprobado cursos. `every()` sobre un array vacío devuelve `true`, por lo que no se necesita un caso especial.

### 2. Duplicados

**Comportamiento:** deduplicar con `Set` después de validar el tamaño bruto y el formato.

**Justificación:** aprobar un curso una vez equivale a repetir su código; deduplicar antes del límite permitiría eludir el control de tamaño (criterios 1.4 y 3.4).

### 3. Códigos inexistentes

**Comportamiento:** ignorar códigos de formato válido que no existen en el catálogo. No rechazar la solicitud por este motivo.

**Justificación:** el catálogo es una representación parcial de la malla. El alumno podría enviar códigos de otros cursos sin que deban alterar el resultado. Se descartan explícitamente para cumplir 1.5.

### 4. Mayúsculas y minúsculas

**Comportamiento:** normalizar con `toUpperCase()` después de validar formato.

**Justificación:** evita diferencias de resultado por capitalización (1.8). El diseño original informa que los IDs del catálogo están en mayúsculas; corroborarlo con el JSON real antes de implementar.

### 5. Formato de códigos

**Comportamiento:** aceptar únicamente cadenas ASCII alfanuméricas de 2 a 10 caracteres, sin espacios, etiquetas, signos ni saltos de línea. Rechazar el resto con HTTP 400 antes del cálculo.

**Justificación:** el diseño de Kiro informa que el patrón cubre los 87 cursos del catálogo; verificarlo contra el archivo real. La validación evita que valores malformados como `1INF30<script>` alcancen el cálculo. No sustituye la codificación de salida si posteriormente se renderiza contenido en HTML.

### 6. Tamaño máximo de 200 elementos

**Comportamiento:** si `aprobados.length > 200`, responder HTTP 400 inmediatamente, antes de recorrer los elementos, deduplicar o invocar el cálculo. Aceptar exactamente 200 elementos si el resto de la solicitud es válido.

**Justificación:** el límite supera el tamaño del catálogo reportado por Kiro (87 cursos), deja margen para duplicados y restringe el trabajo de validación y cálculo. Consultar `length` tiene costo constante, pero el parseo del JSON ya realizado tiene costo proporcional al cuerpo; por eso también se conserva/configura explícitamente el límite de bytes del parser en `100kb`. Si se excede ese límite, responder 413 con JSON genérico. El caso de 5000 códigos de formato válido (máximo 10 caracteres por código, con JSON compacto) cabe en ese límite y debe recibir 400 por cantidad de elementos. El límite de bytes es una protección complementaria, no una garantía absoluta contra cualquier DoS.

### 7. Orden de validación

**Comportamiento:** después del parseo, verificar `Content-Type` de forma explícita (admitir parámetros válidos como `charset=utf-8`), verificar que exista un objeto JSON con el campo `aprobados`, validar que sea array, comprobar tamaño bruto, validar cada tipo y formato, normalizar, deduplicar, descartar desconocidos y finalmente calcular.

**Justificación:** los controles baratos se ejecutan primero; ningún dato inválido llega al cálculo. Manejar `undefined`, `null`, arrays como body y otros tipos sin producir excepciones. No comparar el encabezado completo como cadena literal, pues excluiría JSON con charset válido.

### 8. JSON malformado y mensajes diferenciados

**Comportamiento:** reconocer específicamente errores del parser de Express mediante `err.type === 'entity.parse.failed'` y estado 400. Responder 400 con mensaje fijo. Reconocer `entity.too.large` con estado 413 y devolver JSON genérico. Otros errores esperados del parser (p. ej. charset/encoding no soportado) deben devolver un 4xx controlado; para Content-Type distinto de application/json, aplicar el 400 del criterio 2.1. No capturar cualquier `SyntaxError` como error de cliente.

**Justificación:** distingue un cuerpo incorrecto de un fallo interno de programación. No se devuelve `err.message`, `err.stack` ni el cuerpo recibido. Referencia técnica: https://expressjs.com/en/resources/middleware/body-parser/.

### 9. Estructura y orden de respuesta

**Comportamiento:** devolver un array directo, sin wrapper; mantener el orden de `listar()` y los campos del contrato. `prerequisites` contiene IDs, no objetos con nombres.

**Justificación:** preserva el modelo de datos y produce resultados deterministas sin un ordenamiento adicional. Los detalles con nombres siguen disponibles mediante GET `/cursos/:codigo`.

### 10. Manejo seguro de errores

**Comportamiento:** retornar mensajes de validación fijos en JSON. Los errores inesperados llegan al middleware global y se devuelven como HTTP 500 con `{"error":"error interno del servidor"}`.

**Justificación:** evita revelar rutas internas, stack traces, entrada maliciosa o detalles del servidor, conforme a 4.1–4.4. Un error inesperado de tipo `SyntaxError` también debe producir 500 si no corresponde al parser.

### 11. Uso de Set

**Comportamiento:** utilizar un `Set` de IDs normalizados y reconocidos para consultar pertenencia con `has()`.

**Justificación:** evita recorrer repetidamente el array de aprobados; las búsquedas son de costo promedio sublineal y típicamente constante. El cálculo recorre el catálogo y sus prerrequisitos. No se realizan consultas de red ni lecturas repetidas de disco durante el cálculo.

## Contrato del endpoint

### Solicitud exitosa

```http
POST /habilitados
Content-Type: application/json

{"aprobados":["1INF25","1INF27","1INF49"]}
```

**Respuesta:** HTTP 200, `Content-Type: application/json`, array de exactamente 27 cursos según el enunciado; incluye los IDs `1INF29`, `1INF30`, `1INF31` y `1INF32`. Cada objeto contiene los seis campos definidos en Data Models, con valores provenientes del catálogo. Los datos exactos de los objetos se comprobarán con el archivo real durante la implementación.

### Errores

| Caso | HTTP | Cuerpo JSON |
|---|---:|---|
| Body ausente o Content-Type incorrecto | 400 | `{"error":"se requiere un cuerpo JSON"}` |
| JSON malformado | 400 | `{"error":"cuerpo JSON inválido"}` |
| Campo ausente o no es array | 400 | `{"error":"aprobados debe ser un array"}` |
| Más de 200 elementos | 400 | `{"error":"aprobados no puede tener más de 200 elementos"}` |
| Elemento no textual | 400 | `{"error":"cada elemento de aprobados debe ser una cadena de texto"}` |
| Código malformado | 400 | `{"error":"cada código debe ser alfanumérico de entre 2 y 10 caracteres"}` |
| Cuerpo superior al límite de bytes del parser | 413 | `{"error":"cuerpo de solicitud demasiado grande"}` |
| Otro error de cliente reconocido del parser | 4xx controlado | `{"error":"cuerpo de solicitud inválido"}` |
| Error inesperado | 500 | `{"error":"error interno del servidor"}` |

Todos los mensajes son fijos y no contienen datos de entrada ni detalles internos.

## Correctness Properties

Las propiedades siguientes son invariantes de diseño que se comprobarán mediante casos deterministas y parametrizados de Jest. No se afirma que un conjunto finito de pruebas demuestre formalmente su cumplimiento para todas las entradas posibles.

| Propiedad | Invariante | Criterios |
|---|---|---|
| P1 | El resultado contiene todos y únicamente los cursos no aprobados con prerrequisitos satisfechos. | 1.1, 1.2, 1.3 |
| P2 | Duplicados no alteran el resultado si ambas solicitudes son válidas. | 1.4 |
| P3 | Códigos desconocidos de formato válido no alteran el resultado. | 1.5 |
| P4 | La capitalización no altera el resultado. | 1.8 |
| P5 | Más de 200 elementos se rechazan antes del cálculo, aunque sean duplicados. | 3.1, 3.3, 3.4 |
| P6 | Elementos no textuales se rechazan. | 2.4 |
| P7 | Códigos malformados se rechazan antes del cálculo. | 2.5, 4.1, 4.4 |
| P8 | Errores HTTP 400 y 500 no exponen detalles internos. | 4.2, 4.3 |

## Error Handling

Se aplican los estados y cuerpos definidos en el contrato del endpoint. El middleware de cuatro argumentos debe ubicarse después de los routers; Express lo invoca cuando el parser o un handler reporta un error. Si se incorporan nuevos casos al middleware compartido, se comprueba que las rutas anteriores sigan pasando sus pruebas. Se preserva el límite de recursos del parser y no se exponen detalles de excepciones en el cliente.

## Testing Strategy

### Enfoque general

- Jest y Supertest existentes; no instalar `fast-check` ni otras dependencias de testing.
- Usar `test.each` para casos de tipos, formatos, límites y normalización.
- Probar el endpoint sin arrancar un servidor público y el cálculo con los datos reales del catálogo.
- Utilizar spies/mocks restaurados después de cada prueba para demostrar que no se invoca el cálculo con entrada inválida y para provocar errores internos de forma controlada.
- Conservar todas las pruebas existentes y mantener cobertura global de líneas >= 80%.
- Los nombres siguientes son propuestos; registrar en TRAZABILIDAD.md los nombres que efectivamente se implementen.

### Matriz de pruebas

| Criterio | Prueba propuesta | Comprobación |
|---|---|---|
| 1.1 | `responde 200 con los seis campos del contrato` | HTTP 200, array, campos y tipos correctos. |
| 1.2 | `devuelve todos y solo los cursos habilitados` | Comparar IDs contra expectativa independiente del catálogo; excluir aprobados y cursos con requisitos pendientes. |
| 1.3 | `lista vacía devuelve exactamente los cursos sin requisitos` | Comparar todos los IDs esperados con los del catálogo. |
| 1.4 | `duplicados no alteran el resultado` | Comparar respuesta completa con y sin duplicados. |
| 1.5 | `códigos desconocidos no alteran el resultado` | Elegir ID de formato válido comprobado como inexistente; comparar respuestas. |
| 1.6 | `caso de referencia devuelve 27 cursos` | HTTP 200 y longitud exactamente 27. |
| 1.7 | `caso de referencia incluye los cuatro IDs esperados` | Verificar 1INF29, 1INF30, 1INF31 y 1INF32. |
| 1.8 | `normaliza minúsculas y capitalización mixta` | Misma respuesta que la entrada en mayúsculas. |
| 2.1 | `body ausente o Content-Type incorrecto responde 400` | Probar sin body y con text/plain; JSON con charset válido se acepta. |
| 2.2 | `falta el campo aprobados responde 400` | Enviar `{}`; verificar JSON con error. |
| 2.3 | `aprobados como string u otro no-array responde 400` | Probar string 1INF25, número, objeto, null y booleano. |
| 2.4 | `elementos no textuales responden 400` | Probar número, null, objeto y booleano dentro del array. |
| 2.5 | `código de formato inválido responde 400` | Probar etiquetas, espacios, saltos de línea, longitud 1 y mayor a 10. |
| 2.6 | `JSON malformado responde 400` | Enviar texto JSON truncado con Content-Type correcto. |
| 3.1 | `201 elementos se rechazan sin calcular` | HTTP 400 y spy del cálculo no invocado. |
| 3.2 | `exactamente 200 elementos válidos responde 200` | Array de 200 códigos válidos; también comprobar 199. |
| 3.3 | `5000 códigos válidos responden 400` | Array compacto de 5000 códigos; HTTP 400. |
| 3.4 | `201 duplicados se rechazan antes de deduplicar` | HTTP 400 y cálculo no invocado. |
| 4.1 | `código con script tag responde 400` | Entrada exacta del enunciado; JSON con error fijo. |
| 4.2 | `error inesperado responde 500 genérico` | Mock que lanza excepción; comparar cuerpo exacto; incluir SyntaxError interno. |
| 4.3 | `errores 400 y 500 no exponen detalles internos` | Verificar ambos estados, ausencia del mensaje interno y rutas ficticias; comparar cuerpos seguros. |
| 4.4 | `formato inválido no invoca el cálculo` | Spy del repositorio no invocado. |
| Adicional | `cuerpo mayor al límite del parser responde 413 seguro` | JSON genérico sin detalles internos. |
| 5.1 | Gate `build` | Jest con cobertura de líneas global >= 80%. |
| 5.2 | Gate `sca` | npm audit falla si detecta High/Critical. |
| 5.3 | Gate `secrets` | Gitleaks falla ante un hallazgo no exceptuado. |

### Evidencia red-green de seguridad

Antes de implementar las correcciones, escribir y ejecutar las pruebas de los tres hallazgos: 5000 códigos (3.3), código con etiqueta (2.5/4.1/4.3) y campo string (2.3). Registrar resultados reales de falla y luego de éxito; hacer commits y pushes separados por tarea. Si el endpoint todavía no existe, un 404 demuestra que la funcionalidad no está implementada, pero no demuestra la vulnerabilidad del prototipo: documentar esa diferencia. Idealmente crear primero el cálculo y una ruta base en un entorno local/aislado, probar las validaciones y corregir antes de integrar. No recrear ni publicar un endpoint deliberadamente vulnerable en main. Para los criterios adicionales, utilizar pruebas iniciales fallidas cuando sea posible y registrar honestamente si el control existente ya las satisface. No inventar fallos ni modificar tests para falsear evidencias.

## Gates de integración continua

El workflow conserva los eventos `pull_request` hacia `main` y `push` a `main`, con tres jobs independientes: `build`, `sca`, `secrets`. No emplear `continue-on-error`, `|| true` ni otros mecanismos que oculten códigos de salida. Si se cuenta con permisos, configurar los checks como requeridos y la protección de main; un job fallido por sí solo no impide un merge manual sin esa configuración.

### Gate 1: Cobertura de líneas (Quality Gate) — requisito 5.1

| Decisión | Justificación |
|---|---|
| Herramienta: Jest con `npm test -- --coverage`. | Reutiliza el framework y el gate existente; mide cobertura junto a la ejecución de las pruebas. |
| Umbral: 80% global de líneas (`coverageThreshold.global.lines: 80`). | Cumple la política de TI; debe incluir el código fuente relevante y no excluir archivos para aumentar artificialmente el porcentaje. |
| Política: bloqueante. | Si Jest reporta menos de 80% o fallan pruebas, devuelve un código no cero y el job debe fallar. |
| PR hacia main. | Detecta regresiones antes de integrar cambios. |
| Push a main. | Verifica el estado efectivo de la rama principal. |
| Alcance: código fuente cubierto por la configuración Jest existente, incluyendo el nuevo router. | Evita que la cobertura del nuevo endpoint quede fuera de la medición. |

**Evidencia:** ejecutar una comprobación controlada en una rama de prueba que reduzca efectivamente la cobertura por debajo de 80% manteniendo el umbral; guardar el run fallido, restaurar/agregar pruebas y guardar el run corregido. No bajar el umbral ni excluir archivos. El usuario ya obtuvo localmente 98.36% y 43 tests en la parte guiada; el CI inicial exitoso #1 es evidencia de referencia, pero todavía hay que recuperar su URL y comprobar sus logs. No afirmar que hubo un run rojo si solo se tiene un reporte local.

### Gate 2: SCA (Security Gate) — requisito 5.2

| Decisión | Justificación |
|---|---|
| Herramienta: `npm audit --audit-level=high`. | Usa el mecanismo de advisories del ecosistema npm sin añadir otra dependencia al proyecto. |
| Umbral: High o Critical. | Coincide con la política de TI. Los niveles Low y Moderate se reportan pero no provocan fallo por severidad. |
| Política: bloqueante. | Un código de salida no cero hace fallar el job; también se debe diagnosticar cualquier fallo de infraestructura o consulta al registro. |
| PR hacia main. | Detecta vulnerabilidades antes del merge. |
| Push a main. | Verifica el árbol de dependencias efectivamente integrado. |
| Alcance: dependencias directas, transitivas y de desarrollo del lockfile. | Cubre el árbol reproducible instalado por `npm ci`; las herramientas de desarrollo también pueden afectar el CI. No se usa `--omit=dev`. |
| Job independiente `sca` con Node.js 22, checkout e instalación `npm ci`. | Permite obtener evidencias y diagnosticar SCA aun si otro job falla. |

**Evidencia y corrección:** el resultado local compartido por el alumno detectó una vulnerabilidad High en Lodash (rango reportado <=4.17.23). Verificar la versión instalada con `npm ls lodash` y registrar los advisories realmente reportados por el run. Añadir y ejecutar primero el gate en el entorno de laboratorio aislado para detectar la dependencia existente; guardar el URL del run fallido. No desplegar el servicio vulnerable. Actualizar o reemplazar Lodash de manera dirigida, revisar cambios en `package.json` y `package-lock.json`, ejecutar `npm ci`, `npm test -- --coverage` y `npm audit --audit-level=high`. Evitar `npm audit fix --force` indiscriminado. Subir la corrección y registrar el run exitoso; no asumir que una versión concreta es segura sin verificar el resultado actualizado.

### Gate 3: Detección de secretos (Security Gate) — requisito 5.3

| Decisión | Justificación |
|---|---|
| Herramienta: Gitleaks CLI v8, con versión concreta fijada en CI y compatible con los subcomandos `git` y `dir`. | Permite definir explícitamente el alcance del escaneo, sin depender de los modos implícitos de una GitHub Action. No es SAST. |
| Umbral: cero hallazgos no exceptuados de las reglas de detección. | Cumple la política de TI para credenciales detectables. No garantiza detectar todos los secretos posibles. |
| Política: bloqueante (`--exit-code 1`). | Evita considerar exitosa una ejecución con hallazgos no justificados. Los errores de ejecución también deben fallar. |
| PR hacia main. | Escanea el estado candidato a integración y su historial alcanzable. |
| Push a main. | Revalida el estado y el historial alcanzable de la rama principal. |
| Alcance: historial alcanzable desde HEAD y archivos versionados del estado actual. | Detecta tanto secretos presentes como secretos introducidos y posteriormente borrados. No equivale a escanear ramas remotas no alcanzables ni contenido fuera del repositorio. |
| Job independiente `secrets`. | Permite distinguir los hallazgos de secretos de los fallos de SCA y cobertura. |

**Configuración propuesta:** checkout con `fetch-depth: 0`, verificar que el repositorio no sea shallow, instalar una versión concreta de Gitleaks desde su distribución oficial y verificar la integridad del artefacto cuando sea posible. Ejecutar los dos modos explícitamente; para el segundo, escanear un directorio temporal que contenga exclusivamente el contenido versionado de HEAD, obtenido con `git archive HEAD`. No incluir `.git`, `node_modules`, credenciales de CI ni archivos externos. Usar las reglas por defecto y, cuando corresponda, la configuración y `.gitleaksignore` controlados en el repositorio; aplicar el archivo de excepciones de manera coherente con los modos utilizados. No emplear exclusiones globales de archivos.

```bash
# Comandos de referencia; adaptar las rutas del directorio temporal al workflow.
gitleaks git --log-opts="HEAD" --redact --exit-code 1 .
gitleaks dir --redact --exit-code 1 "$TRACKED_SNAPSHOT"
```

`TRACKED_SNAPSHOT` se define durante el job como la ruta del snapshot de HEAD. Validar la configuración y el alcance en los logs de CI. En PR se examina el commit seleccionado por checkout (normalmente el merge de prueba); en push, el commit de main. Referencia técnica: https://github.com/gitleaks/gitleaks.

**Evidencia y corrección:** ejecutar primero el escáner sin exclusiones nuevas. Inspeccionar los hallazgos con logs redactados, incluidos los posibles hallazgos en `config/ejemplo.env`. Si se necesita una prueba controlada, utilizar exclusivamente una cadena ficticia no operativa en una rama de prueba; no usar credenciales reales ni publicar el valor en TRAZABILIDAD.md. Registrar el run rojo y el diagnóstico. Retirar el fixture; como el escaneo incluye historial, borrarlo en un commit posterior puede no bastar. Preferir desechar la rama de prueba y usar un historial limpio para la ejecución corregida; si es necesario mantener la rama, documentar el hallazgo exacto y una excepción específica solo para un fixture demostrado ficticio, o para una clave real previamente revocada/rotada conforme a la rúbrica. Nunca exceptuar secretos activos ni deshabilitar reglas completas para conseguir verde. Si el modo de escaneo impide obtener un run rojo/verde, explicar la causa y los resultados reales, como permite el enunciado.

## Estrategia de trazabilidad y entrega

Registrar cada criterio no funcional de los requisitos 2–5, incluyendo su prueba o gate, condición, política, etapa, evidencia fallida (URL o nombre real de test ejecutado antes de la corrección) y evidencia corregida (URL o resultado real identificable). No dejar una evidencia ficticia ni presentar un run de referencia anterior como prueba del endpoint nuevo. Para pruebas que ya pasan por controles preexistentes, indicar ese hecho y, si procede, verificar su sensibilidad en un entorno aislado sin introducir una regresión en main.

Registrar al menos dos cambios concretos realizados a la propuesta de Kiro. Ejemplos basados en las versiones originales y corregidas de requirements.md: (1) criterio 3.2, reemplazo de “límites normales de respuesta sin degradación observable” por el caso verificable de exactamente 200 elementos; (2) criterio 5.2, reemplazo de una declaración general de ausencia de vulnerabilidades por una condición de fallo del pipeline ante High/Critical. Confirmar que ambos cambios están efectivamente en los documentos versionados y explicar su justificación.

Ejecutar una tarea a la vez, con commit y push después de cada fase del spec y de cada tarea. El último run de main debe mostrar `build`, `sca` y `secrets` exitosos. La evidencia de los runs fallidos y corregidos se incorpora a TRAZABILIDAD.md. SAST es un gate adicional opcional separado de Gitleaks; no forma parte de los tres gates obligatorios definidos aquí.
