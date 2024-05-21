import { Button, Grid, GridItem, Show, Text, VStack } from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import GameGrid from "./components/GameGrid";
import { useState, useCallback } from "react";
import { Category } from "./hooks/useCategories";
import { Trial, TrialFilter } from "./hooks/useTrials";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import TrialDetail from "./components/TrialDetail";
import NavSideBar from "./components/NavSideBar";
import TrialSubmissionForm from "./components/TrialSubmissionForm";
import Collection from "./components/Collection";
import AddCollectionButton from "./components/AddCollectionButton";

function App() {
  const [typeFilter, setSelectedFilter] = useState<TrialFilter>(
    {} as TrialFilter
  );
  const [selectedTrial, setSelectedTrial] = useState<Trial>({} as Trial);
  const [trialCollection, setTrialCollection] = useState<string[]>([]);
  const isTrialInCollection = (trialId: string) => {
    return trialCollection.includes(trialId);
  };
  const resetFilter = useCallback(() => {
    setSelectedFilter({} as TrialFilter); // Reset the filter to initial state
  }, []);

  const addToCollection = (trialId: string) => {
    setTrialCollection((prevCollection) => {
      // Check if the trialId is already in the collection
      if (!prevCollection.includes(trialId)) {
        return [...prevCollection, trialId];
      }
      return prevCollection;
    });
  };
  const removeFromCollection = (trialId: string) => {
    setTrialCollection((prevCollection) => {
      // Remove the trialId from the collection
      return prevCollection.filter((id) => id !== trialId);
    });
  };

  //This should be moved somewhere
  const downloadCollection = async () => {
    if (trialCollection.length === 0) {
      alert("No trials in the collection to download.");
      return;
    }

    const baseUrl = "http://127.0.0.1:5000/download_knowledge_graph_data";
    const query = `trialIds=${trialCollection.join("&trialIds=")}`;

    try {
      const response = await fetch(`${baseUrl}?${query}`);
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "collection.ttl"); // Define the filename for download
      document.body.appendChild(link);
      link.click();

      // Check if the link has a parent node before removing it
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }

      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download the collection:", error);
      alert("Failed to download the collection. Please try again.");
    }
  };

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
      <GridItem area="nav">
        {" "}
        <NavBar resetSelectedFilter={resetFilter}></NavBar>
      </GridItem>
      <Routes>
        <Route
          path="/"
          element={
            <NavSideBar
              typeFilter={typeFilter}
              setSelectedFilter={setSelectedFilter}
            ></NavSideBar>
          }
        />
        <Route
          path="/collection"
          element={
            <VStack spacing={4} align="stretch">
              <Button
                colorScheme="green"
                size="md"
                marginLeft={4}
                marginRight={4}
                onClick={downloadCollection}
              >
                Download Collection
              </Button>

              <NavSideBar
                typeFilter={typeFilter}
                setSelectedFilter={setSelectedFilter}
              />
            </VStack>
          }
        />
        <Route
          path="/trial/:projectName"
          element={
            <VStack spacing={4} align="stretch">
              <AddCollectionButton
                trial={selectedTrial}
                onAddTrialToCollection={addToCollection}
                onRemoveTrialFromCollection={removeFromCollection}
                isInCollection={isTrialInCollection}
                buttonProps={{
                  size: "md",
                  marginLeft: 4,
                  marginRight: 4,
                  whiteSpace: "normal",
                }}
              />
            </VStack>
          }
        />
      </Routes>
      <GridItem area="main">
        <Routes>
          <Route
            path="/"
            element={
              <GameGrid
                trialFilter={typeFilter}
                onSelectTrial={setSelectedTrial}
                isInCollection={isTrialInCollection}
                onAddTrialToCollection={addToCollection}
                onRemoveTrialFromCollection={removeFromCollection}
              />
            }
          />
          {/* Dynamic route for trials */}
          <Route
            path="/trial/:projectName"
            element={<TrialDetail trial={selectedTrial} />}
          />
          <Route
            path="/submission"
            element={
              <>
                <TrialSubmissionForm></TrialSubmissionForm>
              </>
            } // A component to display trial details
          />
          <Route
            path="/collection"
            element={
              <>
                <Collection
                  onSelectTrial={setSelectedTrial}
                  trialFilter={typeFilter}
                  trialIds={trialCollection}
                  isInCollection={isTrialInCollection}
                  onAddTrialToCollection={addToCollection}
                  onRemoveTrialFromCollection={removeFromCollection}
                ></Collection>
              </>
            } // A component to display trial details
          />
        </Routes>
      </GridItem>
    </Grid>
  );
}

export default App;
