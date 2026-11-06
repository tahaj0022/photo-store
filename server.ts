import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Paths
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database Interfaces
interface UserRecord {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  storageQuotaBytes: number;
  createdAt: string;
}

interface PhotoRecord {
  id: string;
  userId: string;
  photoName: string;
  storedFilename: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  isFavorite?: boolean;
}

interface TokenRecord {
  token: string;
  userId: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  photos: PhotoRecord[];
  tokens: TokenRecord[];
}

// In-Memory Database Cache with disk sync
let db: DatabaseSchema = {
  users: [],
  photos: [],
  tokens: [],
};

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse database file, initializing empty db', err);
    }
  } else {
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file', err);
  }
}

// Seed Demo User and Sample Photos if empty
function seedDemoDataIfEmpty() {
  const demoEmail = 'demo@auraphoto.app';
  let demoUser = db.users.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());

  if (!demoUser) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('password123', salt, 64).toString('hex');
    const userId = 'user_demo_' + crypto.randomUUID().slice(0, 8);
    demoUser = {
      id: userId,
      name: 'Alex Rivera',
      email: demoEmail,
      salt,
      hash,
      storageQuotaBytes: 52428800, // 50 MB
      createdAt: new Date().toISOString(),
    };
    db.users.push(demoUser);

    const userUploadDir = path.resolve(UPLOADS_DIR, userId);
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    // Generate high quality demo SVG / PNG starter photos
    const samplePhotos = [
      {
        name: 'sunset_over_mountains.jpg',
        type: 'image/jpeg',
        color1: '#f97316',
        color2: '#4f46e5',
        title: 'Golden Peak Sunset',
        sub: 'Alps Mountain Range',
      },
      {
        name: 'coastal_ocean_waves.jpg',
        type: 'image/jpeg',
        color1: '#06b6d4',
        color2: '#1e3a8a',
        title: 'Pacific Coastline',
        sub: 'Big Sur Highway',
      },
      {
        name: 'minimalist_nordic_architecture.png',
        type: 'image/png',
        color1: '#64748b',
        color2: '#0f172a',
        title: 'Nordic Modernism',
        sub: 'Stockholm Pavilion',
      },
      {
        name: 'emerald_rainforest_canopy.webp',
        type: 'image/webp',
        color1: '#10b981',
        color2: '#064e3b',
        title: 'Emerald Canopy',
        sub: 'Costa Rica Reserve',
      },
    ];

    samplePhotos.forEach((sample, idx) => {
      const photoId = 'photo_' + crypto.randomUUID();
      const storedName = `${photoId}_${sample.name}`;
      const filePath = path.resolve(userUploadDir, storedName);

      // Create an artistic SVG representing real photography
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
        <defs>
          <linearGradient id="grad${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${sample.color1}" />
            <stop offset="100%" stop-color="${sample.color2}" />
          </linearGradient>
          <radialGradient id="sun${idx}" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="1100" fill="url(#grad${idx})" />
        <circle cx="800" cy="450" r="380" fill="url(#sun${idx})" />
        <path d="M0,900 Q400,650 800,850 T1600,750 L1600,1100 L0,1100 Z" fill="rgba(0,0,0,0.25)" />
        <path d="M0,960 Q500,800 1000,950 T1600,890 L1600,1100 L0,1100 Z" fill="rgba(0,0,0,0.4)" />
        <g fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" opacity="0.95">
          <text x="100" y="880" font-size="52" font-weight="bold">${sample.title}</text>
          <text x="100" y="935" font-size="28" opacity="0.8">${sample.sub} • 35mm f/2.8</text>
        </g>
      </svg>`;

      fs.writeFileSync(filePath, Buffer.from(svg, 'utf-8'));
      const stats = fs.statSync(filePath);

      db.photos.push({
        id: photoId,
        userId: userId,
        photoName: sample.name,
        storedFilename: storedName,
        fileSize: stats.size,
        fileType: sample.type,
        uploadDate: new Date(Date.now() - (idx + 1) * 3600 * 1000 * 14).toISOString(),
        isFavorite: idx === 0,
      });
    });

    saveDatabase();
  }
}

loadDatabase();
seedDemoDataIfEmpty();

// Express Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper: Hashing passwords
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Helper: Auth middleware
interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check Authorization header or query parameter ?token=... (useful for direct <img> src)
  let token = '';
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const tokenRecord = db.tokens.find(t => t.token === token);
  if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  const user = db.users.find(u => u.id === tokenRecord.userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  req.user = user;
  next();
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req: AuthenticatedRequest, file, cb) => {
    if (!req.user) {
      return cb(new Error('Unauthorized'), '');
    }
    const userDir = path.resolve(UPLOADS_DIR, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const photoId = 'photo_' + crypto.randomUUID();
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${photoId}_${cleanOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max per single photo
    files: 20, // Max 20 files per upload batch
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname}. Only JPG, PNG, WEBP, and SVG are supported.`));
    }
  },
});

// ======================== API ROUTES ======================== //

// Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Invalid email address.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const userId = 'user_' + crypto.randomUUID();

  const newUser: UserRecord = {
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    salt,
    hash,
    storageQuotaBytes: 52428800, // 50MB quota
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Generate session token valid for 7 days
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens.push({
    token,
    userId: newUser.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  saveDatabase();

  res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      storageQuotaBytes: newUser.storageQuotaBytes,
      createdAt: newUser.createdAt,
    },
    token,
  });
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const checkHash = hashPassword(password, user.salt);
  if (checkHash !== user.hash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Issue new token
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  saveDatabase();

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      storageQuotaBytes: user.storageQuotaBytes,
      createdAt: user.createdAt,
    },
    token,
  });
});

// Auth: Me
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      storageQuotaBytes: user.storageQuotaBytes,
      createdAt: user.createdAt,
    },
  });
});

// Auth: Update Profile
app.post('/api/auth/update-profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, currentPassword, newPassword } = req.body;

  if (name && typeof name === 'string') {
    user.name = name.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: 'Current password is required to set a new password.' });
      return;
    }
    const currentHash = hashPassword(currentPassword, user.salt);
    if (currentHash !== user.hash) {
      res.status(401).json({ error: 'Current password does not match.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    user.salt = crypto.randomBytes(16).toString('hex');
    user.hash = hashPassword(newPassword, user.salt);
  }

  saveDatabase();

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      storageQuotaBytes: user.storageQuotaBytes,
      createdAt: user.createdAt,
    },
  });
});

// Photos: List & Search
app.get('/api/photos', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let userPhotos = db.photos.filter(p => p.userId === user.id);

  // Search filter
  const search = req.query.search;
  if (typeof search === 'string' && search.trim()) {
    const query = search.trim().toLowerCase();
    userPhotos = userPhotos.filter(p => p.photoName.toLowerCase().includes(query));
  }

  // Favorites filter
  if (req.query.favorite === 'true') {
    userPhotos = userPhotos.filter(p => p.isFavorite === true);
  }

  // Type filter
  if (typeof req.query.type === 'string' && req.query.type !== 'all') {
    const filterType = req.query.type.toLowerCase();
    userPhotos = userPhotos.filter(p => p.fileType.toLowerCase().includes(filterType));
  }

  // Sort
  const sort = req.query.sort || 'date_desc';
  if (sort === 'date_desc') {
    userPhotos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } else if (sort === 'date_asc') {
    userPhotos.sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
  } else if (sort === 'name_asc') {
    userPhotos.sort((a, b) => a.photoName.localeCompare(b.photoName));
  } else if (sort === 'name_desc') {
    userPhotos.sort((a, b) => b.photoName.localeCompare(a.photoName));
  } else if (sort === 'size_desc') {
    userPhotos.sort((a, b) => b.fileSize - a.fileSize);
  } else if (sort === 'size_asc') {
    userPhotos.sort((a, b) => a.fileSize - b.fileSize);
  }

  // Map to public view
  const responsePhotos = userPhotos.map(p => ({
    id: p.id,
    userId: p.userId,
    photoName: p.photoName,
    storedFilename: p.storedFilename,
    photoUrl: `/api/photos/file/${p.id}`,
    fileSize: p.fileSize,
    fileType: p.fileType,
    uploadDate: p.uploadDate,
    isFavorite: !!p.isFavorite,
  }));

  res.json({ photos: responsePhotos });
});

// Storage: Stats
app.get('/api/photos/stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userPhotos = db.photos.filter(p => p.userId === user.id);

  let totalBytesUsed = 0;
  const formatCounts = { jpeg: 0, png: 0, webp: 0, other: 0 };
  const formatBytes = { jpeg: 0, png: 0, webp: 0, other: 0 };

  for (const p of userPhotos) {
    totalBytesUsed += p.fileSize;
    const type = p.fileType.toLowerCase();
    if (type.includes('jpeg') || type.includes('jpg')) {
      formatCounts.jpeg++;
      formatBytes.jpeg += p.fileSize;
    } else if (type.includes('png')) {
      formatCounts.png++;
      formatBytes.png += p.fileSize;
    } else if (type.includes('webp')) {
      formatCounts.webp++;
      formatBytes.webp += p.fileSize;
    } else {
      formatCounts.other++;
      formatBytes.other += p.fileSize;
    }
  }

  const quotaBytes = user.storageQuotaBytes || 52428800; // default 50 MB
  const percentUsed = Math.min(100, (totalBytesUsed / quotaBytes) * 100);

  res.json({
    totalPhotos: userPhotos.length,
    totalBytesUsed,
    quotaBytes,
    percentUsed: Number(percentUsed.toFixed(1)),
    formatCounts,
    formatBytes,
  });
});

// Photo: Upload (Multi-file)
app.post(
  '/api/photos/upload',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check remaining quota before processing files
    const user = req.user!;
    const userPhotos = db.photos.filter(p => p.userId === user.id);
    const currentBytesUsed = userPhotos.reduce((acc, curr) => acc + curr.fileSize, 0);

    upload.array('photos', 20)(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File size exceeds limit (15MB maximum per photo).' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      } else if (err) {
        res.status(400).json({ error: err.message || 'File upload failed.' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files were provided for upload.' });
        return;
      }

      // Calculate total incoming size
      const incomingBytes = files.reduce((acc, f) => acc + f.size, 0);
      if (currentBytesUsed + incomingBytes > user.storageQuotaBytes) {
        // Remove uploaded files from disk immediately to avoid orphan storage
        for (const file of files) {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch {}
          }
        }
        res.status(413).json({
          error: `Storage quota exceeded. You have ${(user.storageQuotaBytes - currentBytesUsed) / (1024 * 1024) < 0 ? 0 : ((user.storageQuotaBytes - currentBytesUsed) / (1024 * 1024)).toFixed(1)} MB available, but tried to upload ${(incomingBytes / (1024 * 1024)).toFixed(1)} MB.`,
        });
        return;
      }

      const savedPhotos: PhotoRecord[] = [];
      const now = new Date().toISOString();

      for (const file of files) {
        // Extract photoId from file.filename
        const parts = file.filename.split('_');
        const photoId = parts[0] === 'photo' && parts[1] ? `photo_${parts[1]}` : 'photo_' + crypto.randomUUID();

        const record: PhotoRecord = {
          id: photoId,
          userId: user.id,
          photoName: file.originalname,
          storedFilename: file.filename,
          fileSize: file.size,
          fileType: file.mimetype || 'image/jpeg',
          uploadDate: now,
          isFavorite: false,
        };

        db.photos.push(record);
        savedPhotos.push(record);
      }

      saveDatabase();

      res.status(201).json({
        message: `Successfully uploaded ${savedPhotos.length} photo(s).`,
        photos: savedPhotos.map(p => ({
          id: p.id,
          userId: p.userId,
          photoName: p.photoName,
          storedFilename: p.storedFilename,
          photoUrl: `/api/photos/file/${p.id}`,
          fileSize: p.fileSize,
          fileType: p.fileType,
          uploadDate: p.uploadDate,
          isFavorite: false,
        })),
      });
    });
  }
);

// Photo: Serve binary file (Protected by token or auth header, with RLS)
app.get('/api/photos/file/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const photoId = req.params.id;

  const photo = db.photos.find(p => p.id === photoId);
  if (!photo) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }

  // Row Level Security check: user can only view their own photos
  if (photo.userId !== user.id) {
    res.status(403).json({ error: 'Access denied. You do not own this photo.' });
    return;
  }

  const filePath = path.resolve(UPLOADS_DIR, user.id, photo.storedFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File data missing on storage server.' });
    return;
  }

  // Set Content-Type
  res.setHeader('Content-Type', photo.fileType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=86400'); // Cache for 1 day for authenticated user

  // Handle download parameter
  if (req.query.download === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(photo.photoName)}"`);
  }

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Photo: Toggle Favorite
app.patch('/api/photos/:id/favorite', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const photoId = req.params.id;

  const photo = db.photos.find(p => p.id === photoId);
  if (!photo) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }

  if (photo.userId !== user.id) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  photo.isFavorite = !photo.isFavorite;
  saveDatabase();

  res.json({
    message: photo.isFavorite ? 'Added to favorites' : 'Removed from favorites',
    isFavorite: photo.isFavorite,
  });
});

// Photo: Delete Single Photo
app.delete('/api/photos/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const photoId = req.params.id;

  const index = db.photos.findIndex(p => p.id === photoId);
  if (index === -1) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }

  const photo = db.photos[index];
  if (photo.userId !== user.id) {
    res.status(403).json({ error: 'Access denied. You cannot delete photos you do not own.' });
    return;
  }

  // Remove physical file
  const filePath = path.resolve(UPLOADS_DIR, user.id, photo.storedFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error removing file:', err);
    }
  }

  // Remove from database
  db.photos.splice(index, 1);
  saveDatabase();

  res.json({ message: 'Photo deleted successfully.', photoId });
});

// Photo: Bulk Delete
app.post('/api/photos/bulk-delete', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'No photo IDs provided.' });
    return;
  }

  let deletedCount = 0;
  const idsToDelete = new Set(ids);

  db.photos = db.photos.filter(p => {
    if (idsToDelete.has(p.id) && p.userId === user.id) {
      const filePath = path.resolve(UPLOADS_DIR, user.id, p.storedFilename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
      deletedCount++;
      return false;
    }
    return true;
  });

  saveDatabase();

  res.json({ message: `Successfully deleted ${deletedCount} photo(s).`, count: deletedCount });
});

// User: Clear entire library (Reset)
app.post('/api/photos/clear-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userPhotos = db.photos.filter(p => p.userId === user.id);

  for (const p of userPhotos) {
    const filePath = path.resolve(UPLOADS_DIR, user.id, p.storedFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }

  db.photos = db.photos.filter(p => p.userId !== user.id);
  saveDatabase();

  res.json({ message: 'All photos have been deleted.' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// In Dev: Mount Vite middlewares. In Prod: Serve static build.
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AuraPhoto Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
