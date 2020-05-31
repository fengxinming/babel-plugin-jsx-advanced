export default function (styles, value) {
  return !styles
    ? value
      ? {}
      : { display: 'none' }
    : value
      ? styles
      : Object.assign({}, styles);
}
