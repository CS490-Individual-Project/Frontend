import { request } from './httpClient'

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
