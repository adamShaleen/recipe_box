import type { FC } from 'react';
import { RecipeBrowser } from './components/RecipeBrowser';

export const App: FC = () => {
  return <RecipeBrowser onSelect={() => console.log('yep')} />;
};
