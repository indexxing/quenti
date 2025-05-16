import React from "react";

import type { FacingTerm } from "@quenti/interfaces";
import { getRandom } from "@quenti/lib/array";

import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";

import { IconBulb } from "@tabler/icons-react";

import { useLearnContext } from "../../stores/use-learn-store";

/**
 * Possible hint types for written answers:
 * - first: Shows the first character of the answer
 * - last: Shows the last character of the answer
 * - length: Shows the total length of the answer
 */
export type HintType = "first" | "last" | "length";

/**
 * HintButton Component Props
 *
 * This component provides hints to users based on the question type:
 * - For multiple choice questions, it eliminates 50% of incorrect options
 * - For written answers, it provides a random hint (first letter, last letter, or length)
 *
 * For multiple choice questions, hints can only be used once per term.
 * For written answers, hints can be used an unlimited number of times.
 * Hint usage for multiple choice questions is tracked in the learn store.
 * The hint popover appears below the button with a curved design and arrow for written answers.
 */
interface HintButtonProps {
  /** Question type: "choice" for multiple choice or "write" for written answers */
  type: "choice" | "write";

  /** ID of the correct term (required for multiple choice) */
  correctTermId?: string;

  /** All available choices for multiple choice questions */
  choices?: FacingTerm[];

  /** Callback to update the UI when choices are eliminated */
  onEliminateChoices?: (remainingChoices: FacingTerm[]) => void;

  /** The correct answer text (required for written answers) */
  answer?: string;

  /** Whether the hint button should be disabled */
  disabled?: boolean;
}

export const HintButton: React.FC<HintButtonProps> = ({
  type,
  correctTermId,
  choices = [],
  onEliminateChoices,
  answer = "",
  disabled = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isUsed, setIsUsed] = React.useState(false);
  const [hint, setHint] = React.useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hintType, setHintType] = React.useState<HintType>("first");
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const timeline = useLearnContext((s) => s.roundTimeline);
  const roundCounter = useLearnContext((s) => s.roundCounter);
  const hintsUsed = useLearnContext((s) => s.hintsUsed);
  const setHintUsed = useLearnContext((s) => s.setHintUsed);

  const active = timeline[roundCounter];
  const termId = active?.term?.id;

  // Handle clicks outside the popover
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Check if hint was already used for this term
  React.useEffect(() => {
    if (termId) {
      // Reset state when term changes
      setIsUsed(hintsUsed.has(termId));
      setHint("");
    }
  }, [termId, hintsUsed]);

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hintBoxBg = useColorModeValue("gray.50", "gray.800");
  const hintBoxShadow = useColorModeValue("md", "dark-lg");

  const getWriteHint = () => {
    if (!answer) return "";

    // Randomly select between showing first character, last character, or length
    const hintTypes: HintType[] = ["first", "last", "length"];
    const selectedHintType = getRandom(hintTypes);
    setHintType(selectedHintType);

    // Clean up the answer and make more resilient
    const cleanAnswer = answer.trim();

    switch (selectedHintType) {
      case "first":
        return `The word start with ${cleanAnswer[0] || "?"}`;
      case "last":
        return `The word ends with ${
          cleanAnswer[cleanAnswer.length - 1] || "?"
        }`;
      case "length":
        return `The word has ${cleanAnswer.length} character${
          cleanAnswer.length !== 1 ? "s" : ""
        }`;
      default:
        return "";
    }
  };

  const getChoiceHint = () => {
    if (!correctTermId || choices.length <= 1) return null;

    // Find the correct choice
    const correctChoice = choices.find((choice) => choice.id === correctTermId);
    if (!correctChoice) return null;

    // Get incorrect choices
    const incorrectChoices = choices.filter(
      (choice) => choice.id !== correctTermId,
    );

    // Randomly eliminate 50% of wrong answers (or at least one)
    const numToEliminate = Math.floor(incorrectChoices.length / 2);
    const remainingIncorrectChoices = [...incorrectChoices];
    const eliminatedIds: string[] = [];

    for (
      let i = 0;
      i < numToEliminate && remainingIncorrectChoices.length > 0;
      i++
    ) {
      const randomIndex = Math.floor(
        Math.random() * remainingIncorrectChoices.length,
      );
      const choiceToEliminate = remainingIncorrectChoices[randomIndex];
      if (choiceToEliminate) {
        eliminatedIds.push(choiceToEliminate.id);
      }
    }

    // Return remaining choices (correct + non-eliminated incorrect)
    const remainingChoices = choices.filter(
      (choice) =>
        choice.id === correctTermId || !eliminatedIds.includes(choice.id),
    );

    if (onEliminateChoices) {
      onEliminateChoices(remainingChoices);
    }

    return `Eliminated ${numToEliminate} incorrect option${
      numToEliminate !== 1 ? "s" : ""
    }`;
  };

  const handleHint = () => {
    // For choice questions, check if hint already used
    if (type === "choice" && isUsed) return;

    // Only mark as used for choice questions
    if (type === "choice") {
      setIsUsed(true);
      // Mark this term as having used a hint for choice questions only
      if (termId) {
        setHintUsed(termId, true);
      }
    }

    // If the popover is already open, close it first to ensure it reopens
    if (isOpen) {
      onClose();
      // Use setTimeout to ensure the state updates before reopening
      setTimeout(() => {
        onOpen();
        updateHintContent();
      }, 50);
    } else {
      onOpen();
      updateHintContent();
    }
  };

  // Extract hint generation logic to a separate function for reusability
  const updateHintContent = () => {
    if (type === "choice") {
      const choiceHint = getChoiceHint();
      if (choiceHint) setHint(choiceHint);
    } else {
      // For written questions, generate a new hint each time (unlimited use)
      setHint(getWriteHint());
    }
  };

  return (
    <Popover
      placement={type === "write" ? "top-end" : "bottom"}
      closeOnBlur={true}
      closeOnEsc={true}
      returnFocusOnClose={false}
      isOpen={isOpen && !!hint}
      onClose={onClose}
    >
      <PopoverTrigger>
        <Tooltip
          label={type === "choice" && isUsed ? "Hint used" : "Get a hint"}
          placement="top"
        >
          {/* Only disable the button when it's a choice question that has used its hint */}
          <IconButton
            icon={<IconBulb size={18} />}
            aria-label="Get a hint"
            size="sm"
            colorScheme={isUsed ? "yellow" : "gray"}
            variant={isUsed ? "solid" : "outline"}
            rounded="full"
            onClick={handleHint}
            isDisabled={disabled || (type === "choice" && isUsed)}
          />
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent
        width="auto"
        bg={bgColor}
        //borderColor={borderColor}
        borderRadius="lg"
        boxShadow={hintBoxShadow}
        _focus={{ outline: "none" }}
        tabIndex={-1}
        ref={popoverRef}
      >
        <PopoverArrow bg={bgColor} />
        <PopoverCloseButton
          top="8px"
          right="8px"
          transform={"translate(7px, -9px)"}
        />
        <PopoverBody p={4}>
          <Box position="relative">
            {type === "write" && (
              <Box
                position="absolute"
                bottom={-4}
                right={4}
                width={0}
                height={0}
                borderLeft="8px solid transparent"
                borderRight="8px solid transparent"
                borderTop={`8px solid ${borderColor}`}
                transform="translateY(50%)"
              />
            )}
            {type === "write" && (
              <Box
                position="absolute"
                bottom={-3.5}
                right={4}
                width={0}
                height={0}
                borderLeft="7px solid transparent"
                borderRight="7px solid transparent"
                borderTop={`7px solid ${hintBoxBg}`}
                transform="translateY(50%)"
                zIndex={1}
              />
            )}
            <Box
              px={4}
              py={3}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
              bg={type === "write" ? hintBoxBg : undefined}
              boxShadow={type === "write" ? "sm" : undefined}
              position="relative"
            >
              <Text fontWeight={600}>{hint}</Text>
            </Box>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
