import base from './vite.config';
import { mergeConfig } from 'vite';
export default mergeConfig(base as any, { server: { port: 5196, strictPort: true, hmr: false, watch: { ignored: ['**/herramientas/**'] } } });
