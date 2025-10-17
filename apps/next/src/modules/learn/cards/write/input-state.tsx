import React from "react";

import { GenericLabel } from "@quenti/components";
import { EvaluationResult, evaluate } from "@quenti/core/evaluator";
import { placeholderLanguage } from "@quenti/core/language";
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
  useColorModeValue,
} from "@chakra-ui/react";

import { useAuthedSet } from "../../../../hooks/use-set";
import { useContainerContext } from "../../../../stores/use-container-store";
import { useLearnContext } from "../../../../stores/use-learn-store";
import { word } from "../../../../utils/terms";
import { HintButton } from "../../hint-button";

export interface InputStateProps {
  active: Question;
  onSubmit: (guess?: string) => void;
}

export const InputState: React.FC<InputStateProps> = ({ active, onSubmit }) => {
  const { container, wordLanguage, definitionLanguage } = useAuthedSet();
  const mutlipleAnswerMode = useContainerContext((s) => s.multipleAnswerMode);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const requireRetyping = useContainerContext((s) => s.requireRetyping);
  const answerCorrectly = useLearnContext((s) => s.answerCorrectly);
  const answerIncorrectly = useLearnContext((s) => s.answerIncorrectly);
  const answerUnknownPartial = useLearnContext((s) => s.answerUnknownPartial);

  const inputBg = useColorModeValue("gray.100", "gray.800");
  const placeholderColor = useColorModeValue("gray.600", "gray.200");

  const [answer, setAnswer] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement>(null);

  const put = api.studiableTerms.put.useMutation();

  const handleSubmit = (skip = false) => {
    if (skip) {
      onSubmit();
      answerIncorrectly(active.term.id);
      return;
    }

    if (!answer.trim().length) handleSubmit(true);

    onSubmit(answer.trim());

    const evaluation = evaluate(
      active.answerMode == "Definition" ? definitionLanguage : wordLanguage,
      mutlipleAnswerMode,
      answer,
      word(active.answerMode, active.term, "answer"),
    );

    if (evaluation === EvaluationResult.Correct) {
      answerCorrectly(active.term.id);

      void (async () =>
        await put.mutateAsync({
          id: active.term.id,
          containerId: container.id,
          mode: "Learn",
          correctness: 2,
          appearedInRound: active.term.appearedInRound || 0,
          incorrectCount: active.term.incorrectCount,
        }))();
    } else if (evaluation === EvaluationResult.Incorrect) {
      answerIncorrectly(active.term.id);
    } else {
      answerUnknownPartial();
    }
  };

  return (
    <Stack spacing={6}>
      <Stack spacing="2">
        <HStack
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
        >
          <GenericLabel>Your answer</GenericLabel>
          <Box>
            <HintButton
              type="write"
              answer={word(active.answerMode, active.term, "answer")}
            />
          </Box>
        </HStack>
        <Stack spacing="3">
          <Input
            ref={inputRef}
            placeholder={`Type the ${placeholderLanguage(
              wordLanguage,
              definitionLanguage,
              active.answerMode,
            )}`}
            autoComplete="off"
            py="6"
            px="4"
            rounded="lg"
            fontWeight={700}
            bg={inputBg}
            variant="flushed"
            borderColor="transparent"
            _placeholder={{
              color: placeholderColor,
            }}
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setTimeout(() => {
                  handleSubmit();
                });
              }
            }}
          />
        </Stack>
      </Stack>
      <Flex justifyContent="end">
        <ButtonGroup>
          <Button variant="ghost" onClick={() => handleSubmit(true)}>
            Don&apos;t know?
          </Button>
          <Button onClick={() => handleSubmit()}>Answer</Button>
        </ButtonGroup>
      </Flex>
    </Stack>
  );
};
