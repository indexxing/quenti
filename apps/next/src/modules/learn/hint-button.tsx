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
 * - For multiple choice questions, it shows only 2 choices: the correct answer and one random incorrect answer
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
  const [lastHintType, setLastHintType] = React.useState<HintType | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [forceClose, setForceClose] = React.useState(false);

  const timeline = useLearnContext((s) => s.roundTimeline);
  const roundCounter = useLearnContext((s) => s.roundCounter);
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

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hintBoxBg = useColorModeValue("gray.50", "gray.800");
  const hintBoxShadow = useColorModeValue("md", "dark-lg");

  const getWriteHint = () => {
    if (!answer) return { hint: "", type: null };

    // Exclude last used hint type
    const hintTypes: HintType[] = ["first", "last", "length"];
    const availableHintTypes = lastHintType
      ? hintTypes.filter((type) => type !== lastHintType)
      : hintTypes;
    const selectedHintType = getRandom(availableHintTypes);

    // Clean up the answer and make more resilient
    const cleanAnswer = answer.trim();
    let hintText = "";
    switch (selectedHintType) {
      case "first":
        hintText = `The word start with ${cleanAnswer[0] || "?"}`;
        break;
      case "last":
        hintText = `The word ends with ${
          cleanAnswer[cleanAnswer.length - 1] || "?"
        }`;
        break;
      case "length":
        hintText = `The word has ${cleanAnswer.length} character${
          cleanAnswer.length !== 1 ? "s" : ""
        }`;
        break;
      default:
        hintText = "";
    }
    return { hint: hintText, type: selectedHintType };
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

    if (incorrectChoices.length === 0) return null;

    // Pick one random incorrect answer
    const randomIncorrectChoice = getRandom(incorrectChoices);
    if (!randomIncorrectChoice) return null;

    // Randomly position the correct and incorrect choices
    const remainingChoices =
      Math.random() < 0.5
        ? [correctChoice, randomIncorrectChoice]
        : [randomIncorrectChoice, correctChoice];

    if (onEliminateChoices) {
      onEliminateChoices(remainingChoices);
    }
  };

  const handleHint = () => {
    // For choice questions, check if hint already used
    if (type === "choice" && isUsed) return;

    // Only mark as used for choice questions
    if (type === "choice") {
      setIsUsed(true);
      if (termId) {
        setHintUsed(termId, true);
      }
    }

    // Always close popover first, then reopen after a short delay
    setForceClose(true);
    setTimeout(() => {
      setForceClose(false);
      onOpen();
      updateHintContent();
    }, 100);
  };

  // Extract hint generation logic to a separate function for reusability
  const updateHintContent = () => {
    if (type === "choice") {
      const choiceHint = getChoiceHint();
      if (choiceHint) setHint(choiceHint);
    } else {
      const { hint: newHint, type: newType } = getWriteHint();
      setHint(newHint);
      if (newType) setLastHintType(newType);
    }
  };

  return (
    <Popover
      placement={type === "write" ? "top-end" : "bottom"}
      closeOnBlur={true}
      closeOnEsc={true}
      returnFocusOnClose={false}
      isOpen={!forceClose && isOpen && !!hint}
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
              <>
                <Box
                  position="absolute"
                  bottom={
                    typeof window !== "undefined" && window.innerWidth < 600
                      ? -8
                      : -4
                  }
                  right={
                    typeof window !== "undefined" && window.innerWidth < 600
                      ? 2
                      : 4
                  }
                  width={0}
                  height={0}
                  style={{
                    borderLeft:
                      typeof window !== "undefined" && window.innerWidth < 600
                        ? "12px solid transparent"
                        : "8px solid transparent",
                    borderRight:
                      typeof window !== "undefined" && window.innerWidth < 600
                        ? "12px solid transparent"
                        : "8px solid transparent",
                    borderTop:
                      typeof window !== "undefined" && window.innerWidth < 600
                        ? `12px solid ${borderColor}`
                        : `8px solid ${borderColor}`,
                  }}
                  transform="translateY(50%)"
                  display="block"
                />
                <Box
                  position="absolute"
                  bottom={
                    typeof window !== "undefined" && window.innerWidth < 600
                      ? -7
                      : -3.5
                  }
                  right={
                    typeof window !== "undefined" && window.innerWidth < 600
                      ? 2
                      : 4
                  }
                  width={0}
                  height={0}
                  style={{
                    borderLeft:
                      typeof window !== "undefined" && window.innerWidth < 600
                        ? "11px solid transparent"
                        : "7px solid transparent",
                    borderRight:
                      typeof window !== "undefined" && window.innerWidth < 600
                        ? "11px solid transparent"
                        : "7px solid transparent",
                    borderTop:
                      typeof window !== "undefined" && window.innerWidth < 600
                        ? `11px solid ${hintBoxBg}`
                        : `7px solid ${hintBoxBg}`,
                  }}
                  transform="translateY(50%)"
                  zIndex={1}
                  display="block"
                />
              </>
            )}
            <Box
              px={[2, 4]}
              py={[2, 3]}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
              bg={type === "write" ? hintBoxBg : undefined}
              boxShadow={type === "write" ? "sm" : undefined}
              position="relative"
              maxWidth={{ base: "90vw", md: "320px" }}
              fontSize={{ base: "sm", md: "md" }}
            >
              <Text fontWeight={600}>{hint}</Text>
            </Box>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
