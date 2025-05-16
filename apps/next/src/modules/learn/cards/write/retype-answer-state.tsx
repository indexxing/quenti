// eslint-disable-file @typescript-eslint/no-floating-promises
import { motion, useAnimationControls } from "framer-motion";
import { useSession } from "next-auth/react";
import { log } from "next-axiom";
import React from "react";

import { GenericLabel } from "@quenti/components";
import type { Question } from "@quenti/interfaces";
import { api } from "@quenti/trpc";

import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import { IconProgressCheck } from "@tabler/icons-react";

import { ScriptFormatter } from "../../../../components/script-formatter";
import { CharacterButtonWrapper } from "../../../../components/special-characters";
import { useAuthedSet } from "../../../../hooks/use-set";
import { useLearnContext } from "../../../../stores/use-learn-store";
import { word } from "../../../../utils/terms";
import { AnswerCard } from "./answer-card";

export interface RetypeAnswerStateProps {
  onComplete: () => void;
  active: Question;
  guess?: string;
}

export const RetypeAnswerState: React.FC<RetypeAnswerStateProps> = ({
  onComplete,
  active,
  guess,
}) => {
  const { container } = useAuthedSet();
  const correctAnswerToRetype = useLearnContext((s) => s.correctAnswerToRetype);
  const specialCharacters = useLearnContext((s) => s.specialCharacters);
  const completeRetyping = useLearnContext((s) => s.completeRetyping);
  const overrideCorrect = useLearnContext((s) => s.overrideCorrect);
  const acknowledgeIncorrect = useLearnContext((s) => s.acknowledgeIncorrect);
  const roundTimeline = useLearnContext((s) => s.roundTimeline);
  const roundCounter = useLearnContext((s) => s.roundCounter);
  const session = useSession();

  const put = api.studiableTerms.put.useMutation();

  const inputBg = useColorModeValue("gray.100", "gray.800");
  const placeholderColor = useColorModeValue("gray.600", "gray.200");

  const [answer, setAnswer] = React.useState("");
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showInput, setShowInput] = React.useState(true);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const controls = useAnimationControls();

  const handleSubmit = () => {
    if (!answer.trim().length) return;

    // If user typed the correct answer
    if (answer.trim() === correctAnswerToRetype?.trim()) {
      setIsCorrect(true);

      // Immediately complete retyping and move to next question
      completeRetyping();
      onComplete();
      // Advance to the next round
      handleAcknowledgeIncorrect();
    } else {
      setIsCorrect(false);
      setAnswer("");
      // Shake the input to indicate incorrect answer
      void controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.2 },
      });
      // Focus the input after clearing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleOverrideCorrect = () => {
    overrideCorrect();

    log.info("learn.write.overrideCorrect", {
      userId: session.data?.user?.id,
      containerId: container.id,
      termId: active.term.id,
      guess,
      answer: word(active.answerMode, active.term, "answer"),
    });

    put.mutate({
      id: active.term.id,
      containerId: container.id,
      mode: "Learn",
      correctness: 2,
      appearedInRound: active.term.appearedInRound || 0,
      incorrectCount: active.term.incorrectCount,
    });
  };

  const handleClick = (c: string) => {
    const cursorPosition = inputRef.current!.selectionStart || answer.length;
    const textBeforeCursor = answer.substring(0, cursorPosition);
    const textAfterCursor = answer.substring(cursorPosition);
    setAnswer(textBeforeCursor + c + textAfterCursor);

    inputRef.current?.focus();
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(
        cursorPosition + 1,
        cursorPosition + 1,
      );
    });
  };

  // This function is similar to the one in action-bar.tsx
  // It handles the incorrect answer by updating the state and making API calls
  const handleAcknowledgeIncorrect = () => {
    acknowledgeIncorrect();

    // Update the term status in the database
    const active = roundTimeline[roundCounter]!;
    if (active.type == "write") {
      void (async () =>
        await put.mutateAsync({
          id: active.term.id,
          containerId: container.id,
          mode: "Learn",
          correctness: -1,
          appearedInRound: active.term.appearedInRound || 0,
          incorrectCount: active.term.incorrectCount + 1,
        }))();
    }
  };

  return (
    <Stack spacing={6}>
      {/* Correct answer section */}
      <Stack spacing="2">
        <Flex
          justifyContent="space-between"
          alignItems={{ base: "flex-start", md: "center" }}
          flexDir={{ base: "column", md: "row" }}
          w="full"
          gap={{ base: 0, md: 4 }}
        >
          <GenericLabel>Correct answer</GenericLabel>
          <Button
            size="sm"
            flexShrink="0"
            variant="ghost"
            fontSize="xs"
            onClick={handleOverrideCorrect}
            px={{ base: 0, md: 2 }}
            leftIcon={
              <IconProgressCheck
                style={{
                  marginRight: -4,
                }}
                size={16}
              />
            }
          >
            Override - I was correct
          </Button>
        </Flex>
        <AnswerCard
          text={
            <ScriptFormatter>{correctAnswerToRetype || ""}</ScriptFormatter>
          }
          correct={true}
          showIcon={true}
        />
      </Stack>

      {/* Retyping input section - animate out when answered correctly */}
      <motion.div
        animate={controls}
        initial={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.4 }}
        style={{ overflow: "hidden" }}
      >
        <Stack spacing="2">
          <HStack
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
          >
            <Stack spacing={0}>
              <GenericLabel>Re-type the correct answer</GenericLabel>
            </Stack>
            {/* Removed hint button for retyping state - users should recall the answer */}
          </HStack>
          {isCorrect === false && (
            <Text fontSize="sm" color="red.500" fontWeight={600}>
              That&apos;s not quite right. Try again.
            </Text>
          )}
          <Stack spacing="3">
            {!!specialCharacters.length && (
              <Box>
                <div style={{ margin: -4, maxHeight: 128, overflowY: "auto" }}>
                  {specialCharacters.sort().map((c, i) => (
                    <CharacterButtonWrapper
                      key={i}
                      character={c}
                      handler={handleClick}
                    />
                  ))}
                </div>
              </Box>
            )}
            <Input
              ref={inputRef}
              placeholder="Re-type the correct answer"
              autoComplete="off"
              py="6"
              px="4"
              rounded="lg"
              fontWeight={700}
              bg={inputBg}
              variant="flushed"
              borderColor={
                isCorrect === false
                  ? "red.500"
                  : isCorrect === true
                    ? "green.500"
                    : "transparent"
              }
              _placeholder={{
                color: placeholderColor,
              }}
              autoFocus
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setIsCorrect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setTimeout(() => {
                    handleSubmit();
                  });
                }
              }}
            />
          </Stack>
          <Flex justifyContent="end">
            <ButtonGroup>
              <Button onClick={() => handleSubmit()}>Submit</Button>
            </ButtonGroup>
          </Flex>
        </Stack>
      </motion.div>
    </Stack>
  );
};
