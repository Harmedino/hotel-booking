class Room {
  constructor({ id, name, city, price }) {
    this.id = id;
    this.name = name;
    this.city = city;
    this.price = price;
  }

  static validate(data) {
    if (!data.name || !data.city || typeof data.price !== 'number') {
      return false;
    }
    return true;
  }
}

module.exports = Room;
