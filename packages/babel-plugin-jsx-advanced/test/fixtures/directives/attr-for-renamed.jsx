const render = (props) => (
  <ul>
    <li each={(item) in props.items}>{item}</li>
    <li x-for={props.items}>{item}</li>
  </ul>
);
