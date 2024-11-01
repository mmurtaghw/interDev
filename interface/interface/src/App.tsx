// App.tsx

import React, { useState, useCallback } from "react";
import { Grid, GridItem, VStack, Show } from "@chakra-ui/react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import NavSideBar from "./components/NavSideBar";
import GameGrid from "./components/GameGrid";
import TrialDetail from "./components/TrialDetail";
import TrialSubmissionForm from "./components/TrialSubmissionForm";
import CollectionList from "./components/CollectionList";
import CollectionView, {
  Props as CollectionViewProps,
} from "./components/CollectionView";
import { Trial, TrialFilter } from "./types/trialTypes";
import { CollectionType } from "./types/collectionTypes";

function App() {
  const [typeFilter, setSelectedFilter] = useState<TrialFilter>(
    {} as TrialFilter
  );
  const [selectedTrial, setSelectedTrial] = useState<Trial>({} as Trial);

  // State to manage multiple collections
  const [collections, setCollections] = useState<CollectionType[]>([]);

  const resetFilter = useCallback(() => {
    setSelectedFilter({} as TrialFilter); // Reset the filter to initial state
  }, []);

  // Function to add a trial to a collection
  const addToCollection = (trialId: string, collectionName: string) => {
    setCollections((prevCollections) => {
      const collectionIndex = prevCollections.findIndex(
        (col) => col.name === collectionName
      );

      if (collectionIndex !== -1) {
        const collection = prevCollections[collectionIndex];
        if (!collection.trialIds.includes(trialId)) {
          const updatedCollection = {
            ...collection,
            trialIds: [...collection.trialIds, trialId],
          };
          const newCollections = [...prevCollections];
          newCollections[collectionIndex] = updatedCollection;
          return newCollections;
        }
      } else {
        // If collection doesn't exist, create it and add the trial
        return [
          ...prevCollections,
          { name: collectionName, trialIds: [trialId] },
        ];
      }
      return prevCollections;
    });
  };

  // Function to remove a trial from a collection
  const removeFromCollection = (trialId: string, collectionName: string) => {
    setCollections((prevCollections) => {
      const collectionIndex = prevCollections.findIndex(
        (col) => col.name === collectionName
      );

      if (collectionIndex !== -1) {
        const collection = prevCollections[collectionIndex];
        const updatedTrialIds = collection.trialIds.filter(
          (id) => id !== trialId
        );
        const updatedCollection = { ...collection, trialIds: updatedTrialIds };
        const newCollections = [...prevCollections];
        newCollections[collectionIndex] = updatedCollection;
        return newCollections;
      }
      return prevCollections;
    });
  };

  // Function to check if a trial is in a collection
  const isTrialInCollection = (trialId: string, collectionName: string) => {
    const collection = collections.find((col) => col.name === collectionName);
    return collection ? collection.trialIds.includes(trialId) : false;
  };

  // Function to create a new collection
  const createCollection = (name: string) => {
    setCollections((prevCollections) => {
      if (!prevCollections.some((col) => col.name === name)) {
        return [...prevCollections, { name, trialIds: [] }];
      }
      return prevCollections;
    });
  };

  // Function to download a collection
  const downloadCollection = async (collectionName: string) => {
    const collection = collections.find((col) => col.name === collectionName);
    if (!collection || collection.trialIds.length === 0) {
      alert("No trials in the collection to download.");
      return;
    }

    const baseUrl = "http://127.0.0.1:5000/download_knowledge_graph_data";
    const query = `trialIds=${collection.trialIds.join("&trialIds=")}`;

    try {
      const response = await fetch(`${baseUrl}?${query}`);
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${collectionName}.ttl`); // Use collection name as filename
      document.body.appendChild(link);
      link.click();

      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download the collection:", error);
      alert("Failed to download the collection. Please try again.");
    }
  };

  const navigate = useNavigate();

  return (
    <Grid
      templateAreas={{
        base: `"nav" "main"`,
        lg: `"nav nav" "aside main"`,
      }}
      templateColumns={{
        base: "1fr",
        lg: "200px 1fr",
      }}
    >
      {/* Navigation Bar */}
      <GridItem area="nav">
        <NavBar resetSelectedFilter={resetFilter} />
      </GridItem>

      {/* Sidebar */}
      <Show above="lg">
        <GridItem area="aside">
          <NavSideBar
            typeFilter={typeFilter}
            setSelectedFilter={setSelectedFilter}
          />
        </GridItem>
      </Show>

      {/* Main Content */}
      <GridItem area="main">
        <Routes>
          {/* Main game grid */}
          <Route
            path="/"
            element={
              <GameGrid
                trialFilter={typeFilter}
                onSelectTrial={setSelectedTrial}
                onAddTrialToCollection={addToCollection}
                onRemoveTrialFromCollection={removeFromCollection}
                isTrialInCollection={isTrialInCollection}
                collections={collections}
                onCreateCollection={createCollection} // Added this to GameGrid
              />
            }
          />

          {/* Trial detail route */}
          <Route
            path="/trial/:projectName"
            element={
              <TrialDetail
                trial={selectedTrial}
                collections={collections}
                onAddTrialToCollection={addToCollection}
                onCreateCollection={createCollection}
              />
            }
          />

          {/* Submission form */}
          <Route path="/submission" element={<TrialSubmissionForm />} />

          {/* Collection list route */}
          <Route
            path="/collections"
            element={
              <CollectionList
                collections={collections}
                onCreateCollection={createCollection}
                onSelectCollection={(name) => {
                  // Navigate to the specific collection
                  navigate(`/collection/${encodeURIComponent(name)}`);
                }}
              />
            }
          />

          {/* Collection route with collectionName parameter */}
          <Route
            path="/collection/:collectionName"
            element={
              <CollectionRouteComponent
                collections={collections}
                onSelectTrial={setSelectedTrial}
                onAddTrialToCollection={addToCollection}
                onRemoveTrialFromCollection={removeFromCollection}
                isTrialInCollection={isTrialInCollection}
                trialFilter={typeFilter}
                downloadCollection={downloadCollection}
              />
            }
          />
        </Routes>
      </GridItem>
    </Grid>
  );
}

// Helper component to use useParams inside Routes
function CollectionRouteComponent(
  props: Omit<CollectionViewProps, "collectionName">
) {
  const { collectionName } = useParams<{ collectionName: string }>();
  return <CollectionView collectionName={collectionName!} {...props} />;
}

export default App;
