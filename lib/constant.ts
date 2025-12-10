// Centralized movie scheduling data for use across the app

export type MovieEvent = {
  id: number;
  movieTitle: string;
  director: string;
  releasedYear: number;
  duration: number; // in minutes
  summary: string;
  poster: string; // image URL
  preview: string; // image URL
  timeslot: string; // 12-hour format (e.g., "12:00 PM")
  month: string; // lowercase (e.g., "december")
  week: string; // lowercase (e.g., "week-2")
};

export const movies: MovieEvent[] = [
  {
    id: 1,
    movieTitle: "Oppenheimer",
    director: "Christopher Nolan",
    releasedYear: 2023,
    duration: 120,
    summary:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    poster:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    preview:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    timeslot: "12:00 PM",
    month: "december",
    week: "week-2",
  },
  {
    id: 2,
    movieTitle: "Angels & Demons",
    director: "Ron Howard",
    releasedYear: 2009,
    duration: 138,
    summary:
      "Harvard symbologist Robert Langdon works with a nuclear physicist to solve a murder.",
    poster:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    preview:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    timeslot: "4:00 PM",
    month: "december",
    week: "week-1",
  },
  {
    id: 3,
    movieTitle: "The Menu",
    director: "Mark Mylod",
    releasedYear: 2022,
    duration: 120,
    summary:
      "A couple travels to a coastal island to eat at an exclusive restaurant where the chef has prepared a lavish menu.",
    poster:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    preview:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    timeslot: "2:00 PM",
    month: "december",
    week: "week-2",
  },
];

export default movies;
