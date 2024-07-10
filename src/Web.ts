export class Web {
  public nodes: Map<string, string[]> = new Map();

  public getMutualLinks(): UnorderedStringPairs {
    const links: UnorderedStringPairs = new UnorderedStringPairs();

    // Iterate through nodes to find mutual links
    for (const [source, following] of this.nodes.entries()) {
      for (const target of following) {
        if (
          this.nodes.has(target) &&
          new Set(this.nodes.get(target)).has(source)
        ) {
          links.add(target, source);
        }
      }
    }

    return links;
  }
}

class UnorderedStringPairs {
  public pairs: Map<string, string> = new Map();

  public add(former: string, latter: string) {
    const normalizedPair = [former.toLowerCase(), latter.toLowerCase()].sort();

    this.pairs.set(normalizedPair[0], normalizedPair[1]);
  }
}
