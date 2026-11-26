const request = require('supertest');
const app = require('../src/app');

describe('GET /cursos', () => {
  // Requisito 1.1 – devuelve todos los cursos con los campos requeridos
  describe('1.1 sin filtro', () => {
    test('responde 200 con un arreglo de 87 cursos', async () => {
      const res = await request(app).get('/cursos');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(87);
    });

    test('cada curso contiene id, name, credits, cycle y type', async () => {
      const res = await request(app).get('/cursos');

      for (const curso of res.body) {
        expect(curso).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            credits: expect.any(Number),
            type: expect.stringMatching(/^(obligatorio|electivo)$/),
          }),
        );
        expect(Object.prototype.hasOwnProperty.call(curso, 'cycle')).toBe(true);
      }
    });

    test('la respuesta NO incluye el campo prerequisites', async () => {
      const res = await request(app).get('/cursos');

      for (const curso of res.body) {
        expect(curso).not.toHaveProperty('prerequisites');
      }
    });
  });

  // Requisito 1.2 – filtra por ciclo válido (5–10)
  describe('1.2 filtro por ciclo válido', () => {
    test('?ciclo=6 devuelve solo los cursos del ciclo 6', async () => {
      const res = await request(app).get('/cursos?ciclo=6');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every((c) => c.cycle === 6)).toBe(true);
    });

    test('?ciclo=5 devuelve exactamente los cursos del ciclo 5', async () => {
      const res = await request(app).get('/cursos?ciclo=5');

      expect(res.status).toBe(200);
      expect(res.body.every((c) => c.cycle === 5)).toBe(true);
    });

    test('?ciclo=10 devuelve exactamente 3 cursos', async () => {
      const res = await request(app).get('/cursos?ciclo=10');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });
  });

  // Requisito 1.3 – ciclo inválido → 400
  describe('1.3 ciclo inválido → 400', () => {
    test('?ciclo=4 (fuera de rango) responde 400', async () => {
      const res = await request(app).get('/cursos?ciclo=4');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
    });

    test('?ciclo=11 (fuera de rango) responde 400', async () => {
      const res = await request(app).get('/cursos?ciclo=11');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
    });

    test('?ciclo=abc (no numérico) responde 400', async () => {
      const res = await request(app).get('/cursos?ciclo=abc');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
    });

    test('?ciclo=6.5 (decimal) responde 400', async () => {
      const res = await request(app).get('/cursos?ciclo=6.5');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
    });
  });
});

describe('GET /cursos/:codigo', () => {
  // Requisito 2.1 – devuelve el curso con sus requisitos resueltos
  describe('2.1 código existente', () => {
    test('responde 200 con id, name, credits, cycle, type y prerequisites', async () => {
      const res = await request(app).get('/cursos/1INF30');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: '1INF30',
        name: 'Programación 3',
        credits: 5.0,
        cycle: 6,
        type: 'obligatorio',
      });
      expect(Array.isArray(res.body.prerequisites)).toBe(true);
    });

    test('los prerequisitos incluyen id y name de cada curso requerido', async () => {
      const res = await request(app).get('/cursos/1INF30');

      expect(res.body.prerequisites).toEqual([{ id: '1INF25', name: 'Programación 2' }]);
    });

    test('curso sin prerequisitos devuelve prerequisites vacío', async () => {
      const res = await request(app).get('/cursos/1INF25');

      expect(res.status).toBe(200);
      expect(res.body.prerequisites).toEqual([]);
    });

    test('curso con múltiples prerequisitos los resuelve todos', async () => {
      // 1INF32 requiere 1INF27 y 1INF25
      const res = await request(app).get('/cursos/1INF32');

      expect(res.status).toBe(200);
      expect(res.body.prerequisites).toHaveLength(2);
      expect(res.body.prerequisites).toEqual(
        expect.arrayContaining([
          { id: '1INF27', name: 'Algoritmia y Estructura de Datos' },
          { id: '1INF25', name: 'Programación 2' },
        ]),
      );
    });
  });

  // Requisito 2.2 – código inexistente → 404
  describe('2.2 código inexistente → 404', () => {
    test('responde 404 con mensaje de error', async () => {
      const res = await request(app).get('/cursos/NOEXISTE');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'curso no encontrado' });
    });

    test('código con formato válido pero no registrado también devuelve 404', async () => {
      const res = await request(app).get('/cursos/9INF99');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'curso no encontrado' });
    });
  });
});
