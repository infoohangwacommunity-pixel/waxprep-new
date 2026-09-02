export function createAuthMiddleware() {
  async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  return authMiddleware;
}
export default createAuthMiddleware;
