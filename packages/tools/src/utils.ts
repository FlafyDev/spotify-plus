import fs from 'fs/promises';

const fileExists = async (path: string) => {
  return await fs.access(path).then(() => true).catch(() => false)
}

// https://stackoverflow.com/a/42252916/10849036
type objectPredicate = (obj: any) => boolean;
const deepSearch = (obj: any, predicate: objectPredicate, maxRecursion = -1) => {
  let result: any[] = [];
  if (obj && predicate(obj)) {
    result.push(
      obj
    );
  }
  for (let p in obj) {
    if (typeof (obj[p]) == 'object') {
      if (maxRecursion !== 0) {
        result = result.concat(deepSearch(obj[p], predicate, maxRecursion - 1));
      }
    }
  }
  return result;
}

// const deepValidate = (obj: any, predicates: objectPredicate[], answeredPredicates?: boolean[]) => {
//   if (!answeredPredicates) {
//     answeredPredicates = Array(predicates.length).fill(false);
//   }

//   for (let p in obj) { // iterate on every property
//     // tip: here is a good idea to check for hasOwnProperty
//     if (typeof (obj[p]) == 'object') { // if its object - lets search inside it
//       deepValidate(obj[p], predicates, answeredPredicates);
//     } else {
//       // Run our unanswered predicates
//       predicates.forEach((predicate, i) => {
//         if (!answeredPredicates![i]) {
//           answeredPredicates![i] = predicate(p, obj[p]);
//         }
//       });
//     }
//   }
//   return answeredPredicates.every((e => e));
// }


const insertString = (str: string, line: number, column: number, subtext: string) => {
  const lines = str.split("\n");
  lines[line] = lines[line].slice(0, column) + subtext + lines[line].slice(column);
  return lines.join("\n");
}

const modifyFile = async (file: string, modify: (content: string) => string | Promise<string>) => {
  await fs.writeFile(file, await modify((await fs.readFile(file)).toString()));
}

export { fileExists, deepSearch, insertString, modifyFile };

