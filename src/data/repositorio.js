const path = require('path');
const fs = require('fs');

const RUTA_DATOS = path.join(__dirname, '..', '..', 'data', 'cursos.json');

// Se carga una sola vez al importar el módulo.
const { courses } = JSON.parse(fs.readFileSync(RUTA_DATOS, 'utf8'));
const porCodigo = new Map(courses.map((curso) => [curso.id, curso]));

function listar() {
  return [...porCodigo.values()];
}

function listarPorCiclo(ciclo) {
  return listar().filter((curso) => curso.cycle === ciclo);
}

function obtener(codigo) {
  return porCodigo.get(codigo);
}

function calcularHabilitados(aprobadosSet) {
  return listar().filter(
    (curso) =>
      !aprobadosSet.has(curso.id) &&
      curso.prerequisites.every((id) => aprobadosSet.has(id)),
  );
}

module.exports = { listar, listarPorCiclo, obtener, calcularHabilitados };
