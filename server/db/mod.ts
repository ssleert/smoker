import config from "@root/server/config/mod.ts";
import {
  Comment,
  CommentSchemaC,
  CommentVote,
  CommentVoteType,
  CommentVoteTypeSchemaC,
  Post,
  PostSchemaC,
  PostVote,
  PostVoteType,
  PostVoteTypeSchemaC,
  User,
  UserSchemaC,
} from "@root/server/db/model.ts";
import { assert } from "@std/assert";

type VoteCommentArgs = {
  userUlid: string;
  postUlid: string;
  commentUlid: string;
  voteType: CommentVoteType;
};

const get = async () => {
  const kv = await Deno.openKv(config.kvUrl);

  return {
    async addUser(u: User) {
      assert(UserSchemaC.Check(u), "validation error");

      const primaryKey = ["user", "ulid", u.ulid];
      const byEmailKey = ["user", "email", u.email];
      const byUsernameKey = ["user", "username", u.username];

      const res = await kv.atomic()
        .check({ key: byUsernameKey, versionstamp: null })
        .set(primaryKey, u)
        .set(byEmailKey, primaryKey)
        .set(byUsernameKey, primaryKey)
        .commit();

      return res.ok;
    },

    async getUserByEmail(email: string) {
      const userUlid = await kv.get<string[]>(["user", "email", email]);
      if (userUlid.value == null) {
        return null;
      }

      const u = await kv.get<User>(userUlid.value);
      if (u.value == null) {
        return null;
      }

      return u.value;
    },

    async getUserPosts(ulid: string, startKey: string) {
      const postsUlids = [] as string[][];

      const prefix = ["user", "post", ulid];
      const start = ["user", "post", ulid, startKey];

      const postIter = kv.list<string>({ prefix, start }, {
        limit: 15,
        reverse: true,
      });
      for await (const postUlid of postIter) {
        postsUlids.push(["post", "ulid", postUlid.value]);
      }

      const postsData = await kv.getMany<Post[]>(postsUlids);

      const posts = postsData.filter((p) => p.value != null).map((p) =>
        p.value
      );
      return posts;
    },

    async getUserPublicInfo(username: string) {
      const ulidKey = await kv.get<string[]>(["user", "username", username]);
      if (ulidKey.value == null) {
        return null;
      }

      const u = await kv.get<User>(ulidKey.value);
      if (u.value == null) {
        return null;
      }

      const posts = await this.getUserPosts(u.value.ulid, "0");

      return {
        ulid: u.value.ulid,
        username: u.value.username,
        avatar: u.value.avatar,
        date: u.value.date,
        posts: posts,
      };
    },

    async getUserAvatarAndUsername(ulids: string[]) {
      const keys = ulids.map((u) => ["user", "ulid", u]);
      const res = await kv.getMany<User[]>(keys);

      const users = {} as Record<string, {
        username: string;
        avatar: string;
      }>;

      res.filter((u) => u.value != null).forEach((u) =>
        users[u.value.ulid] = {
          username: u.value.username,
          avatar: u.value.avatar,
        }
      );

      return users;
    },

    async addPost(p: Post) {
      assert(PostSchemaC.Check(p), "validation error");

      const key = ["post", "ulid", p.ulid];
      const byUserKey = ["user", "post", p.userUlid, p.ulid];

      const res = await kv.atomic()
        .check({ key, versionstamp: null })
        .set(key, p)
        .set(byUserKey, key)
        .commit();

      return res.ok as boolean;
    },

    async getPost(ulid: string) {
      const res = await kv.get<Post>(["post", "ulid", ulid]);
      return res.value;
    },

    async getFeed(lastUlid: string) {
      const prefix = ["post", "ulid"];
      const start = ["post", "ulid", lastUlid];

      const posts: Post[] = [];

      const iter = kv.list<Post>({ prefix, start }, {
        limit: 15,
        reverse: true,
      });
      for await (const res of iter) {
        const userUlid = res.value.userUlid;
        const u = await kv.get<User>(["user", "ulid", userUlid]);
        if (u.value == null) {
          continue;
        }
        posts.push(res.value);
      }

      const users = await this.getUserAvatarAndUsername(
        posts.map((p) => p.userUlid),
      );

      return { posts, users };
    },

    async delPostVote(userUlid: string, postUlid: string) {
      const key = ["post", "vote", userUlid, postUlid];
      const postKey = ["post", "ulid", postUlid];

      const p = await kv.get<Post>(postKey);
      if (p.value == null) {
        return null;
      }

      const v = await kv.get<PostVote>(key);
      if (v.value == null) {
        return null;
      }

      if (v.value.type == "up") {
        p.value.votes -= 1;
      } else {
        p.value.votes += 1;
      }

      const res = await kv.atomic()
        .check(p)
        .check(v)
        .delete(key)
        .set(postKey, p.value)
        .commit();

      return res.ok as boolean;
    },

    async votePost(userUlid: string, postUlid: string, voteType: PostVoteType) {
      assert(PostVoteTypeSchemaC.Check(voteType), "validation error");

      const key = ["post", "vote", userUlid, postUlid];
      const postKey = ["post", "ulid", postUlid];

      const p = await kv.get<Post>(postKey);
      if (p.value == null) {
        return null;
      }

      const vote = await kv.get<PostVote>(key);
      if (vote.value?.type == voteType) {
        return true;
      }

      let votesAppend = 1;
      if (vote.value != null) {
        if (vote.value.type != voteType) {
          votesAppend += 1;
        }
      }
      if (voteType == "down") {
        votesAppend = -votesAppend;
      }

      const newVote: PostVote = {
        date: new Date(),
        postUlid: postUlid,
        userUlid: userUlid,
        type: voteType,
      };

      p.value.votes += votesAppend;

      const res = await kv.atomic()
        .check(vote)
        .set(key, newVote)
        .set(postKey, p.value)
        .commit();

      return res.ok;
    },

    async voteComment(args: VoteCommentArgs) {
      const {
        userUlid,
        commentUlid,
        postUlid,
        voteType,
      } = args;
      assert(CommentVoteTypeSchemaC.Check(voteType), "validation error");

      const key = ["comment", "vote", userUlid, postUlid, commentUlid];
      const commentKey = ["post", "comments", "ulid", postUlid, commentUlid];

      const c = await kv.get<Comment>(commentKey);
      if (c.value == null) {
        return null;
      }

      const vote = await kv.get<CommentVote>(key);
      if (vote.value?.type == voteType) {
        return true;
      }

      let votesAppend = 1;
      if (vote.value != null) {
        if (vote.value.type != voteType) {
          votesAppend += 1;
        }
      }
      if (voteType == "down") {
        votesAppend = -votesAppend;
      }

      const newVote: CommentVote = {
        date: new Date(),
        postUlid: postUlid,
        userUlid: userUlid,
        type: voteType,
      };

      c.value.votes += votesAppend;

      const res = await kv.atomic()
        .check(vote)
        .set(key, newVote)
        .set(commentKey, c.value)
        .commit();

      return res.ok;
    },

    async replyComment(postUlid: string, replyUlid?: string) {
      if (!replyUlid) {
        return null;
      }

      const replyKey = ["post", "comments", "ulid", postUlid, replyUlid];

      const res = await kv.get<Comment>(replyKey);
      if (res.value == null) {
        return null;
      }

      res.value.replyes += 1;

      return {
        c: res,
        key: replyKey,
      };
    },

    async addComment(c: Comment) {
      assert(CommentSchemaC.Check(c), "validation error");

      const primaryKey = ["post", "comments", "ulid", c.postUlid, c.ulid];
      const postKey = ["post", "ulid", c.postUlid];

      const p = await kv.get<Post>(postKey);
      if (p.value == null) {
        return null;
      }

      p.value.comments += 1;

      const reply = await this.replyComment(c.postUlid, c.replyUlid);

      let tx = kv.atomic()
        .check(p)
        .set(primaryKey, c)
        .set(postKey, p.value);

      if (reply != null) {
        tx = tx.check(reply.c)
          .set(reply.key, reply.c.value);
      }

      const res = await tx.commit();

      return res.ok;
    },

    async getComments(postUlid: string) {
      const postCommentsKey = ["post", "comments", "ulid", postUlid];

      const comments: Comment[] = [];
      const iter = kv.list<Comment>({ prefix: postCommentsKey });
      for await (const res of iter) {
        comments.push(res.value);
      }

      return comments;
    },
  };
};

let instance = null as unknown as Awaited<ReturnType<typeof get>>;
export default async () => instance ? instance : instance = await get();
