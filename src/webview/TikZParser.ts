// @ts-ignore - esbuild handles ES module conversion
import { createToken, Lexer, CstParser } from "chevrotain";

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

const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED });

const BeginTikzPictureCmd = createToken({ name: "BeginTikzPictureCmd", pattern: /\\begin\{tikzpicture\}/ });
const EndTikzPictureCmd = createToken({ name: "EndTikzPictureCmd", pattern: /\\end\{tikzpicture\}/ });
const BeginLayerCmd = createToken({ name: "BeginLayerCmd", pattern: /\\begin\{pgfonlayer\}/ });
const EndLayerCmd = createToken({ name: "EndLayerCmd", pattern: /\\end\{pgfonlayer\}/ });
const TikzStyleCmd = createToken({ name: "TikzStyleCmd", pattern: /\\tikzstyle/ });

const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Equals = createToken({ name: "Equals", pattern: /=/ });

const DrawCmd = createToken({ name: "DrawCmd", pattern: /\\draw/ });
const NodeCmd = createToken({ name: "NodeCmd", pattern: /\\node/ });
const Rectangle = createToken({ name: "Rectangle", pattern: /rectangle/ });
const At = createToken({ name: "At", pattern: /at/ });
const To = createToken({ name: "To", pattern: /to/ });
const Cycle = createToken({ name: "Cycle", pattern: /cycle/ });

const DelimString = createToken({ name: "DelimString", pattern: matchDelimString });
const PropertyString = createToken({ name: "PropertyString", pattern: /([a-zA-Z<>|]*-[a-zA-Z<>|]*|[a-zA-Z_][a-zA-Z0-9_]*)/ });
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
    Semicolon,
    Comma,
    Equals,
    DrawCmd,
    NodeCmd,
    Rectangle,
    At,
    To,
    Cycle,
    DelimString,
    PropertyString,
    Int,
    Float
];

class TikzParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public tikz = this.RULE("tikz", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.tikzPicture) },
      { ALT: () => this.SUBRULE(this.tikzStyles) },
    ]);
  });

  public tikzPicture = this.RULE("tikzPicture", () => {
    this.CONSUME(BeginTikzPictureCmd);
    this.CONSUME(EndTikzPictureCmd);
  });

  public tikzStyles = this.RULE("tikzStyles", () => {
    this.CONSUME(TikzStyleCmd);
  });
}

export default TikzParser;