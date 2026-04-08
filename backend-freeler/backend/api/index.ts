import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap';

let appPromise: Promise<INestApplication> | null = null;

async function getServer() {
  if (!appPromise) {
    appPromise = createNestApp().then(async (app) => {
      await app.init();
      return app;
    });
  }

  const app = await appPromise;
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: unknown, res: unknown) {
  const server = await getServer();
  return server(req, res);
}
