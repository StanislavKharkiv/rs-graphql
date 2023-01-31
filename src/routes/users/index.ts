import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from "./schemas";
import type { UserEntity } from "../../utils/DB/entities/DBUsers";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return (
        (await fastify.db.users.findOne({
          key: "id",
          equals: request.params.id,
        })) ?? reply.code(404).send({ message: "Not found" })
      );
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.create(request.body);
      return user;
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        // delete user profile
        const profile = await fastify.db.profiles.findOne({
          key: "userId",
          equals: request.params.id,
        });
        if (profile) await fastify.db.profiles.delete(profile.id);
        // delete user posts
        const post = await fastify.db.posts.findMany({
          key: "userId",
          equals: request.params.id,
        });
        // delete from subscribers
        const users = await fastify.db.users.findMany();
        users.forEach(async (user) => {
          if (user.subscribedToUserIds.includes(request.params.id)) {
            user.subscribedToUserIds = user.subscribedToUserIds.filter(id => id !== request.params.id)
            await fastify.db.users.change(user.id, user)
          }
        })

        if (post.length > 0)
          post.forEach(async (item) => await fastify.db.posts.delete(item.id));
        return await fastify.db.users.delete(request.params.id);
      } catch (err) {
        const error = err as Error;
        return reply.code(400).send(error.message);
      }
    }
  );

  fastify.post(
    "/:id/subscribeTo",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userData = await fastify.db.users.findOne({
        key: "id",
        equals: request.body.userId,
      });
      if (userData) {
        userData.subscribedToUserIds.push(request.params.id);
        await fastify.db.users.change(request.body.userId, userData);
        return userData;
      }
      return reply.code(404).send({ message: "Not found" });
    }
  );

  fastify.post(
    "/:id/unsubscribeFrom",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const userData = await fastify.db.users.findOne({
          key: "id",
          equals: request.body.userId,
        });
        // if user exist and he subscribed
        if (userData && userData.subscribedToUserIds.includes(request.params.id)) {
          const subscribers = userData.subscribedToUserIds.filter(
            (item) => item !== request.params.id
          );
          userData.subscribedToUserIds = subscribers;
          await fastify.db.users.change(request.body.userId, userData);
          return userData;
        }
        return reply.code(400).send({ message: "Not found" });
      } catch (err) {
        const error = err as Error
        return reply.code(400).send(error.message);
      }
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        return await fastify.db.users.change(request.params.id, request.body);
      } catch (err) {
        const error = err as Error
        return reply.code(400).send(error.message);
      }
    }
  );
};

export default plugin;
