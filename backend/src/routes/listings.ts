import { Router } from 'express';
import { put } from '@vercel/blob';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Listing from '../models/Listing.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name');
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'sellerId',
      'name',
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post(
  '/',
  requireAuth,
  upload.array('images', 5),
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const sellerId = req.userId;

      const { title, description, category, condition, price } = req.body;

      if (!title || !description || !category || !condition || !price) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ error: 'At least one photo is required' });
      }

      const imageUrls = await Promise.all(
        files.map(async (file) => {
          const blob = await put(
            `listings/${Date.now()}-${file.originalname}`,
            file.buffer,
            {
              access: 'public',
            },
          );
          return blob.url;
        }),
      );

      const listing = await Listing.create({
        sellerId,
        title,
        description,
        category,
        condition,
        price: Number(price),
        images: imageUrls,
      });

      res.status(201).json(listing);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  },
);

export default router;
