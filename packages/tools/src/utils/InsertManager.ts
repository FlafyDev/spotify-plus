interface Change {
  line: number,
  column: number,
  str: string,
}

class InsertManager {
  changes: Change[] = []

  constructor(public str: string) { }

  insert(line: number, column: number, str: string) {
    this.changes.push({
      line, column, str
    });
  }

  getString() {
    this.changes = this.changes.sort((firstChange, secondChange) => {
      return secondChange.line - firstChange.line || secondChange.column - firstChange.column;
    })

    for (const change of this.changes) {
      this.str = InsertManager.insertString(this.str, change.line, change.column, change.str);
    }
    return this.str;
  }

  static insertString(str: string, line: number, column: number, subtext: string) {
    const lines = str.split("\n");
    lines[line] = lines[line].slice(0, column) + subtext + lines[line].slice(column);
    return lines.join("\n");
  }
}

export default InsertManager;