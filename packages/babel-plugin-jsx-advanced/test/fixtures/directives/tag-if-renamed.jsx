const render = (props) => (
  <div>
    <when value={props.a}>A</when>
    <also value={props.b}>B</also>
    <otherwise>C</otherwise>
  </div>
);
