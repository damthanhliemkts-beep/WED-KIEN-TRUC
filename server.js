/* ============================================================
   LIVING BLUEPRINT — Secure Local Server & Visual Editor REST API
   Native Node.js Implementation (Zero External Dependencies)
   Environment: Localhost only (127.0.0.1:3000)
   ============================================================ */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = 3000;
const HOST = '127.0.0.1';
const ROOT_DIR = path.resolve('d:/ArchitecturePortfolio');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const UPLOADS_DIR = path.join(ROOT_DIR, 'assets', 'images', 'uploads');

const MAX_JSON_SIZE = 5 * 1024 * 1024;    // 5 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB

// Ensure required directories exist
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// Simple Async Mutex for thread-safe atomic data operations
class AsyncMutex {
  constructor() {
    this._locked = false;
    this._queue = [];
  }
  acquire() {
    return new Promise(resolve => {
      if (!this._locked) {
        this._locked = true;
        resolve();
      } else {
        this._queue.push(resolve);
      }
    });
  }
  release() {
    if (this._queue.length > 0) {
      const next = this._queue.shift();
      next();
    } else {
      this._locked = false;
    }
  }
}
const fileMutex = new AsyncMutex();

/**
 * Detect actual image type via magic bytes
 * Rejects extension spoofing (e.g. text or exe renamed to .png)
 */
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
      buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) {
    return { ext: 'png', mime: 'image/png' };
  }
  // WebP: RIFF .... WEBP
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

/**
 * Validate site-content.json structure
 */
function validateContentSchema(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Dữ liệu nội dung phải là một JSON Object.' };
  }
  const requiredSections = ['site', 'home', 'about', 'contact', 'footer'];
  for (const sec of requiredSections) {
    if (!data[sec] || typeof data[sec] !== 'object' || Array.isArray(data[sec])) {
      return { valid: false, error: `Thiếu hoặc sai cấu trúc mục bắt buộc: "${sec}".` };
    }
  }
  return { valid: true };
}

/**
 * Validate projects.json structure
 */
function validateProjectsSchema(data) {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Dữ liệu đồ án phải là một mảng (JSON Array).' };
  }
  if (data.length === 0) {
    return { valid: false, error: 'Mảng đồ án không được rỗng.' };
  }
  const seenSlugs = new Set();
  const slugRegex = /^[a-z0-9-]+$/;
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      return { valid: false, error: `Đồ án tại vị trí index ${i} không phải là object hợp lệ.` };
    }
    if (!p.slug || typeof p.slug !== 'string' || !slugRegex.test(p.slug)) {
      return { valid: false, error: `Đồ án index ${i} có slug không hợp lệ: "${p.slug}". Chỉ chấp nhận ký tự a-z, 0-9 và dấu gạch ngang.` };
    }
    if (seenSlugs.has(p.slug)) {
      return { valid: false, error: `Phát hiện slug bị trùng lặp: "${p.slug}". Mỗi đồ án phải có slug duy nhất.` };
    }
    seenSlugs.add(p.slug);
    if (!p.title || typeof p.title !== 'string' || p.title.trim().length === 0) {
      return { valid: false, error: `Đồ án "${p.slug}" thiếu tiêu đề (title).` };
    }
    if (p.category !== 'architecture' && p.category !== 'interior') {
      return { valid: false, error: `Đồ án "${p.slug}" có category không hợp lệ: "${p.category}". Chỉ chấp nhận "architecture" hoặc "interior".` };
    }
  }
  return { valid: true };
}

/**
 * Perform safe atomic write with automatic timestamped backup
 */
function atomicWriteFileWithBackup(targetFilePath, backupPrefix, contentString) {
  let backupFilename = null;
  if (fs.existsSync(targetFilePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupFilename = `${backupPrefix}_${timestamp}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupFilename);
    fs.copyFileSync(targetFilePath, backupPath);
  }

  const tmpFile = `${targetFilePath}.tmp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(tmpFile, contentString, 'utf8');

  try {
    fs.renameSync(tmpFile, targetFilePath);
  } catch (err) {
    if (fs.existsSync(targetFilePath)) {
      fs.unlinkSync(targetFilePath);
    }
    fs.renameSync(tmpFile, targetFilePath);
  }

  return { backupFilename };
}

/**
 * Read request body safely with byte limit
 */
function readRequestBody(req, maxLimitBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxLimitBytes) {
        req.destroy();
        const err = new Error(`Dung lượng yêu cầu vượt quá giới hạn cho phép (${Math.round(maxLimitBytes / (1024 * 1024))} MB).`);
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', err => reject(err));
  });
}

/**
 * Main HTTP Server handler
 */
const server = http.createServer(async (req, res) => {
  // 1. IP Loopback restriction: strictly 127.0.0.1 / ::1
  const clientIp = req.socket.remoteAddress || '';
  const isLocalIp = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
  if (!isLocalIp) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Truy cập bị từ chối: Chỉ cho phép kết nối từ máy cục bộ (localhost).' }));
    return;
  }

  // 2. Validate Host header
  const reqHost = (req.headers.host || '').toLowerCase();
  const validHosts = ['localhost:3000', '127.0.0.1:3000', 'localhost', '127.0.0.1'];
  if (!validHosts.includes(reqHost)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Truy cập bị từ chối: Host header không hợp lệ.' }));
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '/';

  // 3. Route API endpoints
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(req, res, pathname);
  }

  // 4. Static file serving with strict security controls
  return handleStaticFile(req, res, pathname);
});

/**
 * Handle API requests
 */
async function handleApiRequest(req, res, pathname) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Origin check for local API access
  let isAllowedOrigin = false;
  if (origin) {
    const originLower = origin.toLowerCase();
    if (originLower === 'http://localhost:3000' || originLower === 'http://127.0.0.1:3000') {
      isAllowedOrigin = true;
    }
  } else if (!origin && referer) {
    const refLower = referer.toLowerCase();
    if (refLower.startsWith('http://localhost:3000') || refLower.startsWith('http://127.0.0.1:3000')) {
      isAllowedOrigin = true;
    }
  } else if (!origin && !referer) {
    // Local CLI / PowerShell / Node test request from loopback
    isAllowedOrigin = true;
  }

  // Handle CORS OPTIONS preflight
  if (req.method === 'OPTIONS') {
    if (isAllowedOrigin && origin) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      });
    } else {
      res.writeHead(403);
    }
    res.end();
    return;
  }

  // Base API response headers (no wildcard origin)
  const apiHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff'
  };
  if (isAllowedOrigin && origin) {
    apiHeaders['Access-Control-Allow-Origin'] = origin;
  }

  // CSRF & Origin validation for mutating requests (POST)
  if (req.method === 'POST') {
    if (!isAllowedOrigin) {
      res.writeHead(403, apiHeaders);
      res.end(JSON.stringify({ error: 'Yêu cầu bị từ chối: Origin hoặc Referer không thuộc máy chủ cục bộ.' }));
      return;
    }

    const csrfHeader = req.headers['x-requested-with'];
    if (csrfHeader !== 'LivingBlueprintEditor' && csrfHeader !== 'XMLHttpRequest') {
      res.writeHead(403, apiHeaders);
      res.end(JSON.stringify({
        error: 'Yêu cầu bị từ chối: Thiếu hoặc sai header bảo vệ CSRF (yêu cầu "X-Requested-With: LivingBlueprintEditor").'
      }));
      return;
    }
  }

  // Endpoint dispatching
  try {
    // -------------------------------------------------------------
    // GET /api/content
    // -------------------------------------------------------------
    if (pathname === '/api/content' && req.method === 'GET') {
      const contentPath = path.join(DATA_DIR, 'site-content.json');
      if (!fs.existsSync(contentPath)) {
        res.writeHead(404, apiHeaders);
        res.end(JSON.stringify({ error: 'Không tìm thấy tệp data/site-content.json.' }));
        return;
      }
      const data = fs.readFileSync(contentPath, 'utf8');
      res.writeHead(200, apiHeaders);
      res.end(data);
      return;
    }

    // -------------------------------------------------------------
    // POST /api/content
    // -------------------------------------------------------------
    if (pathname === '/api/content' && req.method === 'POST') {
      await fileMutex.acquire();
      try {
        const bodyBuf = await readRequestBody(req, MAX_JSON_SIZE);
        let parsed;
        try {
          parsed = JSON.parse(bodyBuf.toString('utf8'));
        } catch (e) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Định dạng JSON không hợp lệ: ' + e.message }));
          return;
        }

        const validation = validateContentSchema(parsed);
        if (!validation.valid) {
          res.writeHead(422, apiHeaders);
          res.end(JSON.stringify({ error: validation.error }));
          return;
        }

        const contentPath = path.join(DATA_DIR, 'site-content.json');
        const { backupFilename } = atomicWriteFileWithBackup(
          contentPath,
          'site-content',
          JSON.stringify(parsed, null, 2)
        );

        res.writeHead(200, apiHeaders);
        res.end(JSON.stringify({
          success: true,
          message: 'Nội dung trang web đã được lưu thành công.',
          backup: backupFilename,
          timestamp: new Date().toISOString()
        }));
      } finally {
        fileMutex.release();
      }
      return;
    }

    // -------------------------------------------------------------
    // GET /api/projects
    // -------------------------------------------------------------
    if (pathname === '/api/projects' && req.method === 'GET') {
      const projectsPath = path.join(DATA_DIR, 'projects.json');
      if (!fs.existsSync(projectsPath)) {
        res.writeHead(404, apiHeaders);
        res.end(JSON.stringify({ error: 'Không tìm thấy tệp data/projects.json.' }));
        return;
      }
      const data = fs.readFileSync(projectsPath, 'utf8');
      res.writeHead(200, apiHeaders);
      res.end(data);
      return;
    }

    // -------------------------------------------------------------
    // POST /api/projects
    // -------------------------------------------------------------
    if (pathname === '/api/projects' && req.method === 'POST') {
      await fileMutex.acquire();
      try {
        const bodyBuf = await readRequestBody(req, MAX_JSON_SIZE);
        let parsed;
        try {
          parsed = JSON.parse(bodyBuf.toString('utf8'));
        } catch (e) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Định dạng JSON không hợp lệ: ' + e.message }));
          return;
        }

        const validation = validateProjectsSchema(parsed);
        if (!validation.valid) {
          res.writeHead(422, apiHeaders);
          res.end(JSON.stringify({ error: validation.error }));
          return;
        }

        const projectsPath = path.join(DATA_DIR, 'projects.json');
        const { backupFilename } = atomicWriteFileWithBackup(
          projectsPath,
          'projects',
          JSON.stringify(parsed, null, 2)
        );

        res.writeHead(200, apiHeaders);
        res.end(JSON.stringify({
          success: true,
          message: 'Danh sách đồ án đã được cập nhật thành công.',
          count: parsed.length,
          backup: backupFilename,
          timestamp: new Date().toISOString()
        }));
      } finally {
        fileMutex.release();
      }
      return;
    }

    // -------------------------------------------------------------
    // POST /api/upload-image
    // -------------------------------------------------------------
    if (pathname === '/api/upload-image' && req.method === 'POST') {
      const bodyBuf = await readRequestBody(req, MAX_IMAGE_SIZE);
      let imageBuffer = null;
      let rawFilename = 'upload';

      const contentType = (req.headers['content-type'] || '').toLowerCase();

      if (contentType.includes('application/json')) {
        let jsonPayload;
        try {
          jsonPayload = JSON.parse(bodyBuf.toString('utf8'));
        } catch (e) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'JSON payload không hợp lệ: ' + e.message }));
          return;
        }
        rawFilename = jsonPayload.filename || 'upload';
        let b64 = jsonPayload.data || '';
        if (b64.includes(',')) {
          b64 = b64.split(',')[1];
        }
        imageBuffer = Buffer.from(b64, 'base64');
      } else if (contentType.includes('multipart/form-data')) {
        const boundaryMatch = req.headers['content-type'].match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        if (!boundaryMatch) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Không tìm thấy multipart boundary.' }));
          return;
        }
        const boundary = boundaryMatch[1] || boundaryMatch[2];
        const boundaryBuf = Buffer.from('--' + boundary);
        const headerSep = Buffer.from('\r\n\r\n');
        const start = bodyBuf.indexOf(boundaryBuf) + boundaryBuf.length + 2;
        const endHeader = bodyBuf.indexOf(headerSep, start);
        if (endHeader === -1) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Cấu trúc multipart không hợp lệ.' }));
          return;
        }
        const headerText = bodyBuf.slice(start, endHeader).toString('utf8');
        const fnMatch = headerText.match(/filename="([^"]+)"/i);
        if (fnMatch) rawFilename = fnMatch[1];
        const fileStart = endHeader + 4;
        const fileEnd = bodyBuf.indexOf(boundaryBuf, fileStart) - 2;
        if (fileEnd <= fileStart) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Tệp tải lên rỗng.' }));
          return;
        }
        imageBuffer = bodyBuf.slice(fileStart, fileEnd);
      } else if (contentType.startsWith('image/')) {
        rawFilename = req.headers['x-filename'] || 'upload';
        imageBuffer = bodyBuf;
      } else {
        res.writeHead(400, apiHeaders);
        res.end(JSON.stringify({
          error: 'Content-Type không được hỗ trợ. Chấp nhận application/json (base64), multipart/form-data hoặc image/*'
        }));
        return;
      }

      // Magic Byte inspection
      const imgInfo = detectImageType(imageBuffer);
      if (!imgInfo) {
        res.writeHead(415, apiHeaders);
        res.end(JSON.stringify({
          error: 'Tệp không phải là ảnh hợp lệ hoặc định dạng bị giả mạo. Chỉ chấp nhận ảnh thực tế dạng JPEG, PNG hoặc WebP.'
        }));
        return;
      }

      // Sanitize filename & save
      const safeBase = path.basename(rawFilename, path.extname(rawFilename)).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'img';
      const safeFileName = `${safeBase}_${Date.now()}.${imgInfo.ext}`;
      const targetFilePath = path.join(UPLOADS_DIR, safeFileName);

      fs.writeFileSync(targetFilePath, imageBuffer);

      res.writeHead(200, apiHeaders);
      res.end(JSON.stringify({
        success: true,
        message: 'Tải ảnh lên thành công.',
        url: `/assets/images/uploads/${safeFileName}`,
        filename: safeFileName,
        size: imageBuffer.length,
        mime: imgInfo.mime
      }));
      return;
    }

    // -------------------------------------------------------------
    // GET /api/backups
    // -------------------------------------------------------------
    if (pathname === '/api/backups' && req.method === 'GET') {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const stat = fs.statSync(path.join(BACKUPS_DIR, f));
          let type = 'unknown';
          if (f.startsWith('site-content_')) type = 'site-content';
          else if (f.startsWith('projects_')) type = 'projects';
          return {
            filename: f,
            type: type,
            size: stat.size,
            createdAt: stat.mtime
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.writeHead(200, apiHeaders);
      res.end(JSON.stringify({ success: true, count: files.length, backups: files }));
      return;
    }

    // -------------------------------------------------------------
    // POST /api/restore-backup
    // -------------------------------------------------------------
    if (pathname === '/api/restore-backup' && req.method === 'POST') {
      await fileMutex.acquire();
      try {
        const bodyBuf = await readRequestBody(req, 1024 * 1024);
        let parsed;
        try {
          parsed = JSON.parse(bodyBuf.toString('utf8'));
        } catch (e) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Định dạng JSON không hợp lệ: ' + e.message }));
          return;
        }

        const reqFilename = parsed.backupFilename;
        if (!reqFilename || typeof reqFilename !== 'string') {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Thiếu trường backupFilename.' }));
          return;
        }

        // Prevent path traversal
        const safeBackupFilename = path.basename(reqFilename);
        const backupFilePath = path.join(BACKUPS_DIR, safeBackupFilename);

        if (!fs.existsSync(backupFilePath)) {
          res.writeHead(404, apiHeaders);
          res.end(JSON.stringify({ error: `Không tìm thấy bản sao lưu "${safeBackupFilename}".` }));
          return;
        }

        // Verify and identify target
        let targetFilePath = null;
        let prefix = '';
        if (safeBackupFilename.startsWith('site-content_')) {
          targetFilePath = path.join(DATA_DIR, 'site-content.json');
          prefix = 'site-content_pre_restore';
        } else if (safeBackupFilename.startsWith('projects_')) {
          targetFilePath = path.join(DATA_DIR, 'projects.json');
          prefix = 'projects_pre_restore';
        } else {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Tệp sao lưu không đúng định dạng nhận diện (site-content_* hoặc projects_*).' }));
          return;
        }

        // Read backup content & validate before restoring
        const backupRaw = fs.readFileSync(backupFilePath, 'utf8');
        let backupData;
        try {
          backupData = JSON.parse(backupRaw);
        } catch (e) {
          res.writeHead(400, apiHeaders);
          res.end(JSON.stringify({ error: 'Nội dung tệp sao lưu bị lỗi cấu trúc JSON: ' + e.message }));
          return;
        }

        if (safeBackupFilename.startsWith('site-content_')) {
          const v = validateContentSchema(backupData);
          if (!v.valid) {
            res.writeHead(422, apiHeaders);
            res.end(JSON.stringify({ error: 'Bản sao lưu không thỏa mãn schema nội dung: ' + v.error }));
            return;
          }
        } else if (safeBackupFilename.startsWith('projects_')) {
          const v = validateProjectsSchema(backupData);
          if (!v.valid) {
            res.writeHead(422, apiHeaders);
            res.end(JSON.stringify({ error: 'Bản sao lưu không thỏa mãn schema đồ án: ' + v.error }));
            return;
          }
        }

        // Perform restore with safety backup
        const { backupFilename: safetyBackup } = atomicWriteFileWithBackup(
          targetFilePath,
          prefix,
          JSON.stringify(backupData, null, 2)
        );

        res.writeHead(200, apiHeaders);
        res.end(JSON.stringify({
          success: true,
          message: `Đã khôi phục thành công từ bản sao lưu ${safeBackupFilename}.`,
          restoredFrom: safeBackupFilename,
          safetyBackup: safetyBackup,
          timestamp: new Date().toISOString()
        }));
      } finally {
        fileMutex.release();
      }
      return;
    }

    // Endpoint not matched
    res.writeHead(404, apiHeaders);
    res.end(JSON.stringify({ error: `API endpoint không tồn tại: ${req.method} ${pathname}` }));
    return;

  } catch (err) {
    const status = err.statusCode || 500;
    res.writeHead(status, apiHeaders);
    res.end(JSON.stringify({ error: err.message || 'Lỗi xử lý nội bộ máy chủ.' }));
  }
}

/**
 * Handle static file serving with strict security controls
 */
function handleStaticFile(req, res, pathname) {
  let cleanPath = pathname;
  if (cleanPath === '/' || cleanPath === '') cleanPath = '/index.html';

  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // Resolve safe absolute path
  const safePath = path.normalize(path.resolve(ROOT_DIR, '.' + cleanPath));

  // Security check 1: Path Traversal prevention
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Truy cập ngoài thư mục gốc bị từ chối.');
    return;
  }

  // Security check 2: Block sensitive files, backup folders and internal data
  const lowerPath = safePath.toLowerCase();
  const lowerRoot = ROOT_DIR.toLowerCase();
  const relPath = lowerPath.slice(lowerRoot.length);

  const isSensitive =
    relPath.includes('/backups/') ||
    relPath.includes('\\backups\\') ||
    relPath.endsWith('/backups') ||
    relPath.endsWith('\\backups') ||
    relPath.endsWith('.bak') ||
    relPath.endsWith('.tmp') ||
    relPath.endsWith('.log') ||
    relPath.endsWith('.env') ||
    relPath.endsWith('.jsonl') ||
    relPath.includes('/.git') ||
    relPath.includes('\\.git') ||
    path.basename(safePath).startsWith('.');

  if (isSensitive) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Không thể truy cập tài nguyên bảo mật hoặc tệp sao lưu qua giao thức HTTP.');
    return;
  }

  // Read and serve file
  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Static assets can use standard cache control
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(safePath);
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    stream.pipe(res);
  });
}

// Start Server strictly on 127.0.0.1
server.listen(PORT, HOST, () => {
  console.log(`[Living Blueprint]: Máy chủ đang chạy tại http://${HOST}:${PORT}`);
  console.log(`[Living Blueprint]: Visual Editor REST API đã sẵn sàng.`);
});
