import { Router } from 'express';
import {
  attachChildTeam,
  attachChildUser,
  createTeam,
  deleteTeam,
  getTeamById,
  getTeamsByName,
  updateTeam,
} from '../services';

// Teams API router.
const router = Router();

// List teams (optionally filtered by name).
router.get('/', async (req, res) => {
  try {
    const { name } = req.query;
    const teams = await getTeamsByName(typeof name === 'string' ? name : undefined);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Get a single team by id.
router.get('/:id', async (req, res) => {
  try {
    const team = await getTeamById(Number(req.params.id));
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch team' });
  }
});

// Create a team (optionally with a parent).
router.post('/', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const team = await createTeam(name ?? '', parentId != null ? Number(parentId) : undefined);
    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

// Update a team's name or parent.
router.patch('/:id', async (req, res) => {
  try {
    const { name, parentId } = req.body as { name?: string; parentId?: string | null };
    const team = await updateTeam(Number(req.params.id), {
      name,
      parentId: parentId === undefined ? undefined : parentId === null ? null : Number(parentId),
    });
    res.json(team);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

// Attach a child team or child user to a team.
router.post('/:id/children', async (req, res) => {
  try {
    const { childTeamId, childUserId } = req.body as { childTeamId?: string; childUserId?: string };
    if (!!childTeamId === !!childUserId) {
      return res.status(400).json({ message: 'Provide exactly one of childTeamId or childUserId' });
    }
    let updated;
    if (childTeamId) {
      updated = await attachChildTeam(Number(req.params.id), Number(childTeamId));
    } else if (childUserId) {
      updated = await attachChildUser(Number(req.params.id), Number(childUserId));
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

// Delete a team and its descendants.
router.delete('/:id', async (req, res) => {
  try {
    await deleteTeam(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ message: (err as Error).message });
  }
});

export default router;
