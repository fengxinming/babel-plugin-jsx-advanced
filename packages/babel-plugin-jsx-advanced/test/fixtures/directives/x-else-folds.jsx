const render = (props) => (
  <div>
    <span x-if={props.a}>A</span>
    <span x-else>B</span>
    <p>after</p>
  </div>
);
