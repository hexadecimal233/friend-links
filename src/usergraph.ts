export class UserGraph {
  nodes: Map<string, string[]> = new Map();

  // 添加单向关系
  addRelationship(fromUser: string, toUser: string): void {
    if (!this.nodes.has(fromUser)) {
      this.nodes.set(fromUser, []);
    }
    const relationships = this.nodes.get(fromUser)!;
    if (!relationships.includes(toUser)) {
      relationships.push(toUser);
    }
  }

  // 检查两个用户是否有双向关系
  hasMutualRelationship(user1: string, user2: string): boolean {
    const user1Follows = this.nodes.get(user1) || [];
    const user2Follows = this.nodes.get(user2) || [];

    return user1Follows.includes(user2) && user2Follows.includes(user1);
  }

  getMutualLinks(): [string, string][] {
    const pairs: [string, string][] = [];

    const users = Array.from(this.nodes.keys());

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i];
        const userB = users[j];

        if (this.hasMutualRelationship(userA, userB)) {
          pairs.push([userA, userB]);
        }
      }
    }

    return pairs;
  }
}
