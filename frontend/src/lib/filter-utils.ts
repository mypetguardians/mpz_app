export interface FilterState {
  breed: string;
  weights: string[];
  regions: string[];
  ages: string[];
  genders: string[];
  protectionStatus: string[];
  expertOpinion: string[];
}

export const getFilterCounts = (filters: FilterState) => {
  return {
    breed: filters.breed ? 1 : 0,
    weights: filters.weights.length,
    regions: filters.regions.length,
    ages: filters.ages.length,
    genders: filters.genders.length,
    protectionStatus: filters.protectionStatus.length,
    expertOpinion: filters.expertOpinion.length,
  };
};

export const getTotalFilterCount = (filters: FilterState) => {
  const counts = getFilterCounts(filters);
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
};

export const hasActiveFilters = (filters: FilterState) => {
  return getTotalFilterCount(filters) > 0;
};
