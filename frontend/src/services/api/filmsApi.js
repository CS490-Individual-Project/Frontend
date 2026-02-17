import { request } from './httpClient'
import { API_BASE_URL } from './httpClient'

export function getTopFiveRentedFilms() {
  return request('/top5rented')
}

export function getTopFiveActors() {
  return request('/top5actors')
}

export function getActorDetails(actorId) {
  return request(`/get_actordetails?actor_id=${encodeURIComponent(actorId)}`)
}

export function getFilmDetails(filmId) {
  return request(`/get_filmdetails?film_id=${encodeURIComponent(filmId)}`)
}

export function searchFilms(searchTerm) {
  const encodedTerm = encodeURIComponent(searchTerm)
  return request(`/searchfilms?search=${encodedTerm}`)
}

export async function rentFilm(payload) {
  const response = await fetch(`${API_BASE_URL}/rentfilm`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseData = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMessage = responseData?.error ?? responseData?.message ?? 'Unable to rent film.'
    throw new Error(errorMessage)
  }

  return responseData
}
