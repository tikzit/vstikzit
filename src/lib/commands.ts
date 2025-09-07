interface Command {
  name: string;
  shortcuts: string[];
  description: string;
}

const commands: Command[] = [
  { name: "vstikzit.selectTool", shortcuts: ["S"], description: "Select tool" },
  { name: "vstikzit.nodeTool", shortcuts: ["N"], description: "Node tool" },
  { name: "vstikzit.edgeTool", shortcuts: ["E"], description: "Edge tool" },
  { name: "vstikzit.delete", shortcuts: ["Delete"], description: "Delete items" },
  { name: "vstikzit.zoomOut", shortcuts: ["-", "_"], description: "Zoom out" },
  { name: "vstikzit.zoomIn", shortcuts: ["Plus", "="], description: "Zoom in" },
  { name: "vstikzit.cut", shortcuts: ["Ctrl+X"], description: "Cut" },
  { name: "vstikzit.copy", shortcuts: ["Ctrl+C"], description: "Copy" },
  { name: "vstikzit.paste", shortcuts: ["Ctrl+V"], description: "Paste" },
  { name: "vstikzit.jumpToTikz", shortcuts: ["Ctrl+Shift+J"], description: "Jump to TikZ" },
  { name: "vstikzit.selectAll", shortcuts: ["Ctrl+A"], description: "Select all" },
  { name: "vstikzit.deselectAll", shortcuts: ["Ctrl+D"], description: "Deselect all" },
  { name: "vstikzit.moveLeft", shortcuts: ["Ctrl+ArrowLeft"], description: "Move left" },
  { name: "vstikzit.moveRight", shortcuts: ["Ctrl+ArrowRight"], description: "Move right" },
  { name: "vstikzit.moveUp", shortcuts: ["Ctrl+ArrowUp"], description: "Move up" },
  { name: "vstikzit.moveDown", shortcuts: ["Ctrl+ArrowDown"], description: "Move down" },
  { name: "vstikzit.nudgeLeft", shortcuts: ["Ctrl+Shift+ArrowLeft"], description: "Nudge left" },
  { name: "vstikzit.nudgeRight", shortcuts: ["Ctrl+Shift+ArrowRight"], description: "Nudge right" },
  { name: "vstikzit.nudgeUp", shortcuts: ["Ctrl+Shift+ArrowUp"], description: "Nudge up" },
  { name: "vstikzit.nudgeDown", shortcuts: ["Ctrl+Shift+ArrowDown"], description: "Nudge down" },
];

const getCommandFromShortcut = (shortcut: string): Command | undefined => {
  return commands.find(command => command.shortcuts.includes(shortcut));
};

// const commandForName = (name: string): Command | undefined => {
//   return commands.find(command => command.name === name);
// };

export { Command, commands, getCommandFromShortcut };
