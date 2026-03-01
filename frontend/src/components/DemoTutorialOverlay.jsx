import './DemoTutorialOverlay.css';

export const DEMO_TUTORIAL_STEPS = [
  {
    page: 'swipe',
    icon: '🧭',
    title: 'Step 1: Discover',
    body: 'This is your Discover feed. Swipe through items and filter by category to find what you want.',
    hint: 'Use left and right actions to pass or like items.'
  },
  {
    page: 'matches',
    icon: '💙',
    title: 'Step 2: Matches',
    body: 'When both people like each other\'s items, the match appears here.',
    hint: 'Use the menu on each card to confirm, reject, or contact.'
  },
  {
    page: 'profile',
    icon: '👤',
    title: 'Step 3: Profile',
    body: 'Manage your listings and see your activity from your profile tab.',
    hint: 'From here you can add listings and track your items.'
  }
];

export default function DemoTutorialOverlay({ stepIndex, isLocked, onNext }) {
  const step = DEMO_TUTORIAL_STEPS[stepIndex] || DEMO_TUTORIAL_STEPS[0];
  const isLastStep = stepIndex >= DEMO_TUTORIAL_STEPS.length - 1;

  return (
    <div className="demo-tutorial-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div key={stepIndex} className={`demo-tutorial-card ${isLocked ? 'is-animating' : ''}`}>
        <p className="demo-tutorial-kicker">Welcome to STYLR Demo</p>
        <div className="demo-tutorial-icon" aria-hidden="true">{step.icon}</div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <p className="demo-tutorial-hint">{step.hint}</p>

        <div className="demo-tutorial-progress" aria-label="Tutorial progress">
          {DEMO_TUTORIAL_STEPS.map((_, idx) => (
            <span
              key={`tutorial-dot-${idx}`}
              className={`demo-tutorial-dot ${idx === stepIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        <button type="button" onClick={onNext} disabled={isLocked}>
          {isLastStep ? 'Start Exploring' : 'Next Step'}
        </button>

        {isLocked && (
          <p className="demo-tutorial-lock">Animation in progress...</p>
        )}
      </div>
    </div>
  );
}
