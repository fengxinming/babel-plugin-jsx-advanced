const render = (props) => (
  <ul>
    <li x-for={(item) in props.items}>{item}</li>
    <for value={(item) in props.items}><li>{item}</li></for>
  </ul>
);
