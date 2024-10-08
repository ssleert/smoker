import { Comment } from "@root/server/db/model.ts";
import { assertGreater } from "@std/assert";
import { itersForChunk, schedule } from "@root/server/utils/mod.ts";

type CommentsGraphNode = {
  comment: Comment;
  replyesList?: CommentsGraphNode[];
};

export const commentsArrayToGraph = async (comments: Comment[]) => {
  assertGreater(comments.length, 0, "comments empty");

  const commentsGraph: CommentsGraphNode[] = [];
  const commentUsed: Record<string, boolean> = {};

  let iterCounter = itersForChunk;

  const fullFillGraphNode = async (node: CommentsGraphNode) => {
    for (const comment of comments) {
      if (--iterCounter == 0) {
        await schedule();
        iterCounter = itersForChunk;
      }

      if (
        commentUsed[comment.ulid] ||
        !comment.replyUlid ||
        comment.replyUlid == comment.ulid ||
        comment.replyUlid != node.comment.ulid
      ) {
        continue;
      }
      commentUsed[comment.ulid] = true;

      const newNode = { comment: comment };
      fullFillGraphNode(newNode);
      node.replyesList ??= [];
      node.replyesList.push(newNode);
    }
  };

  for (const comment of comments) {
    if (commentUsed[comment.ulid]) {
      continue;
    }

    const node = { comment: comment };
    await fullFillGraphNode(node);
    commentsGraph.push(node);
  }

  return commentsGraph;
};
