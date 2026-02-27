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

export function editCustomer(payload) {
  return request('/editcustomer', {
    method: 'PUT',
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

//delete customer
export async function deleteCustomer(payload) {
  // Backend expects customer_id as query parameter, not JSON body
  const customer_id = typeof payload === 'object' ? payload.customer_id : payload
  // Ensure correct endpoint path (no double 'api')
  const endpoint = API_BASE_URL.endsWith('/api')
    ? `${API_BASE_URL}/deletecustomer?customer_id=${encodeURIComponent(customer_id)}`
    : `${API_BASE_URL}/api/deletecustomer?customer_id=${encodeURIComponent(customer_id)}`
  const response = await fetch(endpoint, {
    method: 'PUT',
  })
  const responseData = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMessage = responseData?.error ?? responseData?.message ?? 'Unable to delete customer.'
    throw new Error(errorMessage)
  }
  return responseData
}