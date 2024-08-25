import { Static, Type as T } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

export const UserSchema = T.Object({
  ulid: T.String(),
  username: T.String(),
  email: T.String(),
  avatar: T.String(),
  passwordHash: T.String(),
  date: T.Date(),
});

export const PostFormatSchema = T.Union([
  T.TemplateLiteral("text"),
  T.TemplateLiteral("markdown"),
]);

export const PostSchema = T.Object({
  ulid: T.String(),
  userUlid: T.String(),
  title: T.String(),
  text: T.String(),
  format: PostFormatSchema,
  date: T.Date(),
  votes: T.Number(),
  comments: T.Number(),
});

export const UserPostSchema = T.Object({
  username: T.String(),
  avatar: T.String(),
});

export const PostVoteTypeSchema = T.Union([
  T.TemplateLiteral("up"),
  T.TemplateLiteral("down"),
]);
export const PostVoteSchema = T.Object({
  userUlid: T.String(),
  postUlid: T.String(),
  date: T.Date(),
  type: PostVoteTypeSchema,
});

export const CommentFormatSchema = T.Union([
  T.TemplateLiteral("text"),
  T.TemplateLiteral("markdown"),
]);

export const CommentSchema = T.Object({
  ulid: T.String(),
  userUlid: T.String(),
  postUlid: T.String(),
  text: T.String(),
  format: CommentFormatSchema,
  date: T.Date(),
  votes: T.Number(),
  replyes: T.Number(),
  replyUlid: T.Optional(T.String()),
});

export const UserSchemaC = TypeCompiler.Compile(UserSchema);
export const PostFormatSchemaC = TypeCompiler.Compile(PostFormatSchema);
export const PostSchemaC = TypeCompiler.Compile(PostSchema);
export const UserPostSchemaC = TypeCompiler.Compile(UserPostSchema);
export const PostVoteSchemaC = TypeCompiler.Compile(PostVoteSchema);
export const CommentFormatSchemaC = TypeCompiler.Compile(CommentFormatSchema);
export const CommentSchemaC = TypeCompiler.Compile(CommentSchema);

export type User = Static<typeof UserSchema>;
export type PostFormat = Static<typeof PostFormatSchema>;
export type Post = Static<typeof PostSchema>;
export type UserPost = Static<typeof UserPostSchema>;
export type PostVoteType = Static<typeof PostVoteTypeSchema>;
export type PostVote = Static<typeof PostVoteSchema>;
export type CommentFormat = Static<typeof CommentFormatSchema>;
export type Comment = Static<typeof CommentSchema>;
