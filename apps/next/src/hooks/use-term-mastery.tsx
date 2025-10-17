import { useLearnContext } from "../stores/use-learn-store";

export const useTermMastery = () => {
  const terms = useLearnContext((s) => s.studiableTerms);
  const unstudied = terms.filter((t) => t.correctness === 0);
  const almostMastered = terms.filter((t) => t.correctness === 1);
  const learning = terms.filter(
    (t) => t.correctness === -1 || t.correctness === -2,
  );
  const mastered = terms.filter((t) => t.correctness === 2);

  return [unstudied, almostMastered, learning, mastered];
};
