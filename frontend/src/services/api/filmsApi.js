import { request } from './httpClient'

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
