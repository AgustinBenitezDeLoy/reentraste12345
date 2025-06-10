import { Router } from 'express';
import { iniciarKYC, estadoKYC } from '../controllers/kycController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/iniciar', verificarToken, iniciarKYC);
router.get('/estado', verificarToken, estadoKYC);

export default router;
