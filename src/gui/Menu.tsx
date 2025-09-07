interface MenuProps {
  onCommand: (commandName: string) => void;
}

const Menu = ({ onCommand }: MenuProps) => {
  return (
    <div className="menu">
      <button onClick={() => onCommand("vstikzit.selectAll")}>Select All</button>
      <button onClick={() => onCommand("vstikzit.deselectAll")}>Deselect All</button>
      <button onClick={() => onCommand("vstikzit.nudgeLeft")}>Nudge Left</button>
    </div>
  );
};

export default Menu;
