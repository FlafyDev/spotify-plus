import fs from 'fs/promises';

const modifyFile = async (file: string, modify: (content: string) => string | Promise<string>) => {
  await fs.writeFile(file, await modify((await fs.readFile(file)).toString()));
}

export default modifyFile;