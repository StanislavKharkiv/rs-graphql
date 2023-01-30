import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createPostBodySchema, changePostBodySchema } from "./schema";
import type { PostEntity } from "../../utils/DB/entities/DBPosts";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        const post = await fastify.db.posts.findOne({
          key: "id",
          equals: request.params.id,
        });
        return post ?? reply.code(404).send({message: "Not found"});
      } catch (err) {
        const error = err as Error;
        return reply.code(400).send(error.message);
      }
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      return await fastify.db.posts.create(request.body);
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return await fastify.db.posts.delete(request.params.id);
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
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return await fastify.db.posts.change(request.params.id, request.body);
      } catch(err) {
        const error = err as Error
        return reply.code(400).send(error.message);
      }
    }
  );
};

export default plugin;
