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

export async function deleteCustomer(customerId) {
  const id = typeof customerId === 'object' ? customerId.customer_id : customerId
  console.log('deleteCustomer called with:', id)
  
  const endpoint = `${API_BASE_URL}/deletecustomer?customer_id=${encodeURIComponent(id)}`
  console.log('deleteCustomer endpoint:', endpoint)
  
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const responseData = await response.json().catch(() => ({}))
    console.log('deleteCustomer response status:', response.status)
    console.log('deleteCustomer response data:', responseData)
    
    if (!response.ok) {
      const errorMessage = responseData?.error ?? 'Unable to delete customer.'
      throw new Error(errorMessage)
    }
    
    return responseData
  } catch (error) {
    console.error('deleteCustomer error:', error)
    throw error
  }
}