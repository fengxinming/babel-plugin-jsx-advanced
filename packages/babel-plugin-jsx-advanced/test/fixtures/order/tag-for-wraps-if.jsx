const render = (props) => (
  <ul>
    <for value={(item) in props.items}>
      <li x-if={item.ok}>{item.name}</li>
    </for>
  </ul>
);
