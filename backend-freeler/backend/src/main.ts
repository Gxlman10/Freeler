import { createNestApp } from './bootstrap';

async function bootstrap() {
  const app = await createNestApp();
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

void (async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error('Error starting application', error);
    process.exit(1);
  }
})();
