import { createContext } from "preact";
import TikzitHost from "../lib/TikzitHost";

const TikzitHostContext = createContext<TikzitHost>(new TikzitHost());
export default TikzitHostContext;
