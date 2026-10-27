const render = (props) => (
  <div>
    <if value={props.a}>A</if>
    <elif value={props.b}>B</elif>
    <else>C</else>
  </div>
);
