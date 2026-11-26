# Plan de implementación: Consulta de cursos

- [ ] 1. Implementar `GET /cursos` con filtro por ciclo
  - Crear la ruta en `src/routes/cursos.js` usando `src/data/repositorio.js`
  - Montar el router en `src/app.js`
  - Tests con supertest para 1.1, 1.2 y 1.3
  - _Requisitos: 1.1, 1.2, 1.3_

- [ ] 2. Implementar `GET /cursos/:codigo`
  - Resolver el nombre de cada requisito con el repositorio
  - Tests para 2.1 y 2.2
  - _Requisitos: 2.1, 2.2_

- [ ] 3. Middleware de manejo de errores
  - Respuesta genérica para errores no controlados
  - Evitar exposición de stack traces y rutas internas
  - Tests para errores no controlados
  - _Requisitos: 3.1, 3.2_

- [ ] 4. Configurar Quality Gate de cobertura
  - Configurar umbral global de líneas de 80% en Jest
  - Ejecutar cobertura en el pipeline de GitHub Actions
  - _Requisitos: 3.3_
