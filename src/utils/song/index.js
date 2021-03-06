const mapSongDB = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id,
});

const filterTitleSongByParams = (song, title) => (song.title.toLowerCase().includes(title));
const filterPerformerSongByParams = (song, performer) => (
  song.performer.toLowerCase().includes(performer));

module.exports = {
  mapSongDB,
  filterPerformerSongByParams,
  filterTitleSongByParams,
};
