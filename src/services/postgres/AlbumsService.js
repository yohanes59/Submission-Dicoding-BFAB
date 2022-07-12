/* eslint-disable no-else-return */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
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
      ON albums.id = songs."album_id"
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
      coverUrl: resultAlbums.rows[0].cover,
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

  async postUserAlbumLikeById(userId, albumId) {
    const queryAlbum = {
      text: `SELECT * FROM albums 
            WHERE id = $1`,
      values: [albumId],
    };
    const { rows: resultAlbum } = await this._pool.query(queryAlbum);

    if (!resultAlbum.length) throw new NotFoundError('Album tidak ditemukan');

    const querySearchLike = {
      text: `SELECT * FROM user_album_likes 
            WHERE user_id = $1 AND album_id = $2`,
      values: [userId, albumId],
    };
    const resultSearchLike = await this._pool.query(querySearchLike);
    if (!resultSearchLike.rows.length) {
      const id = `like-${nanoid(16)}`;
      const queryLike = {
        text: `INSERT INTO user_album_likes (id, user_id, album_id) 
              VALUES ($1, $2, $3)`,
        values: [id, userId, albumId],
      };
      await this._pool.query(queryLike);
      await this._cacheService.delete(`album-likes:${albumId}`);
      return 'Berhasil menyukai album';
    } else {
      const queryDeleteLike = {
        text: `DELETE FROM user_album_likes 
              WHERE user_id = $1 AND album_id = $2`,
        values: [userId, albumId],
      };

      await this._pool.query(queryDeleteLike);
      await this._cacheService.delete(`album-likes:${albumId}`);
      return 'Berhasil menghapus like album';
    }
  }

  async getUserAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(`album-likes:${albumId}`);
      return {
        source: 'cache',
        albumLikes: JSON.parse(result),
      };
    } catch (error) {
      const queryAlbum = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [albumId],
      };

      const resultAlbum = await this._pool.query(queryAlbum);

      if (!resultAlbum.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const queryLikes = {
        text: 'SELECT COUNT(user_id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const resultLikes = await this._pool.query(queryLikes);
      const resultLikesNumber = Number(resultLikes.rows[0].count);
      await this._cacheService.set(`album-likes:${albumId}`, JSON.stringify(resultLikesNumber));

      return {
        source: 'database',
        albumLikes: resultLikesNumber,
      };
    }
  }
}

module.exports = AlbumsService;
