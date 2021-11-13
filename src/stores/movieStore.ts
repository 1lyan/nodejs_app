class MovieStore {
  movies: Array<any> = [];

  add(movie = Object) {
    this.movies.push(movie);
  }

  findById(id: number | string) {
    const movie = this.movies.find((m) => m.imdbID === id);
    return movie;
  }

  destroy(movie = Object) {
    const index = this.movies.indexOf(movie);
    this.movies.splice(index, 1);
  }
}

export default MovieStore;