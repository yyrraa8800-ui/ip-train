import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { hydrate } from './store/store';

hydrate();

const el = document.getElementById('root')!;
createRoot(el).render(<App />);
