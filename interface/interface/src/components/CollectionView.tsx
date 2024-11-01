// src/components/CollectionView.tsx

import React from "react";
import { VStack, Button, Box, Heading } from "@chakra-ui/react";
import GameGrid from "./GameGrid";
import { Trial, TrialFilter } from "../types/trialTypes";
import { CollectionType } from "../types/collectionTypes";

export interface Props {
  collectionName: string;
  collections: CollectionType[];
  onSelectTrial: (selectedTrial: Trial) => void;
  onAddTrialToCollection: (trialId: string, collectionName: string) => void;
  onRemoveTrialFromCollection: (
    trialId: string,
    collectionName: string
  ) => void;
  isTrialInCollection: (trialId: string, collectionName: string) => boolean;
  trialFilter: TrialFilter;
  downloadCollection: (collectionName: string) => void;
}

const CollectionView: React.FC<Props> = ({
  collectionName,
  collections,
  onSelectTrial,
  onAddTrialToCollection,
  onRemoveTrialFromCollection,
  isTrialInCollection,
  trialFilter,
  downloadCollection,
}) => {
  const collection = collections.find((col) => col.name === collectionName);
  const trialIds = collection ? collection.trialIds : [];

  return (
    <VStack spacing={4} align="stretch" padding={4}>
      <Heading as="h2" size="lg">
        Collection: {collectionName}
      </Heading>
      <Button
        colorScheme="green"
        size="md"
        onClick={() => downloadCollection(collectionName)}
        isDisabled={!collection || collection.trialIds.length === 0}
      >
        Download Collection
      </Button>
      {collection && collection.trialIds.length > 0 ? (
        <GameGrid
          trialFilter={trialFilter}
          onSelectTrial={onSelectTrial}
          trialIds={trialIds}
          onAddTrialToCollection={(trialId) =>
            onAddTrialToCollection(trialId, collectionName)
          }
          onRemoveTrialFromCollection={(trialId) =>
            onRemoveTrialFromCollection(trialId, collectionName)
          }
          isTrialInCollection={(trialId) =>
            isTrialInCollection(trialId, collectionName)
          }
          collections={collections} // Added this line
        />
      ) : (
        <Box padding={4}>No trials in this collection.</Box>
      )}
    </VStack>
  );
};

export default CollectionView;
