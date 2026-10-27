const render = (props) => (
  <section>
    <h1>title</h1>
    <span x-if={props.a}>A</span>
    <span x-elif={props.b}>B</span>
    <span x-else>C</span>
    <footer>end</footer>
  </section>
);
