import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
  });
});

export default router;
