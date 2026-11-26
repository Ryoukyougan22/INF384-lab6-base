'use strict';

const { Router } = require('express');
const repositorio = require('../data/repositorio');

const router = Router();

// Regex: full-string match, 2–10 alphanumeric characters, no line terminators
const CODIGO_RE = /^[A-Za-z0-9]{2,10}$/;

router.post('/', (req, res, next) => {
  try {
    // 1. Verify Content-Type is application/json (allow params like charset=utf-8)
    const contentType = req.headers['content-type'] || '';
    const mediaType = contentType.split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') {
      return res.status(400).json({ error: 'se requiere un cuerpo JSON' });
    }

    // 2. Verify the parsed body is a plain object (not null, not array, not missing)
    const body = req.body;
    if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'se requiere un cuerpo JSON' });
    }

    // 3. Verify aprobados field is present and is an array
    if (!Array.isArray(body.aprobados)) {
      return res.status(400).json({ error: 'aprobados debe ser un array' });
    }

    const aprobados = body.aprobados;

    // 4. Verify raw length <= 200 (before dedup)
    if (aprobados.length > 200) {
      return res.status(400).json({ error: 'aprobados no puede tener más de 200 elementos' });
    }

    // 5. Verify every element is a string
    for (const elemento of aprobados) {
      if (typeof elemento !== 'string') {
        return res.status(400).json({ error: 'cada elemento de aprobados debe ser una cadena de texto' });
      }
    }

    // 6. Verify every string matches the alphanumeric format (full-string, no line terminators)
    for (const codigo of aprobados) {
      if (/[\r\n]/.test(codigo) || !CODIGO_RE.test(codigo)) {
        return res.status(400).json({ error: 'cada código debe ser alfanumérico de entre 2 y 10 caracteres' });
      }
    }

    // 7. Normalize to uppercase
    const normalizados = aprobados.map((c) => c.toUpperCase());

    // 8. Deduplicate
    const unicos = [...new Set(normalizados)];

    // 9. Discard codes not found in the repository
    const reconocidos = unicos.filter((codigo) => repositorio.obtener(codigo) !== undefined);

    // 10. Build Set and calculate enabled courses
    const aprobadosSet = new Set(reconocidos);
    const habilitados = repositorio.calcularHabilitados(aprobadosSet);

    // 11. Respond 200 with course objects including required fields
    const resultado = habilitados.map((curso) => ({
      id: curso.id,
      name: curso.name,
      credits: curso.credits,
      cycle: curso.cycle,
      type: curso.type,
      prerequisites: curso.prerequisites,
    }));

    return res.status(200).json(resultado);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
