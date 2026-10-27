const render = (props) => (
  <div>
    <v-if value={props.a}>A</v-if>
    <v-else-if value={props.b}>B</v-else-if>
    <v-else>C</v-else>
  </div>
);
