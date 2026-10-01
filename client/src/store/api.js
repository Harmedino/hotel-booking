import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../lib/config';
import { logout, setUser } from './authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQuery = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401 && api.getState().auth.token && api.endpoint !== 'login') {
    api.dispatch(logout());
  }
  return result;
};

// Pulls a readable message out of an RTK Query error.
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err) return fallback;
  if (err.status === 'FETCH_ERROR') return 'Cannot reach the server. It may be waking up; try again in a minute.';
  // Hosts return an HTML error page (502/503) while the API is down or restarting.
  if (err.status === 'PARSING_ERROR' || (typeof err.status === 'number' && err.status >= 502)) {
    return 'The server is starting up or unavailable. Please try again in a minute.';
  }
  return err.data?.error || fallback;
};

const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Room', 'Rooms', 'Booking', 'Wishlist', 'Review', 'OwnerHotel', 'OwnerRoom', 'OwnerBooking', 'OwnerStats', 'Calendar', 'OwnerCalendar'],
  endpoints: (b) => ({
    // Public
    getConfig: b.query({ query: () => '/config' }),
    getStats: b.query({ query: () => '/stats' }),
    getCities: b.query({ query: () => '/cities' }),
    getOffers: b.query({ query: () => '/offers' }),
    getFilters: b.query({ query: () => '/rooms/filters' }),
    getRooms: b.query({ query: (params) => ({ url: '/rooms', params: clean(params) }), providesTags: ['Rooms'] }),
    getFeatured: b.query({ query: () => '/rooms/featured', providesTags: ['Rooms'] }),
    getRoom: b.query({ query: (id) => `/rooms/${id}`, providesTags: (r, e, id) => [{ type: 'Room', id }] }),
    getSimilar: b.query({ query: (id) => `/rooms/${id}/similar` }),
    getRoomCalendar: b.query({
      query: (id) => ({ url: `/rooms/${id}/calendar`, params: { days: 180 } }),
      providesTags: (r, e, id) => [{ type: 'Calendar', id }],
      keepUnusedDataFor: 60,
    }),
    getQuote: b.query({ query: ({ id, ...params }) => ({ url: `/rooms/${id}/quote`, params: clean(params) }), keepUnusedDataFor: 10 }),
    getReviews: b.query({ query: (id) => `/rooms/${id}/reviews`, providesTags: (r, e, id) => [{ type: 'Review', id }] }),
    addReview: b.mutation({
      query: ({ id, ...body }) => ({ url: `/rooms/${id}/reviews`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Review', id }, { type: 'Room', id }, 'Booking', 'Rooms'],
    }),
    subscribe: b.mutation({ query: (email) => ({ url: '/newsletter', method: 'POST', body: { email } }) }),

    // Auth
    login: b.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    register: b.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    forgotPassword: b.mutation({ query: (email) => ({ url: '/auth/forgot-password', method: 'POST', body: { email } }) }),
    resetPassword: b.mutation({ query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }) }),
    getMe: b.query({
      query: () => '/auth/me',
      providesTags: ['Me'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch { /* handled by baseQuery */ }
      },
    }),
    updateMe: b.mutation({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setUser(data));
      },
    }),
    changePassword: b.mutation({ query: (body) => ({ url: '/auth/me/password', method: 'POST', body }) }),

    // Bookings
    createBooking: b.mutation({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: ['Booking', 'OwnerBooking', 'OwnerStats', 'Calendar', 'OwnerCalendar'],
    }),
    myBookings: b.query({ query: () => '/bookings/mine', providesTags: ['Booking'] }),
    getBooking: b.query({ query: (id) => `/bookings/${id}`, providesTags: ['Booking'] }),
    cancelBooking: b.mutation({
      query: (id) => ({ url: `/bookings/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Booking', 'OwnerBooking', 'OwnerStats', 'Calendar', 'OwnerCalendar'],
    }),
    payBooking: b.mutation({ query: (id) => ({ url: `/bookings/${id}/pay`, method: 'POST' }) }),
    verifyPayment: b.query({ query: (sessionId) => ({ url: '/payments/verify', params: { session_id: sessionId } }) }),

    // Wishlist
    wishlist: b.query({ query: () => '/wishlist', providesTags: ['Wishlist'] }),
    wishlistIds: b.query({ query: () => '/wishlist/ids', providesTags: ['Wishlist'] }),
    toggleSaved: b.mutation({
      query: ({ roomId, saved }) => ({ url: `/wishlist/${roomId}`, method: saved ? 'PUT' : 'DELETE' }),
      // Optimistic: flip the heart instantly, roll back on failure.
      async onQueryStarted({ roomId, saved }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData('wishlistIds', undefined, (ids) =>
            saved ? [...new Set([...ids, roomId])] : ids.filter((id) => id !== roomId)
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (r, e, { roomId }) => [{ type: 'Room', id: roomId }, 'Wishlist'],
    }),

    // Uploads
    uploadImages: b.mutation({
      query: (files) => {
        const form = new FormData();
        files.forEach((f) => form.append('images', f));
        return { url: '/uploads', method: 'POST', body: form };
      },
    }),

    // Owner
    ownerHotels: b.query({ query: () => '/owner/hotels', providesTags: ['OwnerHotel'] }),
    createHotel: b.mutation({
      query: (body) => ({ url: '/owner/hotels', method: 'POST', body }),
      invalidatesTags: ['OwnerHotel', 'Me', 'OwnerStats'],
    }),
    updateHotel: b.mutation({
      query: ({ id, ...body }) => ({ url: `/owner/hotels/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['OwnerHotel', 'OwnerRoom', 'Rooms'],
    }),
    deleteHotel: b.mutation({
      query: (id) => ({ url: `/owner/hotels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OwnerHotel', 'OwnerRoom', 'Rooms', 'OwnerStats'],
    }),
    ownerRooms: b.query({ query: () => '/owner/rooms', providesTags: ['OwnerRoom'] }),
    createRoom: b.mutation({
      query: (body) => ({ url: '/owner/rooms', method: 'POST', body }),
      invalidatesTags: ['OwnerRoom', 'OwnerHotel', 'Rooms', 'OwnerStats'],
    }),
    updateRoom: b.mutation({
      query: ({ id, ...body }) => ({ url: `/owner/rooms/${id}`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['OwnerRoom', 'Rooms', { type: 'Room', id }, { type: 'Calendar', id }, 'OwnerCalendar'],
    }),
    deleteRoom: b.mutation({
      query: (id) => ({ url: `/owner/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OwnerRoom', 'OwnerHotel', 'Rooms', 'OwnerStats'],
    }),
    ownerBookings: b.query({ query: (params) => ({ url: '/owner/bookings', params: clean(params) }), providesTags: ['OwnerBooking'] }),
    updateOwnerBooking: b.mutation({
      query: ({ id, ...body }) => ({ url: `/owner/bookings/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['OwnerBooking', 'OwnerStats', 'Booking', 'Calendar', 'OwnerCalendar'],
    }),
    ownerCalendar: b.query({
      query: ({ from, days }) => ({ url: '/owner/calendar', params: clean({ from, days }) }),
      providesTags: ['OwnerCalendar'],
    }),
    createBlock: b.mutation({
      query: (body) => ({ url: '/owner/blocks', method: 'POST', body }),
      invalidatesTags: ['OwnerCalendar', 'Calendar', 'Rooms'],
    }),
    deleteBlock: b.mutation({
      query: (id) => ({ url: `/owner/blocks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OwnerCalendar', 'Calendar', 'Rooms'],
    }),
    ownerStats: b.query({ query: (days) => ({ url: '/owner/stats', params: { days } }), providesTags: ['OwnerStats'] }),
  }),
});

export const {
  useGetConfigQuery, useGetStatsQuery, useGetCitiesQuery, useGetOffersQuery, useGetFiltersQuery, useGetRoomsQuery,
  useGetFeaturedQuery, useGetRoomQuery, useGetRoomCalendarQuery, useGetBookingQuery, useOwnerCalendarQuery,
  useCreateBlockMutation, useDeleteBlockMutation, useGetSimilarQuery, useGetQuoteQuery, useGetReviewsQuery, useAddReviewMutation,
  useSubscribeMutation, useLoginMutation, useRegisterMutation, useForgotPasswordMutation, useResetPasswordMutation,
  useGetMeQuery, useUpdateMeMutation, useChangePasswordMutation, useCreateBookingMutation, useMyBookingsQuery,
  useCancelBookingMutation, usePayBookingMutation, useVerifyPaymentQuery, useWishlistQuery, useWishlistIdsQuery,
  useToggleSavedMutation, useUploadImagesMutation, useOwnerHotelsQuery, useCreateHotelMutation, useUpdateHotelMutation,
  useDeleteHotelMutation, useOwnerRoomsQuery, useCreateRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation,
  useOwnerBookingsQuery, useUpdateOwnerBookingMutation, useOwnerStatsQuery,
} = api;
