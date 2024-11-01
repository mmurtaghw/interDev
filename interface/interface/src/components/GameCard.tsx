// src/components/TrialCard.tsx

import React, { useState } from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { Trial } from "../types/trialTypes";
import { CollectionType } from "../types/collectionTypes";

interface TrialCardProps {
  trial: Trial;
  onSelectTrial: (selectedTrial: Trial) => void;
  onAddToCollection: (trialId: string, collectionName: string) => void;
  onRemoveFromCollection: (trialId: string, collectionName: string) => void;
  isInCollection: (collectionName: string) => boolean;
  collections: CollectionType[];
}

const TrialCard: React.FC<TrialCardProps> = ({
  trial,
  onSelectTrial,
  onAddToCollection,
  onRemoveFromCollection,
  isInCollection,
  collections,
}) => {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );

  const truncatedAbstract =
    trial.Abstract.length > 150
      ? `${trial.Abstract.substring(0, 150)}...`
      : trial.Abstract;

  const handleAddOrRemove = (collectionName: string) => {
    if (isInCollection(collectionName)) {
      onRemoveFromCollection(trial.id, collectionName);
    } else {
      onAddToCollection(trial.id, collectionName);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p="4">
      <VStack spacing={3} align="start">
        <Text fontWeight="bold">{trial.Title}</Text>
        <Text fontSize="sm">{trial.Authors}</Text>
        <Text fontSize="sm">{truncatedAbstract}</Text>

        <Button onClick={() => onSelectTrial(trial)}>View Details</Button>

        {/* Dropdown Menu for Collection Management */}
        <Menu>
          <MenuButton as={Button} colorScheme="blue">
            Add to Collection
          </MenuButton>
          <MenuList>
            {/* Create new collection option */}
            <MenuItem
              onClick={() => {
                const newCollection = prompt("Enter new collection name");
                if (newCollection) {
                  handleAddOrRemove(newCollection);
                }
              }}
            >
              Create New Collection
            </MenuItem>

            {/* Existing collections */}
            {collections.map((collection) => (
              <MenuItem
                key={collection.name}
                onClick={() => handleAddOrRemove(collection.name)}
              >
                {isInCollection(collection.name)
                  ? `Remove from ${collection.name}`
                  : `Add to ${collection.name}`}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </VStack>
    </Box>
  );
};

export default TrialCard;
