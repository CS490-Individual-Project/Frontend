import { request } from './httpClient'
import { API_BASE_URL } from './httpClient'

export function getAllCustomers() {
  return request('/allcustomers')
}

export function searchCustomers(searchTerm) {
  const encodedTerm = encodeURIComponent(searchTerm)
  return request(`/searchcustomers?search=${encodedTerm}`)
}

export function addCustomer(payload) {
  return request('/addcustomer', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
// matched format of films page rent for returns on customer page 
export async function returnFilm(payload) {
  const response = await fetch(`${API_BASE_URL}/returnfilm`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseData = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMessage = responseData?.error ?? responseData?.message ?? 'Unable to return film.'
    throw new Error(errorMessage)
  }

  return responseData
}
