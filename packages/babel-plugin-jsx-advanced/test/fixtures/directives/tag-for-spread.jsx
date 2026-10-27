const render = (props) => (
  <ul>
    <for {...props.rest} value={(item) in props.items}><li>{item}</li></for>
  </ul>
);
