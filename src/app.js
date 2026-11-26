const path = require('path');
const express = require('express');
const repositorio = require('./data/repositorio');

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cursos: repositorio.listar().length });
});

app.use('/cursos', require('./routes/cursos'));
app.use('/habilitados', require('./routes/habilitados'));

// Parser error handling middleware (must be before the generic 500 handler)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'cuerpo JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'cuerpo de solicitud demasiado grande' });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'cuerpo de solicitud inválido' });
  }
  res.status(500).json({ error: 'error interno del servidor' });
});

module.exports = app;
