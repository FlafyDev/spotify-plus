import fs from 'fs/promises';

const fileExists = async (path: string) => {
  return await fs.access(path).then(() => true).catch(() => false)
}

export default fileExists;
