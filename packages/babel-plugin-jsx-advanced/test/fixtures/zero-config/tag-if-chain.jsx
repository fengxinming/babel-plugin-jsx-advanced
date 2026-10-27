const render = (props) => (
  <section>
    <p>before</p>
    <if value={props.a}>A</if>
    <elif value={props.b}>B</elif>
    <else>C</else>
    <p>after</p>
  </section>
);
