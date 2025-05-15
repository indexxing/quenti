// eslint-disable-file @typescript-eslint/no-floating-promises
import { motion, useAnimationControls } from "framer-motion";
import React from "react";

import { GenericLabel } from "@quenti/components";

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
import { useLearnContext } from "../../../../stores/use-learn-store";
//import { HintButton } from "../../hint-button";
import { AnswerCard } from "./answer-card";

export interface RetypeAnswerStateProps {
  onComplete: () => void;
}

export const RetypeAnswerState: React.FC<RetypeAnswerStateProps> = ({
  onComplete,
}) => {
  const correctAnswerToRetype = useLearnContext((s) => s.correctAnswerToRetype);
  const specialCharacters = useLearnContext((s) => s.specialCharacters);
  const completeRetyping = useLearnContext((s) => s.completeRetyping);
  const overrideCorrect = useLearnContext((s) => s.overrideCorrect);
  const nextRound = useLearnContext((s) => s.nextRound);

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

    if (answer.trim() === correctAnswerToRetype?.trim()) {
      setIsCorrect(true);

      // Immediately complete retyping and move to next question
      completeRetyping();
      onComplete();
      // Advance to the next question
      nextRound();

      // Use animation controls to animate out the input section
      void controls.start({ opacity: 0, height: 0 }).then(() => {
        setShowInput(false);
      });
    } else {
      setIsCorrect(false);
      setAnswer("");
      // Shake the input to indicate incorrect answer
      void controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.2 }, // Reduced from 0.4s to 0.2s for snappier experience
      });
      // Focus the input after clearing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleOverrideCorrect = () => {
    overrideCorrect();
    completeRetyping();
    onComplete();
    nextRound();
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
