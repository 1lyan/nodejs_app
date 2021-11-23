class MovieStore {
  nextId() {
    return new Date().getTime().toString(35);
  }
}

export default MovieStore;
