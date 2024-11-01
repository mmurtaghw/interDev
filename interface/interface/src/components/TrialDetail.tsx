// TrialDetail.tsx

import React from "react";
import { VStack, Text, Box } from "@chakra-ui/react";
import { Trial } from "../types/trialTypes";
import AddCollectionButton from "./AddCollectionButton";
import { CollectionType } from "../types/collectionTypes";

interface Props {
  trial: Trial;
  collections: CollectionType[];
  onAddTrialToCollection: (trialId: string, collectionName: string) => void;
  onCreateCollection: (name: string) => void;
}

const TrialDetail: React.FC<Props> = ({
  trial,
  collections,
  onAddTrialToCollection,
  onCreateCollection,
}) => {
  return (
    <VStack spacing={4} align="stretch" padding={4}>
      <Box>
        <Text fontSize="xl" fontWeight="bold">
          {trial.Title}
        </Text>
        {/* Display other trial details */}
      </Box>
      <AddCollectionButton
        trial={trial}
        collections={collections}
        onAddTrialToCollection={onAddTrialToCollection}
        onCreateCollection={onCreateCollection}
      />
    </VStack>
  );
};

export default TrialDetail;
