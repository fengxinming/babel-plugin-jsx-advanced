const render = (props) => (
  <div>
    <span when={props.a}>A</span>
    <span also={props.b}>B</span>
    <span otherwise>C</span>
  </div>
);
