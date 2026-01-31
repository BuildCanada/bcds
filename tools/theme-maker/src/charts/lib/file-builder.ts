export function line(content: string, depth: number): string {
  return `\n${"\t".repeat(depth)}${content}`;
}

export class FileBuilder {
  private lines: string[] = [];

  addLine(content: string, depth: number = 0): void {
    this.lines.push(`${"\t".repeat(depth)}${content}`);
  }

  addEmptyLine(): void {
    this.lines.push("");
  }

  build(): string {
    return this.lines.join("\n");
  }
}
