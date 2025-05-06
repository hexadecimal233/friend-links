import { Octokit } from "octokit";
import fs from "fs";
import { UserGraph } from "./usergraph.js";

const GITHUB_TOKEN = fs.readFileSync("./token.txt").toString();
const MAIN_USER = "hexadecimal233";
const MAX_FOLLOWING = 500;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getFollowings(
  username: string,
  ignoreLimit: boolean = false
): Promise<string[]> {
  let cacheName = `./cache/${username}.json`;

  if (fs.existsSync(cacheName)) {
    let strings = fs.readFileSync(cacheName, "utf-8");
    const followings = JSON.parse(strings);
    if (followings.length === 0) {
      console.debug(`${username} has no following users, skipping.`);
      return [];
    }
    console.debug(
      `Get ${username}'s followings from disk cache: ${followings.length}`
    );
    return followings;
  }

  try {
    // 获取当前用户数据
    const userData = (await octokit.rest.users.getByUsername({ username }))
      .data;

    // 跳过无关注或关注数过多的用户
    if (
      userData.following === 0 ||
      (userData.following >= MAX_FOLLOWING && !ignoreLimit)
    ) {
      console.debug(
        `${username} has ${
          userData.following >= MAX_FOLLOWING ? "too many" : "no"
        } following users, skipping.`
      );
      fs.writeFileSync(cacheName, "[]");
      return [];
    }

    // 分页获取关注列表
    const followings: string[] = [];
    const pagesMax = Math.ceil(userData.following / 100);

    for (let i = 1; i <= pagesMax; i++) {
      const followerData = (
        await octokit.rest.users.listFollowingForUser({
          username,
          per_page: 100,
          page: i,
        })
      ).data;

      followings.push(...followerData.map((user) => user.login));
      console.debug(`Getting ${username}'s followings: ${i}/${pagesMax} pages`);
    }

    // 缓存到磁盘和内存
    fs.writeFileSync(cacheName, JSON.stringify(followings));

    console.debug(
      `Get ${username}'s followings: ${userData.following} followings`
    );

    return followings;
  } catch (error: any) {
    console.error(`Failed to fetch followings for ${username}:`, error.message);
    return [];
  }
}

// 主函数
(async () => {
  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");

  const mainFollowings = await getFollowings(MAIN_USER, true);
  const allUsers = new UserGraph();
  allUsers.nodes.set(MAIN_USER, mainFollowings);

  console.log(
    `At most ${
      mainFollowings.length * 5
    } API points will be used (Assuming every user have 500 followers). Watch out! -- You only have 5000 points.`
  );

  for (let user of mainFollowings) {
    const followings = await getFollowings(user);
    if (followings.length > 0) {
      allUsers.nodes.set(user, followings);
    }
  }

  console.log(`已加载 ${allUsers.nodes.size}/${mainFollowings.length}!`);

  let mutuals = "";
  for (const [p1, p2] of allUsers.getMutualLinks()) {
    mutuals += `${p1} <=> ${p2}\n`;
  }

  fs.writeFileSync("./result.txt", "互关的人：\n" + mutuals);
  console.log('互关用户已经保存至"result.txt"');
})();
