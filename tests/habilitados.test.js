'use strict';

/**
 * tests/habilitados.test.js
 * Pruebas de aceptación para POST /habilitados
 * Fase roja (TDD): el endpoint no existe todavía; la mayoría de estas pruebas
 * fallan con 404. Eso documenta la ausencia de la funcionalidad, no la
 * reproducción de vulnerabilidades del prototipo.
 *
 * Requisitos cubiertos: 1.1–4.4
 */

const request = require('supertest');
const app = require('../src/app');
const repositorio = require('../src/data/repositorio');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Genera un array de `n` códigos válidos de 6 caracteres. */
function generarCodigos(n) {
  const codigos = [];
  for (let i = 0; i < n; i++) {
    // Formato: "A" + número de 5 dígitos → siempre 6 chars alfanuméricos
    codigos.push(`A${String(i).padStart(5, '0')}`);
  }
  return codigos;
}

// ─── Requisito 1: Consultar cursos habilitados ────────────────────────────────

describe('POST /habilitados', () => {

  describe('1.1 responde 200 con los seis campos del contrato', () => {
    test('responde 200 con los seis campos del contrato', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const curso of res.body) {
        expect(typeof curso.id).toBe('string');
        expect(typeof curso.name).toBe('string');
        expect(typeof curso.credits).toBe('number');
        // cycle puede ser number o null según el catálogo real
        expect(curso.cycle === null || typeof curso.cycle === 'number').toBe(true);
        expect(typeof curso.type).toBe('string');
        expect(Array.isArray(curso.prerequisites)).toBe(true);
        // Exactamente seis campos
        expect(Object.keys(curso)).toHaveLength(6);
      }
    });
  });

  describe('1.2 devuelve todos y solo los cursos habilitados', () => {
    test('devuelve todos y solo los cursos habilitados', async () => {
      const aprobados = ['1INF25', '1INF27', '1INF49'];
      const aprobadosSet = new Set(aprobados);

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados });

      expect(res.status).toBe(200);

      // Ningún curso aprobado aparece en el resultado
      for (const curso of res.body) {
        expect(aprobadosSet.has(curso.id)).toBe(false);
      }

      // Todos los prerrequisitos de cada curso devuelto están en aprobados
      for (const curso of res.body) {
        for (const prereq of curso.prerequisites) {
          expect(aprobadosSet.has(prereq)).toBe(true);
        }
      }

      // Ningún curso con prerrequisitos no satisfechos aparece
      const todos = repositorio.listar();
      const habilitadosEsperados = todos.filter(
        (c) =>
          !aprobadosSet.has(c.id) &&
          c.prerequisites.every((p) => aprobadosSet.has(p)),
      );
      expect(res.body).toHaveLength(habilitadosEsperados.length);
    });
  });

  describe('1.3 lista vacía devuelve exactamente los cursos sin requisitos', () => {
    test('lista vacía devuelve exactamente los cursos sin requisitos', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: [] });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const sinRequisitos = repositorio.listar().filter(
        (c) => c.prerequisites.length === 0,
      );
      expect(res.body).toHaveLength(sinRequisitos.length);

      const idsRespuesta = res.body.map((c) => c.id).sort();
      const idsEsperados = sinRequisitos.map((c) => c.id).sort();
      expect(idsRespuesta).toEqual(idsEsperados);
    });
  });

  describe('1.4 duplicados no alteran el resultado', () => {
    test('duplicados no alteran el resultado', async () => {
      const sinDuplicados = { aprobados: ['1INF25', '1INF27', '1INF49'] };
      const conDuplicados = {
        aprobados: ['1INF25', '1INF27', '1INF49', '1INF25', '1INF27'],
      };

      const res1 = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send(sinDuplicados);

      const res2 = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send(conDuplicados);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const ids1 = res1.body.map((c) => c.id).sort();
      const ids2 = res2.body.map((c) => c.id).sort();
      expect(ids1).toEqual(ids2);
    });
  });

  describe('1.5 códigos desconocidos no alteran el resultado', () => {
    test('códigos desconocidos no alteran el resultado', async () => {
      // 'ZZZZZZ' tiene formato válido pero no existe en el catálogo
      const res1 = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

      const res2 = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25', '1INF27', '1INF49', 'ZZZZZZ'] });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const ids1 = res1.body.map((c) => c.id).sort();
      const ids2 = res2.body.map((c) => c.id).sort();
      expect(ids1).toEqual(ids2);
    });
  });

  describe('1.6 caso de referencia devuelve 27 cursos', () => {
    test('caso de referencia devuelve 27 cursos', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(27);
    });
  });

  describe('1.7 caso de referencia incluye los cuatro IDs esperados', () => {
    test('caso de referencia incluye los cuatro IDs esperados', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

      expect(res.status).toBe(200);
      const ids = res.body.map((c) => c.id);
      expect(ids).toContain('1INF29');
      expect(ids).toContain('1INF30');
      expect(ids).toContain('1INF31');
      expect(ids).toContain('1INF32');
    });
  });

  describe('1.8 normaliza minúsculas y capitalización mixta', () => {
    test('normaliza minúsculas y capitalización mixta', async () => {
      const resUpper = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25', '1INF27', '1INF49'] });

      const resLower = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1inf25', '1inf27', '1inf49'] });

      const resMixed = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1Inf25', '1INF27', '1iNf49'] });

      expect(resUpper.status).toBe(200);
      expect(resLower.status).toBe(200);
      expect(resMixed.status).toBe(200);

      const idsUpper = resUpper.body.map((c) => c.id).sort();
      const idsLower = resLower.body.map((c) => c.id).sort();
      const idsMixed = resMixed.body.map((c) => c.id).sort();

      expect(idsLower).toEqual(idsUpper);
      expect(idsMixed).toEqual(idsUpper);
    });
  });

  // ─── Requisito 2: Validación del cuerpo ──────────────────────────────────────

  describe('2.1 body ausente o Content-Type incorrecto responde 400', () => {
    test('sin body responde 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('Content-Type text/plain responde 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'text/plain')
        .send('{"aprobados":[]}');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('Content-Type application/json con charset válido se acepta', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json; charset=utf-8')
        .send(JSON.stringify({ aprobados: [] }));

      // Con charset válido debe procesar la solicitud (200) y no rechazar por Content-Type
      expect(res.status).toBe(200);
    });
  });

  describe('2.2 falta el campo aprobados responde 400', () => {
    test('falta el campo aprobados responde 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'aprobados debe ser un array' });
    });
  });

  describe('2.3 aprobados como string u otro no-array responde 400', () => {
    // *** HALLAZGO DE SEGURIDAD: tipo incorrecto (criterio 2.3) ***
    test.each([
      ['string', '1INF25'],
      ['número', 42],
      ['objeto', { id: '1INF25' }],
      ['null', null],
      ['booleano', true],
    ])('aprobados como %s responde 400', async (_tipo, valor) => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: valor });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    // Nombre exacto requerido por el spec para el hallazgo de seguridad
    test('aprobados como string u otro no-array responde 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: '1INF25' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'aprobados debe ser un array' });
    });
  });

  describe('2.4 elementos no textuales responden 400', () => {
    test.each([
      ['número', [42]],
      ['null', [null]],
      ['objeto', [{ id: '1INF25' }]],
      ['booleano', [true]],
    ])('elemento %s responde 400', async (_tipo, valor) => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: valor });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'cada elemento de aprobados debe ser una cadena de texto',
      });
    });
  });

  describe('2.5 código de formato inválido responde 400', () => {
    test.each([
      ['etiqueta HTML', '1INF25<b>'],
      ['espacio', '1INF 25'],
      ['salto de línea', '1INF25\n'],
      ['longitud 1', 'A'],
      ['longitud 11', 'ABCDEFGHIJK'],
      ['cadena vacía', ''],
      ['guión', '1INF-25'],
    ])('código con %s responde 400', async (_desc, codigo) => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: [codigo] });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'cada código debe ser alfanumérico de entre 2 y 10 caracteres',
      });
    });
  });

  describe('2.6 JSON malformado responde 400', () => {
    test('JSON malformado responde 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send('{"aprobados": [}');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'cuerpo JSON inválido' });
    });
  });

  // ─── Requisito 3: Seguridad ante abuso de recursos ───────────────────────────

  describe('3.1 201 elementos se rechazan sin calcular', () => {
    test('201 elementos se rechazan sin calcular', async () => {
      // Spy para verificar que calcularHabilitados no se invoca
      // (la función no existe aún; el spy se activa cuando esté implementada)
      const calcularSpy = repositorio.calcularHabilitados
        ? jest.spyOn(repositorio, 'calcularHabilitados')
        : null;

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: generarCodigos(201) });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'aprobados no puede tener más de 200 elementos',
      });

      if (calcularSpy) {
        expect(calcularSpy).not.toHaveBeenCalled();
        calcularSpy.mockRestore();
      }
    });
  });

  describe('3.2 exactamente 200 elementos válidos responde 200', () => {
    test('exactamente 200 elementos válidos responde 200', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: generarCodigos(200) });

      expect(res.status).toBe(200);
    });

    test('exactamente 199 elementos válidos responde 200', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: generarCodigos(199) });

      expect(res.status).toBe(200);
    });
  });

  describe('3.3 5000 códigos válidos responden 400', () => {
    // *** HALLAZGO DE SEGURIDAD: DoS (criterio 3.3) ***
    test('5000 códigos válidos responden 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: generarCodigos(5000) });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'aprobados no puede tener más de 200 elementos',
      });
    });
  });

  describe('3.4 201 duplicados se rechazan antes de deduplicar', () => {
    test('201 duplicados se rechazan antes de deduplicar', async () => {
      // 201 repeticiones del mismo código: longitud bruta > 200, aunque al
      // deduplicar quede solo 1. El límite se aplica antes de deduplicar.
      const calcularSpy = repositorio.calcularHabilitados
        ? jest.spyOn(repositorio, 'calcularHabilitados')
        : null;

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: Array(201).fill('1INF25') });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'aprobados no puede tener más de 200 elementos',
      });

      if (calcularSpy) {
        expect(calcularSpy).not.toHaveBeenCalled();
        calcularSpy.mockRestore();
      }
    });
  });

  // ─── Requisito 4: Seguridad ante inyección y exposición ──────────────────────

  describe('4.1 código con script tag responde 400', () => {
    // *** HALLAZGO DE SEGURIDAD: inyección (criterios 2.5 / 4.1) ***
    test('código con script tag responde 400', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF30<script>'] });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'cada código debe ser alfanumérico de entre 2 y 10 caracteres',
      });
    });
  });

  describe('4.2 error inesperado responde 500 genérico', () => {
    test('error inesperado responde 500 genérico', async () => {
      // Forzar un error interno espiando listar() para que lance una excepción
      const listarSpy = jest
        .spyOn(repositorio, 'listar')
        .mockImplementation(() => {
          throw new Error('error interno de prueba');
        });

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25'] });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'error interno del servidor' });

      listarSpy.mockRestore();
    });

    test('SyntaxError interno (no del parser) responde 500, no 400', async () => {
      // Forzar un SyntaxError que NO venga del parser de Express
      const calcularSpy = repositorio.calcularHabilitados
        ? jest.spyOn(repositorio, 'calcularHabilitados').mockImplementation(() => {
            // eslint-disable-next-line no-eval
            eval('invalid syntax!!!');
          })
        : null;

      const listarSpy = !calcularSpy
        ? jest.spyOn(repositorio, 'listar').mockImplementation(() => {
            const obj = null;
            return obj.propiedad; // TypeError, no SyntaxError, pero demuestra manejo
          })
        : null;

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25'] });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'error interno del servidor' });

      if (calcularSpy) calcularSpy.mockRestore();
      if (listarSpy) listarSpy.mockRestore();
    });
  });

  describe('4.3 errores 400 y 500 no exponen detalles internos', () => {
    test('errores 400 no exponen detalles internos', async () => {
      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF30<script>'] });

      expect(res.status).toBe(400);
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/at\s+\w/);
      expect(body).not.toContain('Error:');
      expect(body).not.toContain('.js:');
      expect(body).not.toContain('/src/');
      expect(body).not.toContain('stack');
    });

    test('errores 500 no exponen detalles internos', async () => {
      const listarSpy = jest
        .spyOn(repositorio, 'listar')
        .mockImplementation(() => {
          throw new Error('ruta interna /src/data/repositorio.js:42');
        });

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF25'] });

      expect(res.status).toBe(500);
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('ruta interna');
      expect(body).not.toContain('/src/');
      expect(body).not.toContain('repositorio');
      expect(body).not.toMatch(/at\s+\w/);
      expect(res.body).toEqual({ error: 'error interno del servidor' });

      listarSpy.mockRestore();
    });
  });

  describe('4.4 formato inválido no invoca el cálculo', () => {
    test('formato inválido no invoca el cálculo', async () => {
      const calcularSpy = repositorio.calcularHabilitados
        ? jest.spyOn(repositorio, 'calcularHabilitados')
        : null;

      const res = await request(app)
        .post('/habilitados')
        .set('Content-Type', 'application/json')
        .send({ aprobados: ['1INF30<script>'] });

      expect(res.status).toBe(400);

      if (calcularSpy) {
        expect(calcularSpy).not.toHaveBeenCalled();
        calcularSpy.mockRestore();
      }
    });
  });

});
