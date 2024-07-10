import { Octokit } from "octokit";
import fs from "fs";
import { Web } from "./Web.js";

const GITHUB_TOKEN = fs.readFileSync("./token.txt").toString();
const MAIN_USER = "hexadecimal233";
const MAX_FOLLOWING = 500;

const NOPE = '{"nope":true}';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Get following usernames
async function getFollowings(username: string): Promise<string[]> {
  // Read cahce if available
  let cacheName = `./cache/${username}.json`;

  let followings = [];

  if (fs.existsSync(cacheName)) {
    let strings = fs.readFileSync(cacheName, "utf-8");
    if (strings == NOPE) {
      console.debug(`${username} has no following users, skipping.`);
      return [];
    }

    followings = JSON.parse(strings);
    console.debug(
      `Get ${username}'s follwoings from cache: ${followings.length} followings`
    );
  } else {
    // Get current user data
    let userData = (
      await octokit.rest.users.getByUsername({
        username: username,
      })
    ).data;

    // Skip users w/o follwings or too many followers
    if (userData.following == 0 || userData.following >= MAX_FOLLOWING) {
      console.debug(
        `${username} has ${
          userData.following >= MAX_FOLLOWING ? "too many" : "no"
        } following users, skipping.`
      );
      fs.writeFile(cacheName, '{"nope":true}', () => {});
    } else {
      // Add follower data to username array
      let pagesMax = Math.ceil(userData.following / 100);

      for (let i = 1; i <= pagesMax; i++) {
        let followerData = (
          await octokit.rest.users.listFollowingForUser({
            username: username,
            per_page: 100,
            page: i,
          })
        ).data;
        followerData.map((user) => {
          followings.push(user.login);
        });

        console.debug(
          `Getting ${username}'s follwoings: ${i}/${pagesMax} pages`
        );
      }

      // Save cache and return
      fs.writeFile(cacheName, JSON.stringify(followings), () => {});

      console.debug(
        `Get ${username}'s follwoings: ${userData.following} followings`
      );
    }
  }

  return followings;
}

let mainFollowings = await getFollowings(MAIN_USER);
let allUsers = new Web();
allUsers.nodes.set(MAIN_USER, mainFollowings);

console.log(
  `At most ${
    mainFollowings.length * 5
  } API points will be used (Assuming every user have 500 followers). Watch out! -- You only have 5000 points.`
);

for (let user of mainFollowings) {
  let followings = await getFollowings(user);
  if (followings.length != 0) {
    allUsers.nodes.set(user, followings);
  }
}

console.log(`${allUsers.nodes.size}/${mainFollowings.length} users loaded!`);

let output = "互关的人：";
for (const [p1, p2] of allUsers.getMutualLinks().pairs) {
  output += `${p1} <=> ${p2}\n`;
}

fs.writeFileSync("./result.txt", output);

console.log('Mutual followers saved to "result.txt".');
