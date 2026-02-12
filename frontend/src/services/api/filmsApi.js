import { request } from './httpClient'

export function getTopFiveRentedFilms() {
  return request('/top5rented')
}

export function getTopFiveActors() {
  return request('/top5actors')
}

export function searchFilms(searchTerm) {
  const encodedTerm = encodeURIComponent(searchTerm)
  return request(`/searchfilms?search=${encodedTerm}`)
}
