exports.up = (pgm) => {
  pgm.sql('ALTER TABLE albums ADD COLUMN cover VARCHAR(50)');
};

exports.down = (pgm) => {
  pgm.dropColumns('albums', 'cover');
};
