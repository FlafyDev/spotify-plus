type MenuFilter = (prePath: string[], afterPath: string[]) => boolean;

const menuFilters: { [menuName in "Any" | "EditProfile"]: MenuFilter } = {
  Any: () => true,
  EditProfile: (prePath, afterPath) =>
    !prePath.length && afterPath[0] === "user",
  // Album = "album",
  // Artist = "artist",
  // Concert = "concert",
  // Episode = "episode",
  // Feedback = "ban",
  // Generic = "generic",
  // LocalFileTrack = "local-file",
  // MultiSelect = "multi-select",
  // Playlist = "playlist",
  // RadioStation = "radio",
  // RootlistFolder = "folder",
  // RootlistPlaylist = "playlist", // I wonder what is Rootlist and why it has the same id as Playlist
  // Show = "show",
  // Track = "track",
  // User = "user",
  // SubtitlesPicker = "subtitles",
};

export { MenuFilter };
export default menuFilters;
