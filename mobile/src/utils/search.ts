import { createFilter } from "react-native-search-filter";

interface SearchFilterArgs {
  filterFields: string[];
  searchSubstring: string;
}

export const createSearchFilter = ({
  filterFields,
  searchSubstring,
}: SearchFilterArgs) => createFilter(searchSubstring, filterFields);
