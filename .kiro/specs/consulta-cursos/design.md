# Diseño: Consulta de cursos

## Visión general

API REST de solo lectura sobre los datos de `data/cursos.json`, cargados en memoria al iniciar.

## Componentes

| Componente | Responsabilidad |
| --- | --- |
| `src/data/repositorio.js` | Carga el JSON una vez y expone `listar()`, `listarPorCiclo(ciclo)` y `obtener(codigo)`. Usa un `Map` por código. |
| `src/routes/cursos.js` | Define `GET /cursos` y `GET /cursos/:codigo`. Valida parámetros y traduce resultados a respuestas HTTP. |
| `src/app.js` | Crea la app Express, sirve `public/` y monta el router en `/cursos`. |

## Contratos

`GET /cursos` y `GET /cursos?ciclo=N` → `200` con un arreglo de cursos:

```json
[{ "id": "1INF30", "name": "Programación 3", "credits": 5.0, "cycle": 6, "type": "obligatorio" }]
```

`GET /cursos/:codigo` → `200`:

```json
{
  "id": "1INF30",
  "name": "Programación 3",
  "credits": 5.0,
  "cycle": 6,
  "type": "obligatorio",
  "prerequisites": [{ "id": "1INF25", "name": "Programación 2" }]
}
```

## Manejo de errores

| Caso | Respuesta |
| --- | --- |
| `ciclo` inválido | `400 { "error": "ciclo debe ser un entero entre 5 y 10" }` |
| Código inexistente | `404 { "error": "curso no encontrado" }` |
| Error no controlado | `500 { "error": "error interno del servidor" }`, sin stack trace ni rutas internas |

## Estrategia de pruebas

- Tests de rutas con supertest, uno o más por criterio de aceptación.
- Tests de `repositorio.js` con los datos reales de `data/cursos.json`.

## Quality Gate: Cobertura de pruebas

- Herramienta: Jest Coverage.
- Umbral: cobertura global de líneas de al menos 80%.
- Política: bloqueante.
- Etapa: pull requests hacia main y pushes a main.
- Justificación: detectar cambios que reduzcan la cobertura
  por debajo del mínimo establecido y prevenir la integración
  de código insuficientemente probado.
