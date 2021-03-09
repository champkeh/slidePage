export function getQueryParam(url = location.href) {
  const query_match = url.match(/([^?=&]+)(=([^&]*))/g)
  return !!query_match && query_match.reduce((a, v) => (a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a), {});
}

export function isEqualNode(el1, el2) {
  return el1 === el2
}

export function isDOM(obj) {
  if ((obj instanceof NodeList) || (obj instanceof HTMLCollection) && obj.length > 0) {
    var isTrue = 0;
    var len = obj.length
    for (let i = 0; i < len; i++) {
      (obj[i] instanceof Element) && (isTrue++);
    }
    return isTrue === len;
  } else {
    return (obj instanceof Element);
  }
}

export function merge() {
  const merged = {};
  const argsLen = arguments.length;
  for (let i = 0; i < argsLen; i++) {
    const obj = arguments[i]
    for (const key in obj) {
      merged[key] = obj[key];
    }
  }
  return merged;
}
