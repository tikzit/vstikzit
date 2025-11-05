// Main entry point for the browser version of TikZiT

import { useContext, useEffect, useState } from "preact/hooks";
import CodeEditor from "./CodeEditor";
import Splitpane from "./Splitpane";
import TikzEditor, { TikzEditorContent } from "./TikzEditor";
import TikzitHostContext from "./TikzitHostContext";
import { TikzitBrowserHost } from "./TikzitBrowserHost";

interface AppProps {
  initialContent: TikzEditorContent;
}

const App = ({ initialContent }: AppProps) => {
  const [code, setCode] = useState<string>(initialContent.document);
  const [initialCode, setInitialCode] = useState<string>(initialContent.document);
  const host = useContext(TikzitHostContext) as TikzitBrowserHost;

  const resetCode = (newCode: string) => {
    setInitialCode(newCode);
    setCode(newCode);
  };

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
      <TikzEditor initialContent={initialContent} />
      <CodeEditor value={initialCode} onChange={handleCodeChange} />
    </Splitpane>
  );
};

export default App;
