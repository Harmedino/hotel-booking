// Map Mongo documents to the API's JSON shapes.
const id = (v) => (v && v._id ? String(v._id) : v ? String(v) : null);

function hotelSummary(h) {
  if (!h || !h._id) return undefined;
  return { id: String(h._id), name: h.name, city: h.city, country: h.country, address: h.address, contact: h.contact, description: h.description };
}

function room(r, extra = {}) {
  return {
    id: String(r._id),
    hotelId: id(r.hotel),
    roomType: r.roomType,
    description: r.description,
    pricePerNight: r.pricePerNight,
    weekendPrice: r.weekendPrice || null,
    seasonalRates: (r.seasonalRates || []).map(({ name, start, end, price }) => ({ name, start, end, price })),
    maxGuests: r.maxGuests,
    totalUnits: r.totalUnits,
    amenities: r.amenities,
    images: r.images,
    isAvailable: r.isAvailable,
    rating: r.ratingAvg ? Math.round(r.ratingAvg * 10) / 10 : null,
    reviewCount: r.reviewCount || 0,
    createdAt: r.createdAt,
    hotel: hotelSummary(r.hotel),
    ...extra,
  };
}

function hotel(h, extra = {}) {
  return {
    id: String(h._id),
    ownerId: id(h.owner),
    name: h.name,
    description: h.description,
    address: h.address,
    city: h.city,
    country: h.country,
    contact: h.contact,
    coverImage: h.coverImage || null,
    isActive: h.isActive,
    createdAt: h.createdAt,
    ...extra,
  };
}

function booking(b) {
  return {
    id: String(b._id),
    reference: b.reference,
    userId: id(b.user),
    roomId: id(b.room),
    hotelId: id(b.hotel),
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests,
    nights: b.nights,
    pricePerNight: b.pricePerNight,
    priceLines: b.priceLines?.length ? b.priceLines.map(({ label, price, nights }) => ({ label, price, nights })) : null,
    subtotal: b.subtotal,
    discount: b.discount,
    taxes: b.taxes,
    totalPrice: b.totalPrice,
    promoCode: b.promoCode || null,
    status: b.status,
    paymentMethod: b.paymentMethod,
    isPaid: b.isPaid,
    isRefunded: b.isRefunded,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    specialRequests: b.specialRequests,
    hasReview: b.hasReview,
    cancelledAt: b.cancelledAt || null,
    createdAt: b.createdAt,
    room: b.room && b.room._id ? { id: String(b.room._id), roomType: b.room.roomType, images: b.room.images } : undefined,
    hotel: b.hotel && b.hotel._id
      ? { id: String(b.hotel._id), name: b.hotel.name, city: b.hotel.city, address: b.hotel.address, contact: b.hotel.contact }
      : undefined,
  };
}

function review(r) {
  return {
    id: String(r._id),
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    user: { name: r.user?.name || 'Guest', avatarUrl: r.user?.avatarUrl || null },
  };
}

module.exports = { room, hotel, booking, review };
