const render = (props) => (
  <ul className="list">
    <li x-for={(item, i) in props.items} key={i}>{item}</li>
  </ul>
);
