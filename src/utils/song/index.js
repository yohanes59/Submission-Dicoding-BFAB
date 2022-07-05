const mapAlbumsDB = ({
  id,
  name,
  year,
  songs,
}) => ({
  id,
  name,
  year,
  songs,
});

const mapSongDB = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId,
});

const filterTitleSongByParams = (song, title) => (song.title.toLowerCase().includes(title));
const filterPerformerSongByParams = (song, performer) => (
  song.performer.toLowerCase().includes(performer));

module.exports = {
  mapAlbumsDB,
  mapSongDB,
  filterPerformerSongByParams,
  filterTitleSongByParams,
};
