const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const albumsQuery = {
      text: 'SELECT * FROM albums WHERE id=$1',
      values: [id],
    };
    const resultAlbums = await this._pool.query(albumsQuery);

    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs 
      INNER JOIN albums 
      ON albums.id = songs."albumId" 
      WHERE albums.id=$1`,
      values: [id],
    };
    const resultSongs = await this._pool.query(songsQuery);

    if (!resultAlbums.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return {
      id: resultAlbums.rows[0].id,
      name: resultAlbums.rows[0].name,
      year: resultAlbums.rows[0].year,
      songs: resultSongs.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;
