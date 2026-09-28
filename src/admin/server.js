const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const {
  TYPE_CONFIG,
  ValidationError,
  collectTagMetadata,
  deleteEntry,
  listEntries,
  renderPreview,
  readEntry,
  writeEntry
} = require('./lib/content-service');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CONTENT_ROOT = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(CONTENT_ROOT, 'images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
      return;
    }

    cb(new ValidationError('Only image files are allowed.'));
  }
});

function assertValidApiType(type) {
  if (!TYPE_CONFIG[type]) {
    throw new ValidationError('Invalid content type');
  }
}

app.get('/api/meta/tags', async (req, res, next) => {
  try {
    const tags = await collectTagMetadata();
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

app.post('/api/preview', async (req, res, next) => {
  try {
    const { type, entry } = req.body || {};
    assertValidApiType(type);
    res.json(renderPreview(type, entry || req.body));
  } catch (error) {
    next(error);
  }
});

app.post('/api/images/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    res.json({
      success: true,
      filename: req.file.filename,
      path: `/images/${req.file.filename}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/images/serve/:filename', async (req, res, next) => {
  try {
    const imagePath = path.join(CONTENT_ROOT, 'images', req.params.filename);
    await fs.access(imagePath);
    res.sendFile(imagePath);
  } catch (error) {
    next(new ValidationError('Image not found'));
  }
});

app.get('/api/images', async (req, res, next) => {
  try {
    const imagesDir = path.join(CONTENT_ROOT, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    const images = await Promise.all(imageFiles.map(async (filename) => {
      const stats = await fs.stat(path.join(imagesDir, filename));
      return {
        filename,
        path: `/images/${filename}`,
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    }));

    res.json(images.sort((a, b) => new Date(b.modified) - new Date(a.modified)));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/images/:filename', async (req, res, next) => {
  try {
    await fs.unlink(path.join(CONTENT_ROOT, 'images', req.params.filename));
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/:type', async (req, res, next) => {
  try {
    assertValidApiType(req.params.type);
    const entries = await listEntries(req.params.type);
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

app.get('/api/:type/:filename', async (req, res, next) => {
  try {
    assertValidApiType(req.params.type);
    const entry = await readEntry(req.params.type, req.params.filename);
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

app.post('/api/:type', async (req, res, next) => {
  try {
    assertValidApiType(req.params.type);
    const entry = await writeEntry(req.params.type, req.body || {});
    res.json({
      success: true,
      entry,
      message: `${entry.type} created successfully`
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/:type/:filename', async (req, res, next) => {
  try {
    assertValidApiType(req.params.type);
    const entry = await writeEntry(req.params.type, req.body || {}, { filename: req.params.filename });
    res.json({
      success: true,
      entry,
      message: `${entry.type} updated successfully`
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/:type/:filename', async (req, res, next) => {
  try {
    assertValidApiType(req.params.type);
    await deleteEntry(req.params.type, req.params.filename);
    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error.message || 'Unexpected server error',
    details: error.details || []
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\nBlog Admin V2 running at http://localhost:${PORT}`);
  console.log('Local 11ty authoring workspace ready.\n');
});
