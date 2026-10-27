const render = (props) => (
  <ul>
    <for value={(item) in props.items}>
      <li>{item.name}</li>
      <li>meta</li>
    </for>
  </ul>
);
