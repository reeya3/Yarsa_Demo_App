import { Router } from 'express';
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser
} from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
