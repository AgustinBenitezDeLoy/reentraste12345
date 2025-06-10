import express from 'express';
import multer from 'multer';
import { registerUser, loginUser } from '../controllers/authController';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

router.post('/register', upload.fields([
  { name: 'cedulaFrente', maxCount: 1 },
  { name: 'cedulaDorso', maxCount: 1 }
]), registerUser);

router.post('/login', loginUser);

export default router;