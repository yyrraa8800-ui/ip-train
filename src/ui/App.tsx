import { useEffect } from 'react';
import { useStore } from '../store/store';
import { useI18n } from '../i18n';
import { useNav, navActions, type Tab } from './nav';
import { ToastHost } from './toast';
import { Icon } from './icons';
import { Onboarding } from './screens/Onboarding';
import { Hub } from './screens/Hub';
import { Today } from './screens/Today';
import { Library } from './screens/Library';
import { Analytics } from './screens/Analytics';
import { Settings } from './screens/Settings';
import { PatternDetail } from './screens/PatternDetail';
import { ExerciseDetail } from './screens/ExerciseDetail';
import { Logger } from './screens/Logger';
import { SwapFlow } from './screens/Swap';
import { ChangeExercise } from './screens/ChangeExercise';
import { AddExercise } from './screens/AddExercise';
import { Volume } from './screens/Volume';
import { History } from './screens/History';
import { Mesocycle } from './screens/Mesocycle';
import { About } from './screens/About';
import { Guide } from './screens/Guide';

const TABS: { id: Tab; icon: 'patterns' | 'today' | 'library' | 'stats' | 'settings'; key: string }[] = [
  { id: 'hub', icon: 'patterns', key: 'tab_hub' },
  { id: 'today', icon: 'today', key: 'tab_today' },
  { id: 'library', icon: 'library', key: 'tab_library' },
  { id: 'analytics', icon: 'stats', key: 'tab_analytics' },
  { id: 'settings', icon: 'settings', key: 'tab_settings' },
];

export function App() {
  const state = useStore();
  const { rtl, t } = useI18n();
  const nav = useNav();

  useEffect(() => {
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', state.settings.language);
  }, [rtl, state.settings.language]);

  // Theme: auto (follow system) / dark / light.
  const themePref = state.settings.theme ?? 'dark';
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved = themePref === 'auto' ? (mq.matches ? 'light' : 'dark') : themePref;
      document.documentElement.setAttribute('data-theme', resolved);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', resolved === 'light' ? '#f4f6f8' : '#0a0a0d');
    };
    apply();
    if (themePref === 'auto') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [themePref]);

  if (!state.hydrated) return null;
  if (!state.onboarded) return <Onboarding />;

  const top = nav.stack[nav.stack.length - 1];
  const focusMode =
    top?.name === 'logger' || top?.name === 'swap' || top?.name === 'change' || top?.name === 'addExercise';

  let content: React.ReactNode;
  if (top) {
    switch (top.name) {
      case 'pattern':
        content = <PatternDetail pattern={top.pattern} />;
        break;
      case 'exercise':
        content = <ExerciseDetail slot={top.slot} />;
        break;
      case 'logger':
        content = <Logger dayIndex={top.dayIndex} />;
        break;
      case 'swap':
        content = <SwapFlow slot={top.slot} />;
        break;
      case 'change':
        content = <ChangeExercise slot={top.slot} />;
        break;
      case 'addExercise':
        content = <AddExercise dayIndex={top.dayIndex} />;
        break;
      case 'volume':
        content = <Volume />;
        break;
      case 'history':
        content = <History />;
        break;
      case 'mesocycle':
        content = <Mesocycle />;
        break;
      case 'about':
        content = <About />;
        break;
      case 'guide':
        content = <Guide />;
        break;
    }
  } else {
    switch (nav.tab) {
      case 'hub':
        content = <Hub />;
        break;
      case 'today':
        content = <Today />;
        break;
      case 'library':
        content = <Library />;
        break;
      case 'analytics':
        content = <Analytics />;
        break;
      case 'settings':
        content = <Settings />;
        break;
    }
  }

  return (
    <>
      {content}
      <ToastHost />
      {!focusMode && (
        <nav className="tabbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tabbtn ${!top && nav.tab === tab.id ? 'on' : ''}`}
              onClick={() => navActions.setTab(tab.id)}
            >
              <span className="tabicon">
                <Icon name={tab.icon} size={21} />
              </span>
              {t(tab.key)}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}

export function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="header">
      <button className="backbtn" onClick={onBack} aria-label="back">
        <Icon name="back" size={20} />
      </button>
      <div className="htitle">{title}</div>
    </div>
  );
}
