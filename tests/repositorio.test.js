const repositorio = require('../src/data/repositorio');

describe('repositorio de cursos', () => {
  describe('listar()', () => {
    test('devuelve los 87 cursos de la malla', () => {
      expect(repositorio.listar()).toHaveLength(87);
    });

    test('cada curso tiene los campos del modelo de datos', () => {
      for (const curso of repositorio.listar()) {
        expect(curso).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            credits: expect.any(Number),
            type: expect.stringMatching(/^(obligatorio|electivo)$/),
            prerequisites: expect.any(Array),
          }),
        );
      }
    });
  });

  describe('listarPorCiclo(ciclo)', () => {
    test('el ciclo 10 tiene 3 cursos', () => {
      const cursos = repositorio.listarPorCiclo(10);

      expect(cursos).toHaveLength(3);
      expect(cursos.every((curso) => curso.cycle === 10)).toBe(true);
    });

    test('devuelve un arreglo vacío para un ciclo sin cursos', () => {
      expect(repositorio.listarPorCiclo(4)).toEqual([]);
    });
  });

  describe('obtener(codigo)', () => {
    test('devuelve 1INF30 con su requisito 1INF25', () => {
      const curso = repositorio.obtener('1INF30');

      expect(curso.name).toBe('Programación 3');
      expect(curso.cycle).toBe(6);
      expect(curso.prerequisites).toEqual(['1INF25']);
    });

    test('devuelve undefined si el código no existe', () => {
      expect(repositorio.obtener('XXX999')).toBeUndefined();
    });
  });

  describe('calcularHabilitados(aprobadosSet)', () => {
    test('lista vacía devuelve solo los cursos sin prerrequisitos', () => {
      const resultado = repositorio.calcularHabilitados(new Set());
      const sinRequisitos = repositorio
        .listar()
        .filter((c) => c.prerequisites.length === 0);

      expect(resultado).toHaveLength(sinRequisitos.length);
      expect(resultado.map((c) => c.id).sort()).toEqual(
        sinRequisitos.map((c) => c.id).sort(),
      );
    });

    test('caso de referencia devuelve exactamente 27 cursos', () => {
      const aprobadosSet = new Set(['1INF25', '1INF27', '1INF49']);
      const resultado = repositorio.calcularHabilitados(aprobadosSet);

      expect(resultado).toHaveLength(27);
    });

    test('caso de referencia incluye los cuatro IDs esperados', () => {
      const aprobadosSet = new Set(['1INF25', '1INF27', '1INF49']);
      const ids = repositorio.calcularHabilitados(aprobadosSet).map((c) => c.id);

      expect(ids).toContain('1INF29');
      expect(ids).toContain('1INF30');
      expect(ids).toContain('1INF31');
      expect(ids).toContain('1INF32');
    });

    test('cursos ya aprobados no aparecen en el resultado', () => {
      const aprobadosSet = new Set(['1INF25', '1INF27', '1INF49']);
      const ids = repositorio.calcularHabilitados(aprobadosSet).map((c) => c.id);

      expect(ids).not.toContain('1INF25');
      expect(ids).not.toContain('1INF27');
      expect(ids).not.toContain('1INF49');
    });

    test('curso con prerrequisitos parcialmente satisfechos no aparece', () => {
      // 1INF32 requiere ['1INF27', '1INF25']; con solo 1INF25 no debe habilitarse.
      const aprobadosSet = new Set(['1INF25']);
      const ids = repositorio.calcularHabilitados(aprobadosSet).map((c) => c.id);

      expect(ids).not.toContain('1INF32');
    });
  });
});
