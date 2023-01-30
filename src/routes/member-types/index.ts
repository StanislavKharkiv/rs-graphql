import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { changeMemberTypeBodySchema } from "./schema";
import type { MemberTypeEntity } from "../../utils/DB/entities/DBMemberTypes";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        const member = await fastify.db.memberTypes.findOne({
          key: "id",
          equals: request.params.id,
        });
        return member ?? reply.code(404).send({message: "Not found"});
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
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        return await fastify.db.memberTypes.change(
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
