import { getBabyProfile, getSettings } from './storage.js';

function bootstrap() {
  const app = document.getElementById('app');
  app.textContent = 'Baby Steps is initializing…';

  const profile = getBabyProfile();
  const settings = getSettings();

  console.log('Baby profile', profile);
  console.log('Settings', settings);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => console.log('Service worker registered.'))
      .catch((error) => console.warn('Service worker registration failed:', error));
  }
}

bootstrap();
