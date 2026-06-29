import { useEffect } from 'react';
import { useStore } from '../store/store';
import { useI18n } from '../i18n';
import { useNav, navActions, type Tab } from './nav';
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
import { Volume } from './screens/Volume';
import { Mesocycle } from './screens/Mesocycle';
import { About } from './screens/About';
import { Guide } from './screens/Guide';

const TABS: { id: Tab; icon: string; key: string }[] = [
  { id: 'hub', icon: '⬡', key: 'tab_hub' },
  { id: 'today', icon: '▶', key: 'tab_today' },
  { id: 'library', icon: '≣', key: 'tab_library' },
  { id: 'analytics', icon: '📈', key: 'tab_analytics' },
  { id: 'settings', icon: '⚙', key: 'tab_settings' },
];

export function App() {
  const state = useStore();
  const { rtl, t } = useI18n();
  const nav = useNav();

  useEffect(() => {
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', state.settings.language);
  }, [rtl, state.settings.language]);

  if (!state.hydrated) return null;
  if (!state.onboarded) return <Onboarding />;

  const top = nav.stack[nav.stack.length - 1];
  const focusMode = top?.name === 'logger' || top?.name === 'swap' || top?.name === 'change';

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
      case 'volume':
        content = <Volume />;
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
      {!focusMode && (
        <nav className="tabbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tabbtn ${!top && nav.tab === tab.id ? 'on' : ''}`}
              onClick={() => navActions.setTab(tab.id)}
            >
              <span className="tabicon">{tab.icon}</span>
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
        ‹
      </button>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>
    </div>
  );
}
