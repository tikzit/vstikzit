import React, { useState, useEffect } from 'react';
import TikZEditor from './TikZEditor';

interface AppProps {
  initialContent: string;
}

const App: React.FC<AppProps> = ({ initialContent }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('App component mounted with content:', initialContent);
    setIsLoaded(true);
  }, [initialContent]);

  if (!isLoaded) {
    return <div style={{ padding: '20px', color: 'white' }}>Initializing TikZ Editor...</div>;
  }

  return <TikZEditor initialContent={initialContent} />;
};

export default App;
