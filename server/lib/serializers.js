// Map DB rows (snake_case) to API shapes (camelCase).

function room(r) {
  return {
    id: r.id,
    hotelId: r.hotel_id,
    roomType: r.room_type,
    description: r.description,
    pricePerNight: r.price_per_night,
    maxGuests: r.max_guests,
    totalUnits: r.total_units,
    amenities: r.amenities,
    images: r.images,
    isAvailable: r.is_available,
    rating: r.rating_avg !== undefined && r.rating_avg !== null ? Math.round(r.rating_avg * 10) / 10 : null,
    reviewCount: r.review_count ?? 0,
    unitsLeft: r.units_left ?? undefined,
    createdAt: r.created_at,
    hotel: r.hotel_name !== undefined
      ? {
          id: r.hotel_id,
          name: r.hotel_name,
          city: r.hotel_city,
          country: r.hotel_country,
          address: r.hotel_address,
          contact: r.hotel_contact,
          description: r.hotel_description,
        }
      : undefined,
  };
}

function hotel(h) {
  return {
    id: h.id,
    ownerId: h.owner_id,
    name: h.name,
    description: h.description,
    address: h.address,
    city: h.city,
    country: h.country,
    contact: h.contact,
    coverImage: h.cover_image,
    isActive: h.is_active,
    roomCount: h.room_count ?? undefined,
    createdAt: h.created_at,
  };
}

function booking(b) {
  return {
    id: b.id,
    reference: b.reference,
    userId: b.user_id,
    roomId: b.room_id,
    hotelId: b.hotel_id,
    checkIn: b.check_in,
    checkOut: b.check_out,
    guests: b.guests,
    nights: b.nights,
    pricePerNight: b.price_per_night,
    subtotal: b.subtotal,
    discount: b.discount,
    taxes: b.taxes,
    totalPrice: b.total_price,
    promoCode: b.promo_code,
    status: b.status,
    paymentMethod: b.payment_method,
    isPaid: b.is_paid,
    isRefunded: b.is_refunded,
    guestName: b.guest_name,
    guestEmail: b.guest_email,
    guestPhone: b.guest_phone,
    specialRequests: b.special_requests,
    hasReview: b.has_review ?? undefined,
    cancelledAt: b.cancelled_at,
    createdAt: b.created_at,
    room: b.room_type !== undefined
      ? { id: b.room_id, roomType: b.room_type, images: b.room_images }
      : undefined,
    hotel: b.hotel_name !== undefined
      ? { id: b.hotel_id, name: b.hotel_name, city: b.hotel_city, address: b.hotel_address, contact: b.hotel_contact }
      : undefined,
  };
}

function review(r) {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    user: { name: r.user_name, avatarUrl: r.user_avatar },
  };
}

module.exports = { room, hotel, booking, review };
