export default function (styles, value) {
  return value
    ? styles
    : Object.assign({}, styles);
}
