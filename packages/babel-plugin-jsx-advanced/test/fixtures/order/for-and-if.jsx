const render = (props) => (
  <ul>
    <li x-if={item.ok} x-for={(item) in props.items}>{item.name}</li>
  </ul>
);
