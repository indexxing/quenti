import { useRouter } from "next/router";
import React from "react";

import { Link } from "@quenti/components";
import { api } from "@quenti/trpc";

import {
  Button,
  ButtonGroup,
  Center,
  Flex,
  HStack,
  Heading,
  IconButton,
  LinkBox,
  LinkOverlay,
  Menu,
  MenuButton,
  MenuList,
  Stack,
  Tag,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  IconDotsVertical,
  IconEditCircle,
  IconFolder,
  IconTrash,
  IconUsersGroup,
} from "@tabler/icons-react";

import { visibilityIcon } from "../../common/visibility-icon";
import { ConfirmModal } from "../../components/confirm-modal";
import { MenuOption } from "../../components/menu-option";
import { SetCreatorOnly } from "../../components/set-creator-only";
import { useSet } from "../../hooks/use-set";

export const HeadingArea = () => {
  const { id, title, type, tags, terms, visibility, folders } = useSet();
  const router = useRouter();
  const text = useColorModeValue("gray.600", "gray.400");
  const tagBg = useColorModeValue("gray.200", "gray.750");
  const menuBg = useColorModeValue("white", "gray.800");

  const deleteSet = api.studySets.delete.useMutation({
    onSuccess: async () => {
      await router.push("/home");
    },
  });
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

  return (
    <>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        heading="Delete this set?"
        body={
          <Text>
            Are you absolutely sure you want to delete this set and all
            associated data? This action cannot be undone.
          </Text>
        }
        actionText="Delete"
        isLoading={deleteSet.isLoading}
        onConfirm={() => {
          deleteSet.mutate({ studySetId: id });
        }}
        destructive
      />
      <Stack spacing={4}>
        {(type == "Collab" || tags.length) && (
          <HStack spacing="4">
            {type == "Collab" && (
              <HStack
                h="32px"
                w="88px"
                borderWidth="1px"
                borderColor="gray.300"
                color="blue.600"
                bg="white"
                _dark={{
                  bg: "gray.800",
                  color: "blue.100",
                  borderColor: "gray.600",
                }}
                shadow="sm"
                rounded="xl"
                spacing="6px"
                justifyContent="center"
                alignItems="center"
              >
                <IconUsersGroup size={14} />
                <Text fontWeight={600} fontSize="sm">
                  Collab
                </Text>
              </HStack>
            )}
            {tags.length && (
              <HStack spacing={3} flexWrap="wrap">
                {tags.map((t, i) => (
                  <Tag bg={tagBg} key={i} fontWeight={600}>
                    {t}
                  </Tag>
                ))}
              </HStack>
            )}
          </HStack>
        )}
        {folders && folders.length > 0 && (
          <HStack spacing={2}>
            <Link
              href={`/@${folders[0]!.folder.user.username}/folders/${
                folders[0]!.folder.slug || folders[0]!.folder.id
              }`}
              display="flex"
              alignItems="center"
              gap={2}
              color={useColorModeValue("gray.600", "gray.900")}
              transition="all 0.2s ease"
              _hover={{
                color: useColorModeValue("gray.900", "gray.600"),
                textDecoration: "none",
              }}
            >
              <IconFolder size={18} />
              <Text>{folders[0]!.folder.title}</Text>
            </Link>
          </HStack>
        )}
        <Heading size="2xl">{title}</Heading>
        <Flex justifyContent="space-between" h="32px">
          <HStack color={text} fontWeight={600} spacing={2}>
            <HStack>
              {visibilityIcon(visibility, 18)}
              <Text>{visibility}</Text>
            </HStack>
            <Text>•</Text>
            <Text>
              {terms?.length || 5} term{terms?.length != 1 ? "s" : ""}
            </Text>
          </HStack>
          <SetCreatorOnly>
            <Menu placement="bottom-end">
              <ButtonGroup
                isAttached
                variant="outline"
                colorScheme="blue"
                role="group"
                tabIndex={-1}
              >
                <Tooltip label="Edit">
                  <LinkBox
                    as={Button}
                    w="8"
                    h="8"
                    p="0"
                    tabIndex={-1}
                    sx={{
                      "&:has(:focus-visible)": {
                        boxShadow: "outline",
                      },
                    }}
                  >
                    <LinkOverlay
                      w="full"
                      h="full"
                      as={Link}
                      href={`/${id}/edit`}
                      _focusVisible={{
                        outline: "none",
                      }}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="sm"
                    >
                      <IconEditCircle size="18" />
                    </LinkOverlay>
                  </LinkBox>
                </Tooltip>
                <MenuButton as={IconButton} w="8" h="8" p="0">
                  <Center h="8">
                    <IconDotsVertical size={18} />
                  </Center>
                </MenuButton>
                <MenuList
                  bg={menuBg}
                  py={0}
                  overflow="hidden"
                  minW="auto"
                  w="40"
                >
                  <MenuOption
                    icon={<IconTrash size={20} />}
                    label="Delete"
                    onClick={() => setDeleteModalOpen(true)}
                  />
                </MenuList>
              </ButtonGroup>
            </Menu>
          </SetCreatorOnly>
        </Flex>
      </Stack>
    </>
  );
};
