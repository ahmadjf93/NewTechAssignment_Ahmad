import { Router } from 'express';
import { createUser, deleteUser, getUserById, getUsersByName, updateUser } from '../services';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { name } = req.query;
    const users = await getUsersByName(typeof name === 'string' ? name : undefined);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, teamIds } = req.body as { name?: string; teamIds?: string[] };
    const user = await createUser(
      name ?? '',
      (teamIds ?? []).map((v) => Number(v))
    );
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, teamIds } = req.body as { name?: string; teamIds?: string[] };
    const user = await updateUser(Number(req.params.id), {
      name,
      teamIds: teamIds ? teamIds.map((v) => Number(v)) : undefined,
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteUser(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ message: (err as Error).message });
  }
});

export default router;
