import type { NonNullableUserContext } from "../../lib/types";
import type { TSetRequireRetypingSchema } from "./set-require-retyping.schema";

type SetRequireRetypingOptions = {
  ctx: NonNullableUserContext;
  input: TSetRequireRetypingSchema;
};

export const setRequireRetypingHandler = async ({
  ctx,
  input,
}: SetRequireRetypingOptions) => {
  // Get the container to determine its type
  const container = await ctx.prisma.container.findUnique({
    where: {
      userId_entityId_type: {
        userId: ctx.session.user.id,
        entityId: input.entityId,
        type: "StudySet", // We assume StudySet for now, but it could be adjusted based on feature requirements
      },
    },
    select: { type: true },
  });

  if (!container) throw new Error("Container not found");

  await ctx.prisma.container.update({
    where: {
      userId_entityId_type: {
        userId: ctx.session.user.id,
        entityId: input.entityId,
        type: container.type,
      },
    },
    data: {
      requireRetyping: input.requireRetyping,
    },
  });
};

export default setRequireRetypingHandler;
