import { create } from "zustand";

interface Movie {
  _id: string;
  movieTitle: string;
  previewPath: string;
  poster: string;
  slug: string;
  releasedYear: number;
  director: string;
  summary: string;
  timeslot: string;
}

interface MovieSelectionState {
  selectedMovie: Movie | null;
  selectedSeats: string[];
  setSelectedMovie: (movie: Movie) => void;
  setSelectedSeats: (seats: string[]) => void;
  clearSelection: () => void;
}

export const useMovieSelectionStore = create<MovieSelectionState>((set) => ({
  selectedMovie: null,
  selectedSeats: [],
  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  setSelectedSeats: (seats) => set({ selectedSeats: seats }),
  clearSelection: () => set({ selectedMovie: null, selectedSeats: [] }),
}));
