const render = (props) => (
  <div>
    <loop value={(item) in props.items}><li>{item}</li></loop>
    <for value={props.items}><li>stay</li></for>
  </div>
);
