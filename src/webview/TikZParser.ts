// @ts-ignore - esbuild handles ES module conversion
import { createToken, CstParser } from "chevrotain";

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

const BeginTikzPicture = createToken({ name: "BeginTikzPicture", pattern: /\\begin\{tikzpicture\}/ });
const EndTikzPicture = createToken({ name: "EndTikzPicture", pattern: /\\end\{tikzpicture\}/ });
const BeginLayer = createToken({ name: "BeginLayer", pattern: /\\begin\{pgfonlayer\}/ });
const EndLayer = createToken({ name: "EndLayer", pattern: /\\end\{pgfonlayer\}/ });

const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Equals = createToken({ name: "Equals", pattern: /=/ });

const Draw = createToken({ name: "Draw", pattern: /\\draw/ });
const Node = createToken({ name: "Node", pattern: /\\node/ });
const Rectangle = createToken({ name: "Rectangle", pattern: /rectangle/ });
const At = createToken({ name: "At", pattern: /at/ });
const To = createToken({ name: "To", pattern: /to/ });
const Cycle = createToken({ name: "Cycle", pattern: /cycle/ });

const DelimString = createToken({ name: "DelimString", pattern: matchDelimString });
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });
const Int = createToken({ name: "Int", pattern: /-?\d+/ });
const Float = createToken({ name: "Float", pattern: /-?\d+\.\d+/ });

const allTokens = [
    BeginTikzPicture,
    EndTikzPicture,
    BeginLayer,
    EndLayer,
    LParen,
    RParen,
    Semicolon,
    Comma,
    Equals,
    Draw,
    Node,
    Rectangle,
    At,
    To,
    Cycle,
    DelimString,
    Identifier,
    Int,
    Float
];

class TikzParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }
}

export default TikzParser;