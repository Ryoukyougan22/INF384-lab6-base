const {
  formatearNombre,
  formatearCreditos,
  formatearCiclo,
  formatearTipo,
  resumenCurso,
  totalCreditos,
  agruparPorCiclo,
  ordenarPorCreditos,
  listaRequisitos,
} = require('../src/util/formato');

describe('formatearNombre', () => {
  test('capitaliza la primera letra de cada palabra', () => {
    expect(formatearNombre('programación avanzada')).toBe('Programación Avanzada');
  });

  test('normaliza mayúsculas en la entrada', () => {
    expect(formatearNombre('CÁLCULO DIFERENCIAL')).toBe('Cálculo Diferencial');
  });
});

describe('formatearCreditos', () => {
  test('formatea un número con un decimal', () => {
    expect(formatearCreditos(5)).toBe('5.0 créditos');
  });

  test('mantiene decimales existentes', () => {
    expect(formatearCreditos(3.5)).toBe('3.5 créditos');
  });
});

describe('formatearCiclo', () => {
  test('devuelve "Ciclo N" para un número de ciclo', () => {
    expect(formatearCiclo(6)).toBe('Ciclo 6');
  });

  test('devuelve "Electivo" cuando el ciclo es null', () => {
    expect(formatearCiclo(null)).toBe('Electivo');
  });

  test('devuelve "Electivo" cuando el ciclo es undefined', () => {
    expect(formatearCiclo(undefined)).toBe('Electivo');
  });
});

describe('formatearTipo', () => {
  test('devuelve "Obligatorio" para tipo obligatorio', () => {
    expect(formatearTipo('obligatorio')).toBe('Obligatorio');
  });

  test('devuelve "Electivo" para cualquier otro tipo', () => {
    expect(formatearTipo('electivo')).toBe('Electivo');
    expect(formatearTipo('otro')).toBe('Electivo');
  });
});

describe('resumenCurso', () => {
  test('combina id, nombre y créditos', () => {
    const curso = { id: '1INF30', name: 'Programación 3', credits: 5 };
    expect(resumenCurso(curso)).toBe('1INF30 · Programación 3 · 5.0 créditos');
  });
});

describe('totalCreditos', () => {
  test('suma los créditos de todos los cursos', () => {
    const cursos = [{ credits: 5 }, { credits: 3 }, { credits: 4 }];
    expect(totalCreditos(cursos)).toBe(12);
  });

  test('devuelve 0 para un arreglo vacío', () => {
    expect(totalCreditos([])).toBe(0);
  });
});

describe('agruparPorCiclo', () => {
  test('agrupa cursos por su ciclo formateado', () => {
    const cursos = [
      { id: 'A', cycle: 5, credits: 3 },
      { id: 'B', cycle: 6, credits: 4 },
      { id: 'C', cycle: 5, credits: 2 },
    ];
    const result = agruparPorCiclo(cursos);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['Ciclo 5', 'Ciclo 6']));
    expect(result['Ciclo 5']).toHaveLength(2);
    expect(result['Ciclo 6']).toHaveLength(1);
  });

  test('cursos sin ciclo se agrupan como "Electivo"', () => {
    const cursos = [{ id: 'X', cycle: null, credits: 3 }];
    const result = agruparPorCiclo(cursos);
    expect(result['Electivo']).toHaveLength(1);
  });
});

describe('ordenarPorCreditos', () => {
  test('ordena de mayor a menor créditos y por id ascendente en empate', () => {
    const cursos = [
      { id: 'B', credits: 3 },
      { id: 'A', credits: 5 },
      { id: 'C', credits: 3 },
    ];
    const result = ordenarPorCreditos(cursos);
    expect(result[0].id).toBe('A');
    expect(result[1].id).toBe('B');
    expect(result[2].id).toBe('C');
  });
});

describe('listaRequisitos', () => {
  test('une los códigos ordenados con coma', () => {
    expect(listaRequisitos(['1INF30', '1INF10', '1INF20'])).toBe('1INF10, 1INF20, 1INF30');
  });

  test('devuelve "Sin requisitos" para arreglo vacío', () => {
    expect(listaRequisitos([])).toBe('Sin requisitos');
  });
});
