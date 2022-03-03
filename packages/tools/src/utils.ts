import fs from 'fs/promises';

const fileExists = async (path: string) => {
  return await fs.access(path).then(() => true).catch(() => false)
}

// https://stackoverflow.com/a/42252916/10849036
const deepSearch = (obj: any, predicate: (key: any, value: any) => boolean) => {
  let result: any[] = [];
  for (let p in obj) { // iterate on every property
    // tip: here is a good idea to check for hasOwnProperty
    if (typeof (obj[p]) == 'object') { // if its object - lets search inside it
      result = result.concat(deepSearch(obj[p], predicate));
    } else if (predicate(p, obj[p]))
      result.push(
        obj
      ); // check condition
  }
  return result;
}

const insertString = (str: string, line: number, column: number, subtext: string) => {
  const lines = str.split("\n");
  lines[line] = lines[line].slice(0, column) + subtext + lines[line].slice(column);
  return lines.join("\n");
}

const modifyFile = async (file: string, modify: (content: string) => string | Promise<string>) => {
  await fs.writeFile(file, await modify((await fs.readFile(file)).toString()));
}

export { fileExists, deepSearch, insertString, modifyFile };

