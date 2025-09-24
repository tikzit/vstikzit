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

  useEffect(() => {
    host.onUpdateFromGui(source => {
      console.log("App: source updated");
      // setCode(source);
    });
  }, [host, setCode]);

  const handleCodeChange = (newCode: string) => {
    console.log("App: code changed");
    setCode(newCode);
    host.updateToGui(newCode);
  };

  return (
    <Splitpane splitRatio={0.7} orientation="vertical">
      <TikzEditor initialContent={initialContent} host={host} />
      <CodeEditor value={code} />
    </Splitpane>);
};

export default App;