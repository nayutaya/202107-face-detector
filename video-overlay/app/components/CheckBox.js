export default function CheckBox({ id, checked, setChecked, children }) {
  return (
    <label>
      <input
          type="checkbox"
          checked={checked[id]}
          onChange={(e) => {
            const copied = {...checked};
            copied[id] = e.target.checked;
            setChecked(copied);
          }} />
      <span style={{cursor: "pointer"}}>
        {children}
      </span>
    </label>
  );
}
