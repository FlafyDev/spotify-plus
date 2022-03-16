const esprima = require('esprima');
import fs from 'fs';
import fsPromise from 'fs/promises';
import InsertManager from './InsertManager';

class JSModifyManager {
  originalContent;
  parsed;
  private _insertManager;

  constructor(public filePath: string) {
    this.originalContent = (fs.readFileSync(this.filePath)).toString();
    this.parsed = esprima.parseScript(this.originalContent, { loc: true });
    this._insertManager = new InsertManager(this.originalContent);
  }

  insert(line: number, column: number, newStr: string) {
    this._insertManager.insert(line, column, newStr);
  }

  async applyChanges() {
    await fsPromise.writeFile(this.filePath, this._insertManager.getString());
  }
}

export default JSModifyManager;