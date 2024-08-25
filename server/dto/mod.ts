import { Static, Type as T } from "@sinclair/typebox";
import {
  CommentFormatSchema,
  PostFormatSchema,
  PostVoteTypeSchema,
} from "@root/server/db/model.ts";

export const UserDTOSchema = T.Object({
  username: T.String(),
  email: T.String(),
  password: T.String(),
});

export const CredentialsDTOSchema = T.Object({
  email: T.String(),
  password: T.String(),
});

export const UserOutputDTOSchema = T.Object({
  username: T.String(),
  avatar: T.String(),
});

export const PostDTOSchema = T.Object({
  title: T.String(),
  text: T.String(),
  format: PostFormatSchema,
});

export const VoteDTOSchema = T.Object({
  type: PostVoteTypeSchema,
});

export const CommentDTOSchema = T.Object({
  text: T.String(),
  format: CommentFormatSchema,
  reply: T.Optional(T.String()),
});

export type UserDTO = Static<typeof UserDTOSchema>;
export type CredentialsDTO = Static<typeof CredentialsDTOSchema>;
export type UserOutputDTO = Static<typeof UserOutputDTOSchema>;
export type PostDTO = Static<typeof PostDTOSchema>;
export type VoteDTO = Static<typeof VoteDTOSchema>;
export type CommentDTO = Static<typeof PostDTOSchema>;
