class Booking {
  constructor({ id, roomId, roomName, checkInDate, checkOutDate, guests, customerEmail, totalPrice }) {
    this.id = id;
    this.roomId = roomId;
    this.roomName = roomName;
    this.checkInDate = checkInDate;
    this.checkOutDate = checkOutDate;
    this.guests = guests || 1;
    this.customerEmail = customerEmail;
    this.totalPrice = totalPrice || 0;
  }

  static validate(data) {
    return !!(data.roomId && data.checkInDate && data.checkOutDate && data.customerEmail);
  }
}

module.exports = Booking;
