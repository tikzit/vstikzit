// @ts-ignore - esbuild handles ES module conversion
import { createToken, Lexer, EmbeddedActionsParser, defaultParserErrorProvider } from "chevrotain";
import Graph from "./Graph";
import { Coord, Data, NodeData, StyleData } from "./Data";

function matchDelimString(text: string, startOffset: number): [string] | null {
  let endOffset = startOffset;
  let depth = 0;

  if (endOffset < text.length && text[endOffset] === "{") {
    depth++;
    endOffset++;
  } else {
    return null;
  }

  while (endOffset < text.length) {
    if (text[endOffset] === "{") {
      depth++;
    } else if (text[endOffset] === "}") {
      depth--;
      if (depth === 0) {
        return [text.slice(startOffset, endOffset + 1)];
      }
    }
    endOffset++;
  }

  return null;
}

function stripBraces(s: string) {
  if (s.startsWith("{") && s.endsWith("}")) {
    return s.slice(1, -1);
  } else {
    return s;
  }
}

const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED });

const BeginTikzPictureCmd = createToken({
  name: "BeginTikzPictureCmd",
  pattern: /\\begin\{tikzpicture\}/,
});
const EndTikzPictureCmd = createToken({
  name: "EndTikzPictureCmd",
  pattern: /\\end\{tikzpicture\}/,
});
const BeginLayerCmd = createToken({ name: "BeginLayerCmd", pattern: /\\begin\{pgfonlayer\}/ });
const EndLayerCmd = createToken({ name: "EndLayerCmd", pattern: /\\end\{pgfonlayer\}/ });
const TikzStyleCmd = createToken({ name: "TikzStyleCmd", pattern: /\\tikzstyle/ });

const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
const RBracket = createToken({ name: "RBracket", pattern: /\]/ });
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Period = createToken({ name: "Period", pattern: /\./ });
const Equals = createToken({ name: "Equals", pattern: /=/ });

const DrawCmd = createToken({ name: "DrawCmd", pattern: /\\draw/ });
const NodeCmd = createToken({ name: "NodeCmd", pattern: /\\node/ });
const PathCmd = createToken({ name: "PathCmd", pattern: /\\path/ });
const Node = createToken({ name: "Node", pattern: /node/ });
const Rectangle = createToken({ name: "Rectangle", pattern: /rectangle/ });
const At = createToken({ name: "At", pattern: /at/ });
const To = createToken({ name: "To", pattern: /to/ });
const Cycle = createToken({ name: "Cycle", pattern: /cycle/ });

const DelimString = createToken({ name: "DelimString", pattern: matchDelimString });
const ArrowDef = createToken({ name: "ArrowDef", pattern: /[a-zA-Z<>|]*-[a-zA-Z<>|]*/ });
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });
const Int = createToken({ name: "Int", pattern: /-?\d+/ });
const Float = createToken({ name: "Float", pattern: /-?\d+\.\d+/ });

const allTokens = [
  WhiteSpace,
  BeginTikzPictureCmd,
  EndTikzPictureCmd,
  BeginLayerCmd,
  EndLayerCmd,
  TikzStyleCmd,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Semicolon,
  Comma,
  Period,
  Equals,
  DrawCmd,
  NodeCmd,
  PathCmd,
  Node,
  Rectangle,
  At,
  To,
  Cycle,
  DelimString,
  Identifier,
  Float,
  Int,
  ArrowDef,
];

class ParseError extends Error {
  public line: number;
  public column: number;
  constructor(line: number, column: number, message: string) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

class TikzParser extends EmbeddedActionsParser {
  private graph: Graph = new Graph();
  private styles: StyleData[] = [];
  private d: Data = new Data(-1);
  private nodeTab: Map<string, number> = new Map();

  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public reset() {
    this.graph = new Graph();
    this.styles = [];
    this.d = new Data(-1);
    this.nodeTab = new Map();
  }

  public tikz = this.RULE("tikz", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.tikzPicture) },
      { ALT: () => this.SUBRULE(this.tikzStyles) },
    ]);
  });

  public tikzPicture = this.RULE("tikzPicture", () => {
    this.CONSUME(BeginTikzPictureCmd);
    this.SUBRULE(this.optProperties);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.node) },
        { ALT: () => this.SUBRULE(this.edge) },
        { ALT: () => this.SUBRULE(this.boundingBox) },
        { ALT: () => this.SUBRULE(this.ignore) },
      ]);
    });
    this.CONSUME(EndTikzPictureCmd);

    return this.graph;
  });

  public tikzStyles = this.RULE("tikzStyles", () => {
    this.MANY(() => {
      this.SUBRULE(this.style);
    });

    return this.styles;
  });

  public style = this.RULE("style", () => {
    this.CONSUME(TikzStyleCmd);

    const d = new StyleData(this.styles.length);
    d.name = stripBraces(this.CONSUME(DelimString).image);

    this.CONSUME(Equals);

    this.d = d;
    this.SUBRULE(this.properties);
    this.styles.push(d);
  });

  private optProperties = this.RULE("optProperties", () => {
    this.OPTION(() => {
      this.SUBRULE(this.properties);
    });
  });

  private properties = this.RULE("properties", () => {
    this.CONSUME(LBracket);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.property),
    });
    this.CONSUME(RBracket);
  });

  private property = this.RULE("property", () => {
    const key = this.SUBRULE(this.propertyVal);
    let val = null;
    this.OPTION(() => {
      this.CONSUME(Equals);
      this.OR([
        { ALT: () => (val = stripBraces(this.CONSUME(DelimString).image)) },
        { ALT: () => (val = this.SUBRULE1(this.propertyVal)) },
      ]);
    });

    if (val !== null) {
      this.d.setProperty(key, val);
    } else {
      this.d.setAtom(key);
    }
  });

  private propertyVal = this.RULE("propertyVal", () => {
    let s = "";
    this.MANY(() => {
      this.OR([
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Identifier).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Int).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Float).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(ArrowDef).image) },
      ]);
    });
    return s;
  });

  private nodeName = this.RULE("nodeName", () => {
    return this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(Int) },
    ]);
  });

  private nodeAnchor = this.RULE("nodeAnchor", () => {
    return this.OR([
      { ALT: () => this.CONSUME(Identifier).image },
      { ALT: () => this.CONSUME(Int).image }
    ]);
  });

  private node = this.RULE("node", () => {
    const d = new NodeData(-1);

    this.CONSUME(NodeCmd);

    this.d = d;
    this.SUBRULE(this.optProperties);

    this.CONSUME(LParen);

    const name = this.SUBRULE(this.nodeName).image;
    const parsed = parseInt(name, 10);
    d.id = isNaN(parsed) ? this.graph.freshNodeId() : parsed;
    this.nodeTab.set(name, d.id);

    this.CONSUME(RParen);
    this.CONSUME(At);
    d.coord = this.SUBRULE(this.coord);

    const labelToken = this.CONSUME(DelimString);
    d.label = stripBraces(labelToken.image);
    d.labelStart = labelToken.startOffset;
    d.labelEnd = labelToken.endOffset;
    this.CONSUME(Semicolon);

    this.graph.addNodeWithData(d);
  });

  private coord = this.RULE("coord", () => {
    this.CONSUME(LParen);
    const x = this.SUBRULE(this.num);
    this.CONSUME(Comma);
    const y = this.SUBRULE1(this.num);
    this.CONSUME(RParen);

    return [x, y] as Coord;
  });

  private num = this.RULE("num", () => {
    return this.OR([
      { ALT: () => parseInt(this.CONSUME(Int).image, 10) },
      { ALT: () => parseFloat(this.CONSUME(Float).image) },
    ]);
  });

  private nodeRef = this.RULE("nodeRef", () => {
    this.CONSUME(LParen);
    const nameToken = this.SUBRULE(this.nodeName);
    const name = nameToken.image;
    let id = 0;
    if (this.nodeTab.has(name)) {
      id = this.nodeTab.get(name) ?? 0;
    } else {
      throw new ParseError(
        nameToken.startLine ?? 1,
        nameToken.startColumn ?? 1,
        `Node reference not found: ${name}`
      );
    }

    const anchor = this.OPTION(() => {
      this.CONSUME(Period);
      return this.SUBRULE1(this.nodeAnchor);
    });
    this.CONSUME(RParen);

    return [id, anchor] as [number, string?];
  });

  private optNodeRef = this.RULE("optNodeRef", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.nodeRef) },
      {
        ALT: () => {
          this.CONSUME(LParen);
          this.CONSUME(RParen);
        },
      },
      { ALT: () => this.CONSUME(Cycle) },
    ]);
  });

  private optEdgeNode = this.RULE("optEdgeNode", () => {
    this.OPTION(() => {
      this.CONSUME(Node);
      this.SUBRULE(this.optProperties);
      this.CONSUME(DelimString);
    });
  });

  private edgeSource = this.RULE("edgeSource", (graph?: Graph) => {
    this.SUBRULE(this.optProperties);
    this.SUBRULE(this.nodeRef);
  });

  private edgeTarget = this.RULE("edgeTarget", (source?: number, graph?: Graph) => {
    this.CONSUME(To);
    this.SUBRULE(this.optProperties);
    this.SUBRULE(this.optEdgeNode);
    this.SUBRULE(this.optNodeRef);
  });

  private edge = this.RULE("edge", (graph?: Graph) => {
    this.CONSUME(DrawCmd);
    this.SUBRULE(this.edgeSource);
    this.AT_LEAST_ONE(() => this.SUBRULE(this.edgeTarget, { ARGS: [0, graph] }));
    this.CONSUME(Semicolon);
  });

  private boundingBox = this.RULE("boundingBox", () => {
    this.CONSUME(PathCmd);
    this.SUBRULE(this.optProperties);
    this.SUBRULE(this.coord);
    this.CONSUME(Rectangle);
    this.SUBRULE1(this.coord);
    this.CONSUME(Semicolon);
  });

  private ignore = this.RULE("ignore", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(BeginLayerCmd);
          this.CONSUME(DelimString);
        },
      },
      { ALT: () => this.CONSUME(EndLayerCmd) },
    ]);
  });
}

const lexer = new Lexer(allTokens);
const parser = new TikzParser();

interface ParseTikzPictureResult {
  result?: Graph;
  errors: ParseError[];
}

function parseTikzPicture(input: string): ParseTikzPictureResult {
  parser.reset();
  const lexResult = lexer.tokenize(input);
  if (lexResult.errors.length > 0) {
    return {
      errors: lexResult.errors.map(e => new ParseError(
        e.line || 1,
        e.column || 1,
        e.message
      )),
    };
  }

  parser.input = lexResult.tokens;

  try {
    const graph = parser.tikzPicture();

    if (parser.errors.length > 0) {
      return {
        errors: parser.errors.map(e => new ParseError(
          e.token?.startLine || 1,
          e.token?.startColumn || 1,
          e.message
        )),
      };
    }

    return {
      result: graph,
      errors: [],
    };
  } catch (e) {
    if (e instanceof ParseError) {
      return {
        errors: [e],
      };
    } else {
      throw e;
    }
  }
}

export { parseTikzPicture, ParseTikzPictureResult };
