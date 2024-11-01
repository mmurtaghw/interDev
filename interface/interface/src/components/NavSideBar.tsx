import { Box } from "@chakra-ui/react";
import React from "react";
import CategoryHolder from "./CategoryHolder";
import { TrialFilter } from "../types/trialTypes";

interface Props {
  typeFilter: TrialFilter;
  setSelectedFilter: (selectedFilter: TrialFilter) => void;
}

const NavSideBar: React.FC<Props> = ({ typeFilter, setSelectedFilter }) => {
  return (
    <Box paddingX={5}>
      {/* Control overflow */}
      <CategoryHolder
        selectedCategory={
          Array.isArray(typeFilter.Sector)
            ? typeFilter.Sector[0]
            : typeFilter.Sector
        }
        categoryName="Sector"
        categoryTypeToFetch="Sector"
        onSelectCategory={(category) =>
          setSelectedFilter({
            ...typeFilter,
            Sector: category === null ? undefined : category.name,
          })
        }
      />
      <CategoryHolder
        selectedCategory={
          Array.isArray(typeFilter.countryCode)
            ? typeFilter.countryCode[0]
            : typeFilter.countryCode
        }
        categoryName="Country"
        categoryTypeToFetch="Countrycode"
        onSelectCategory={(countryCode) =>
          setSelectedFilter({
            ...typeFilter,
            countryCode: countryCode === null ? undefined : countryCode.name,
          })
        }
      />
    </Box>
  );
};

export default NavSideBar;
