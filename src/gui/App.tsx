// Main entry point for the browser version of TikZiT

import { useEffect, useState } from "preact/hooks";
import CodeEditor from "./CodeEditor";
import Splitpane from "./Splitpane";
import TikzEditor, { TikzEditorContent } from "./TikzEditor";
import { TikzitBrowserHost } from "./TikzitBrowserHost";


interface AppProps {
  initialContent: TikzEditorContent;
  host: TikzitBrowserHost;
}

const App = ({ initialContent, host }: AppProps) => {
  const [code, setCode] = useState<string>(initialContent.document);
  const [initialCode, setInitialCode] = useState<string>(initialContent.document);

  const resetCode = (newCode: string) => {
    setInitialCode(newCode);
    setCode(newCode);
  }

  useEffect(() => {
    host.onUpdateFromGui(source => {
      resetCode(source);
    });
  }, [host, resetCode]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    host.updateToGui(newCode);
  };

  return (
    <Splitpane splitRatio={0.7} orientation="vertical">
      <TikzEditor initialContent={initialContent} host={host} />
      <CodeEditor value={initialCode} onChange={handleCodeChange} />
    </Splitpane>);
};

export default App;