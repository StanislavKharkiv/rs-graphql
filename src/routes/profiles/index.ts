import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createProfileBodySchema, changeProfileBodySchema } from "./schema";
import type { ProfileEntity } from "../../utils/DB/entities/DBProfiles";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      return (
        (await fastify.db.profiles.findOne({
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
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const memberId = request.body.memberTypeId;
      if (memberId !== "basic")
        return reply.code(400).send({ message: 'Fake member type id' });

      try {
        const profile = await fastify.db.profiles.findOne({
          key: "userId",
          equals: request.body.userId,
        });
        if (profile) return reply.code(400).send({ message: "Already exist" });
        return await fastify.db.profiles.create(request.body);
      } catch (err) {
        const error = err as Error;
        return reply.code(400).send(error.message);
      }
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        return await fastify.db.profiles.delete(request.params.id);
      } catch (err) {
        const error = err as Error;
        return reply.code(400).send(error.message);
      }
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        return await fastify.db.profiles.change(
          request.params.id,
          request.body
        );
      } catch (err) {
        const error = err as Error;
        return reply.code(400).send(error.message);
      }
    }
  );
};

export default plugin;
