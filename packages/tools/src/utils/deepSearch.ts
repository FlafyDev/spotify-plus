// https://stackoverflow.com/a/42252916/10849036
type objectPredicate = (obj: any) => boolean;
const deepSearch = (obj: any, predicate: objectPredicate, maxRecursion = -1, limit = -1) => {
  let result: any[] = [];
  if (obj && predicate(obj)) {
    limit -= 1;
    result.push(obj);
    if (limit === 0)
      return result;
  }
  for (let p in obj) {
    if (typeof (obj[p]) == 'object') {
      if (maxRecursion !== 0) {
        result = result.concat(deepSearch(obj[p], predicate, maxRecursion - 1, limit));
      }
    }
  }
  return result;
}

export { objectPredicate };
export default deepSearch;