import { Octokit } from "octokit";
import fs from "fs";

const GITHUB_TOKEN = fs.readFileSync("../token.txt");

const MAIN_USER = "hexadecimal233";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// null = operation failed
async function getFollowings(username: string) {
  let userData = (
    await octokit.rest.users.getByUsername({
      username: username,
    })
  ).data;

  // Skip users w/o follwings
  if (userData.following != 0) {
    if (userData.following >= 500) {
      console.log(
        `${userData.login} has ${userData.following} following users, exceeded the 500 limit, skipping.`
      );
      return null;
    }

    let pagesMax = Math.ceil(userData.following / 100);

    let followings = [];
    for (let i = 1; i <= pagesMax; i++) {
      followings = followings.concat(
        (
          await octokit.rest.users.listFollowingForUser({
            username: username,
            per_page: 100,
            page: i,
          })
        ).data
      );
      console.log(
        `Getting ${userData.login}'s follwoings: ${i}/${pagesMax} Pages`
      );
    }

    return followings;
  } else {
    return null;
  }
}

/*
主要功能：获取你所有关注的用户里的用户网
1. 获取Follwing的用户
获取
*/

console.log(await getFollowings("hexadecimal233"));
