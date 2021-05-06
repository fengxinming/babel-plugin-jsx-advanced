import forOwn from 'celia/es/forOwn';

function isArrayLike(value) {
  return !!value
    && typeof value.length === 'number'
    && typeof value !== 'function';
}

export default function (val, render) {
  let ret = null;
  let i = 0;
  let len = 0;
  if (val) {
    if (isArrayLike(val)) {
      len = val.length;
      ret = new Array(len);
      for (i = 0; i < len; i++) {
        ret[i] = render(val[i], i, i, val);
      }
    }
    else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i, i, val);
      }
    }
    else if (typeof val === 'object') {
      ret = [];
      forOwn(val, (v, k) => {
        ret[i] = render(v, k, i, val);
        i += 1;
      });
    }
  }
  return ret;
}
