import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const spec = YAML.load(join(__dirname, '../../openapi.yaml'));
const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec));

export default router;
