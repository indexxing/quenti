import type { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import { HeadSeo } from "@quenti/components/head-seo";
import { db, eq, sql } from "@quenti/drizzle";
import {
  classJoinCode as classJoinCodeTable,
  foldersOnClasses,
  studySetsOnClasses,
} from "@quenti/drizzle/schema";
import { api } from "@quenti/trpc";

import {
  Box,
  Button,
  Center,
  Heading,
  ScaleFade,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";

import { LazyWrapper } from "../../common/lazy-wrapper";
import { PageWrapper } from "../../common/page-wrapper";
import { ClassCard } from "../../components/class-card";
import { Generic404 } from "../../components/generic-404";
import { getLayout } from "../../layouts/main-layout";
import type { inferSSRProps } from "../../lib/infer-ssr-props";

export const runtime = "experimental-edge";

const ClassResolver = ({
  class: class_,
}: inferSSRProps<typeof getServerSideProps>) => {
  const { status } = useSession();
  const router = useRouter();
  const code = router.query?.id as string;
  const join = api.classes.join.useMutation({
    onSuccess: async () => {
      await router.push(`/classes/${class_!.id}`);
    },
  });

  if (!class_)
    return (
      <LazyWrapper>
        <Generic404 />
      </LazyWrapper>
    );

  return (
    <>
      <HeadSeo
        title={`Join ${class_.name}`}
        nextSeoProps={{
          noindex: true,
          nofollow: true,
        }}
      />
      <LazyWrapper>
        <Center w="100vw" minH="calc(100vh - 80px)">
          <ScaleFade
            in
            style={{
              width: "100%",
            }}
          >
            <VStack spacing="12" px="6" w="full">
              <VStack>
                <Heading>Join class</Heading>
                <Text
                  color="gray.600"
                  _dark={{
                    color: "gray.400",
                  }}
                  fontWeight={500}
                  textAlign="center"
                >
                  You&apos;ve been invited to join the following class:
                </Text>
              </VStack>
              <Box maxW="lg" w="full">
                <ClassCard
                  for="Student"
                  {...class_}
                  disableLink
                  data={{
                    studySets: class_.studySets,
                    folders: class_.folders,
                  }}
                />
              </Box>
              <Stack w="xs">
                <Button
                  isLoading={join.isLoading}
                  onClick={async () => {
                    if (status === "authenticated") {
                      await join.mutateAsync({
                        code: code.substring(1),
                      });
                    } else {
                      await router.push(`/auth/signup?callbackUrl=/${code}`);
                    }
                  }}
                >
                  Join class
                </Button>
              </Stack>
            </VStack>
          </ScaleFade>
        </Center>
      </LazyWrapper>
    </>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const dbInstance = db;
  if (!dbInstance) return { props: { class: null } };

  const id = ctx.query?.id as string;

  const classJoinCode = await dbInstance.query.classJoinCode.findFirst({
    where: eq(classJoinCodeTable.code, id.substring(1)),
    with: {
      class: true,
    },
  });

  if (!classJoinCode) return { props: { class: null } };

  const { studySets } = (
    await dbInstance
      .select({
        studySets: sql<number>`cast(count(*) as unsigned)`,
      })
      .from(studySetsOnClasses)
      .where(eq(studySetsOnClasses.classId, classJoinCode.classId))
  )[0]!;
  const { folders } = (
    await dbInstance
      .select({
        folders: sql<number>`cast(count(*) as unsigned)`,
      })
      .from(foldersOnClasses)
      .where(eq(foldersOnClasses.classId, classJoinCode.classId))
  )[0]!;

  return {
    props: {
      class: {
        ...classJoinCode.class,
        studySets,
        folders,
      },
    },
  };
};

ClassResolver.PageWrapper = PageWrapper;
ClassResolver.getLayout = getLayout;

export default ClassResolver;
