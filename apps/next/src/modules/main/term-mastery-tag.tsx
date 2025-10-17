import React from "react";

import { Box, Text, useColorModeValue } from "@chakra-ui/react";

interface TermMasteryTagProps {
  correctness: number;
}

export const TermMasteryTag: React.FC<TermMasteryTagProps> = ({
  correctness,
}) => {
  // Default/Unstudied colors
  const defaultBgColor = useColorModeValue("gray.100", "gray.700");
  const defaultTextColor = useColorModeValue("gray.600", "gray.300");
  const defaultBorderColor = useColorModeValue("gray.200", "gray.600");
  const defaultMinWidth = "70px";

  // Learning colors
  const learningBgColor = useColorModeValue(
    "orange.50",
    "rgba(237, 137, 54, 0.15)",
  );
  const learningTextColor = useColorModeValue("orange.600", "orange.300");
  const learningBorderColor = useColorModeValue("orange.200", "orange.800");
  const learningMinWidth = "70px";

  // Almost colors
  const almostBgColor = useColorModeValue(
    "yellow.50",
    "rgba(236, 201, 75, 0.15)",
  );
  const almostTextColor = useColorModeValue("yellow.600", "yellow.300");
  const almostBorderColor = useColorModeValue("yellow.200", "yellow.800");
  const almostMinWidth = "95px";

  // Mastered colors
  const masteredBgColor = useColorModeValue(
    "blue.50",
    "rgba(76, 130, 255, 0.15)",
  );
  const masteredTextColor = useColorModeValue("blue.600", "blue.300");
  const masteredBorderColor = useColorModeValue("blue.200", "blue.800");
  const masteredMinWidth = "70px";

  // Now use the pre-calculated values based on correctness
  let label = "Unstudied";
  let bgColor = defaultBgColor;
  let textColor = defaultTextColor;
  let borderColor = defaultBorderColor;
  let minWidth = defaultMinWidth;

  if (correctness === -2 || correctness === -1) {
    label = "Learning";
    bgColor = learningBgColor;
    textColor = learningTextColor;
    borderColor = learningBorderColor;
    minWidth = learningMinWidth;
  } else if (correctness === 1) {
    label = "Almost Done";
    bgColor = almostBgColor;
    textColor = almostTextColor;
    borderColor = almostBorderColor;
    minWidth = almostMinWidth;
  } else if (correctness === 2) {
    label = "Mastered";
    bgColor = masteredBgColor;
    textColor = masteredTextColor;
    borderColor = masteredBorderColor;
    minWidth = masteredMinWidth;
  }

  return (
    <Box
      px={2}
      py={0.5}
      borderRadius="full"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minW={minWidth}
      flexShrink={0}
    >
      <Text fontSize="xs" fontWeight="600" color={textColor}>
        {label}
      </Text>
    </Box>
  );
};
