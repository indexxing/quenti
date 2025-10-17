import React from "react";

import { outfit } from "@quenti/lib/chakra-theme";

import {
  Center,
  CircularProgress,
  CircularProgressLabel,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";

interface CircularTermMasteryProps {
  known: number;
  almostMastered: number;
  learning: number;
}

export const CircularTermMastery: React.FC<CircularTermMasteryProps> = ({
  known,
  almostMastered,
  learning,
}) => {
  const stillLearning = almostMastered + learning;
  const [perc, setPerc] = React.useState(0);
  React.useEffect(() => {
    setTimeout(() => {
      setPerc((known / (known + stillLearning)) * 100);
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HStack spacing={6}>
      <CircularProgress
        value={perc}
        color="blue.300"
        trackColor="yellow.400"
        size="100px"
        w="max"
        thickness="4px"
      >
        <CircularProgressLabel
          fontFamily={outfit.style.fontFamily}
          fontSize="xl"
          fontWeight={700}
        >
          {`${Math.round((known / (known + stillLearning)) * 100)}%`}
        </CircularProgressLabel>
      </CircularProgress>
      <HStack spacing={4}>
        <Stack>
          <Center
            color="blue.300"
            borderWidth="1.5px"
            rounded="full"
            borderColor="blue.300"
            px="2"
            w="max"
            shadow="sm"
          >
            <Text
              fontFamily={outfit.style.fontFamily}
              fontSize="sm"
              fontWeight={700}
            >
              {known}
            </Text>
          </Center>
          <Center
            color="yellow.400"
            borderWidth="1.5px"
            rounded="full"
            borderColor="yellow.400"
            px="2"
            w="max"
            shadow="sm"
          >
            <Text
              fontFamily={outfit.style.fontFamily}
              fontSize="sm"
              fontWeight={700}
            >
              {almostMastered}
            </Text>
          </Center>
          <Center
            color="orange.300"
            borderWidth="1.5px"
            rounded="full"
            borderColor="orange.300"
            px="2"
            w="max"
            shadow="sm"
          >
            <Text
              fontFamily={outfit.style.fontFamily}
              fontSize="sm"
              fontWeight={700}
            >
              {learning}
            </Text>
          </Center>
        </Stack>
        <Stack
          fontSize="md"
          fontWeight={700}
          color="gray.800"
          _dark={{
            color: "gray.50",
          }}
        >
          <Text>Know</Text>
          <Text>Almost Mastered</Text>
          <Text>Learning</Text>
        </Stack>
      </HStack>
    </HStack>
  );
};
