import { Router } from 'express';
import { getProjects, createProject, getProjectActivities } from '../controllers/projectController.js';

const router = Router();

router.get('/', getProjects);
router.post('/', createProject);
router.get('/activities', getProjectActivities);

export default router;
