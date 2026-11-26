# Requirements Document

## Introduction

Funcionalidad para consultar qué cursos puede matricular un alumno dado el conjunto de cursos que ya aprobó. Un curso está habilitado cuando el alumno no lo ha aprobado aún y todos sus prerrequisitos están dentro del conjunto de cursos aprobados. El endpoint recibe la lista de cursos aprobados y devuelve el listado completo de cursos habilitados con todos sus campos.

## Glossary

- **Sistema**: el servicio web Malla INF (Express sobre Node.js).
- **Repositorio**: el módulo `src/data/repositorio.js` que carga y consulta `data/cursos.json`.
- **Curso habilitado**: curso no aprobado cuyos prerrequisitos están todos incluidos en `aprobados`.
- **aprobados**: lista de códigos de cursos que el alumno ya aprobó, recibida en el cuerpo de la solicitud.
- **Código de curso**: cadena alfanumérica de entre 2 y 10 caracteres que identifica de forma única a un curso en el Repositorio.
- **Pipeline**: flujo de integración continua ejecutado mediante GitHub Actions.
- **Quality Gate**: control automatizado que verifica el cumplimiento de los requisitos de calidad.
- **Security Gate**: control automatizado que verifica el cumplimiento de los requisitos de seguridad.

## Requirements

### Requisito 1: Consultar cursos habilitados

**Historia de usuario:** Como alumno, quiero enviar la lista de cursos que aprobé y obtener los cursos que puedo matricular, para planificar mi matrícula del próximo ciclo.

#### Criterios de aceptación

1.1 CUANDO se envíe `POST /habilitados` con un cuerpo JSON que cumpla todos los requisitos de validación, EL Sistema DEBE responder HTTP 200 con un array de objetos que representen los cursos habilitados, incluyendo los campos `id`, `name`, `credits`, `cycle`, `type` y `prerequisites` de cada uno.

1.2 CUANDO `aprobados` sea un array no vacío de códigos válidos, EL Sistema DEBE devolver todos y únicamente los cursos que no estén incluidos en `aprobados` y cuyos prerrequisitos estén completamente incluidos en el conjunto de cursos aprobados.

1.3 CUANDO `aprobados` sea un array vacío `[]`, EL Sistema DEBE devolver todos y únicamente los cursos cuyo campo `prerequisites` sea un array vacío.

1.4 CUANDO `aprobados` contenga códigos duplicados, EL Sistema DEBE devolver un resultado idéntico al obtenido con la misma lista sin duplicados, siempre que ambas solicitudes cumplan el límite máximo de elementos.

1.5 CUANDO `aprobados` contenga códigos con formato válido que no existan en el Repositorio, EL Sistema DEBE ignorar dichos códigos y continuar la evaluación con los códigos reconocidos.

1.6 CUANDO se solicite `POST /habilitados` con el cuerpo `{"aprobados": ["1INF25", "1INF27", "1INF49"]}`, EL Sistema DEBE devolver exactamente 27 cursos habilitados.

1.7 CUANDO se solicite `POST /habilitados` con el cuerpo `{"aprobados": ["1INF25", "1INF27", "1INF49"]}`, EL Sistema DEBE incluir los cursos `1INF29`, `1INF30`, `1INF31` y `1INF32` en la respuesta.

1.8 CUANDO se envíen códigos de cursos en minúsculas o con una combinación de mayúsculas y minúsculas, EL Sistema DEBE devolver el mismo resultado que si dichos códigos se hubieran enviado en mayúsculas.

### Requisito 2: Validación del cuerpo de la solicitud

**Historia de usuario:** Como alumno, quiero recibir un error claro cuando envíe una solicitud malformada, para corregirla antes de reintentar.

#### Criterios de aceptación

2.1 SI el cuerpo de la solicitud está ausente o el tipo de contenido de la solicitud no corresponde a `application/json`, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error` con un mensaje de texto.

2.2 SI el cuerpo de la solicitud es un JSON válido pero no contiene el campo `aprobados`, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`.

2.3 SI el campo `aprobados` no es un array JSON, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`.

2.4 SI algún elemento del array `aprobados` no es una cadena de texto, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`.

2.5 SI algún elemento del array `aprobados` no cumple el patrón alfanumérico de entre 2 y 10 caracteres (`/^[A-Z0-9]{2,10}$/i`), EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`.

2.6 SI el cuerpo de la solicitud contiene JSON sintácticamente inválido, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`.

### Requisito 3: Seguridad ante abuso de recursos (DoS)

**Historia de usuario:** Como operador del servicio, quiero que el endpoint rechace solicitudes con listas excesivamente grandes, para mantener el servicio disponible ante solicitudes abusivas.

#### Criterios de aceptación

3.1 SI el array `aprobados` contiene más de 200 elementos, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`, sin ejecutar la lógica de cálculo de cursos habilitados.

3.2 CUANDO el array `aprobados` contenga exactamente 200 elementos con códigos de formato válido y la solicitud cumpla los demás requisitos de validación, EL Sistema DEBE responder HTTP 200.

3.3 SI se solicita `POST /habilitados` con un array `aprobados` de 5000 elementos con códigos de formato válido, EL Sistema DEBE responder HTTP 400.

3.4 SI el array `aprobados` contiene más de 200 elementos, incluyendo códigos duplicados, EL Sistema DEBE rechazar la solicitud antes de realizar la deduplicación.

### Requisito 4: Seguridad ante inyección y exposición de información

**Historia de usuario:** Como operador del servicio, quiero que el endpoint valide los valores de entrada y evite exponer detalles internos, para proteger el servicio ante entradas maliciosas y errores inesperados.

#### Criterios de aceptación

4.1 SI se solicita `POST /habilitados` con el cuerpo `{"aprobados": ["1INF30<script>"]}`, EL Sistema DEBE responder HTTP 400 con un objeto JSON que contenga el campo `error`.

4.2 SI ocurre un error no controlado durante el procesamiento de la solicitud, EL Sistema DEBE responder HTTP 500 con el cuerpo JSON `{"error": "error interno del servidor"}`.

4.3 CUANDO el endpoint `POST /habilitados` responda con un código HTTP 400 o 500, EL Sistema NO DEBE incluir stack traces ni rutas internas del servidor en el cuerpo de la respuesta.

4.4 SI una solicitud contiene un código que no cumple el formato permitido, EL Sistema DEBE rechazar la solicitud antes de ejecutar la lógica de cálculo de cursos habilitados.

### Requisito 5: Calidad y seguridad del proceso de integración continua

**Historia de usuario:** Como responsable técnico del servicio, quiero que el pipeline verifique automáticamente las políticas de calidad y seguridad, para prevenir la integración de cambios que incumplan las políticas de TI.

#### Criterios de aceptación

5.1 SI la cobertura global de líneas del proyecto es inferior al 80%, EL Pipeline DEBE fallar.

5.2 SI se detecta al menos una vulnerabilidad de severidad alta o crítica en las dependencias del proyecto, EL Pipeline DEBE fallar.

5.3 SI el escáner de secretos detecta al menos un secreto, credencial o token que no cuente con una excepción documentada y justificada, EL Pipeline DEBE fallar.