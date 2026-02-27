import { useEffect, useState } from 'react'
import { getAllCustomers, returnFilm, deleteCustomer, editCustomer } from '../services/api/customersApi'
import { request } from '../services/api/httpClient'

function CustomersPage() {
  const [isDeletingCustomerId, setIsDeletingCustomerId] = useState(null)
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [returningCustomerId, setReturningCustomerId] = useState(null)
  const [returnRentalId, setReturnRentalId] = useState('')
  const [returnStatus, setReturnStatus] = useState({
    type: '',
    message: '',
  })
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)
  const [customerDetailsById, setCustomerDetailsById] = useState({})

  // Edit customer state
  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [editStatus, setEditStatus] = useState({ type: '', message: '' })
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const customersPerPage = 40

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAllCustomers()
        setCustomers(data)
        setCurrentPage(1)
      } catch {
        setError('Unable to load customers.')
      }
    }

    loadCustomers()
  }, [])

  const totalPages = Math.ceil(customers.length / customersPerPage)
  const startIndex = (currentPage - 1) * customersPerPage
  const visibleCustomers = customers.slice(startIndex, startIndex + customersPerPage)

  function changePage(page) {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  function handleCustomerClick(customerId) {
    const isSameCustomer = selectedCustomerId === customerId
    setSelectedCustomerId(isSameCustomer ? null : customerId)
    // Close edit form if we're selecting a different customer or collapsing cur customer
    setEditingCustomerId(null)

    if (!isSameCustomer && !customerDetailsById[customerId]) {
      // Fetch details if not already loaded
      request(`/get_customerdetails?customer_id=${customerId}`)
        .then((data) => {
          setCustomerDetailsById((prev) => ({ ...prev, [customerId]: data }))
        })
        .catch(() => {
          setCustomerDetailsById((prev) => ({ ...prev, [customerId]: { error: 'Unable to load details.' } }))
        })
    }
  }

  function handleEditClick(customerId) {
    if (editingCustomerId === customerId) {
      setEditingCustomerId(null)
      return
    }

    const details = customerDetailsById[customerId]
    if (details && !details.error) {
      setEditingCustomerId(customerId)
      setEditFormData({
        first_name: details.first_name || '',
        last_name: details.last_name || '',
        email: details.email || '',
      })
      setEditStatus({ type: '', message: '' })
    }
  }

  async function handleEditSubmit(event, customerId) {
    event.preventDefault()
    setEditStatus({ type: '', message: '' })

    try {
      setIsSubmittingEdit(true)
      const payload = {
        customer_id: customerId,
        ...editFormData,
      }

      const response = await editCustomer(payload)
      setEditStatus({ type: 'success', message: response?.message || 'Customer updated.' })

      // Update local state without full refetch if possible
      setCustomers((prev) =>
        prev.map(c => c.customer_id === customerId
          ? { ...c, first_name: editFormData.first_name, last_name: editFormData.last_name, email: editFormData.email }
          : c)
      )

      setCustomerDetailsById((prev) => ({
        ...prev,
        [customerId]: {
          ...prev[customerId],
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          email: editFormData.email
        }
      }))

      setTimeout(() => {
        setEditingCustomerId(null)
      }, 1500)

    } catch (err) {
      setEditStatus({ type: 'error', message: err.message || 'Failed to update customer.' })
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  function resetReturnForm() {
    setReturnRentalId('')
    setReturnStatus({ type: '', message: '' })
  }

  function handleReturnButtonClick(customerId) {
    async function handleDeleteCustomer(customerId) {
      setIsDeletingCustomerId(customerId)
      setError('')
      try {
        await deleteCustomer(customerId)
        setCustomers((prev) => prev.filter((c) => c.customer_id !== customerId))
        setSelectedCustomerId(null)
        setReturningCustomerId(null)
        setCustomerDetailsById((prev) => {
          const updated = { ...prev }
          delete updated[customerId]
          return updated
        })
      } catch (err) {
        setError(err.message || 'Failed to delete customer.')
      } finally {
        setIsDeletingCustomerId(null)
      }
    }
    if (returningCustomerId === customerId) {
      setReturningCustomerId(null)
      resetReturnForm()
      return
    }

    setReturningCustomerId(customerId)
    setSelectedCustomerId(customerId)
    resetReturnForm()
  }
  // return by rental id
  async function handleReturnSubmit(event, customerId) {
    event.preventDefault()
    setReturnStatus({ type: '', message: '' })

    if (!returnRentalId.trim()) {
      setReturnStatus({ type: 'error', message: 'Enter a rental ID.' })
      return
    }

    try {
      setIsSubmittingReturn(true)
      const response = await returnFilm({
        customer_id: String(customerId),
        rental_id: returnRentalId.trim(),
      })

      setReturnStatus({
        type: 'success',
        message: response?.message ?? 'Film returned successfully.',
      })
      setReturnRentalId('')

      // Refresh customer details after return
      try {
        const updatedDetails = await request(`/get_customerdetails?customer_id=${customerId}`)
        setCustomerDetailsById((prev) => ({ ...prev, [customerId]: updatedDetails }))
      } catch {
        // Optionally handle error
      }
    } catch (submitError) {
      setReturnStatus({
        type: 'error',
        message: submitError?.message ?? 'Failed to return film. Verify rental ID and selected customer.',
      })
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  return (
    <section>
      <h2>Customers</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <p>Total customers: {customers.length}</p>
        <ul className="films-search-list">
          {visibleCustomers.map((customer) => {
            const isSelectedCustomer = selectedCustomerId === customer.customer_id
            const isReturningCustomer = returningCustomerId === customer.customer_id

            return (
              <li key={customer.customer_id} className="film-row-item">
                <div className="film-row-header">
                  <button
                    type="button"
                    className="clickable-actor-item film-title-button"
                    onClick={() => handleCustomerClick(customer.customer_id)}
                    aria-expanded={isSelectedCustomer}
                  >
                    <span className="film-main-text">
                      {customer.first_name} {customer.last_name}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="rent-movie-button"
                    onClick={() => handleReturnButtonClick(customer.customer_id)}
                    aria-expanded={isReturningCustomer}
                  >
                    Return
                  </button>
                  <button
                    type="button"
                    className="rent-movie-button"
                    style={{ marginLeft: '8px' }}
                    onClick={() => handleDeleteCustomer(customer.customer_id)}
                    disabled={isDeletingCustomerId === customer.customer_id}
                  >
                    {isDeletingCustomerId === customer.customer_id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>

                <div className={isReturningCustomer ? 'film-rent-dropdown open' : 'film-rent-dropdown'}>
                  <form className="rent-film-form" onSubmit={(event) => handleReturnSubmit(event, customer.customer_id)}>
                    <input
                      type="text"
                      className="rent-input"
                      placeholder="Rental ID"
                      value={returnRentalId}
                      onChange={(event) => setReturnRentalId(event.target.value)}
                    />

                    <div className="rent-action-row">
                      <button type="submit" className="rent-submit-button" disabled={isSubmittingReturn}>
                        {isSubmittingReturn ? 'Returning...' : 'Confirm Return'}
                      </button>
                    </div>

                    {returnStatus.message && isReturningCustomer && (
                      <p className={returnStatus.type === 'success' ? 'rent-status success' : 'rent-status error'}>
                        {returnStatus.message}
                      </p>
                    )}
                  </form>
                </div>

                <div className={isSelectedCustomer ? 'film-detail-dropdown open' : 'film-detail-dropdown'}>
                  {isSelectedCustomer && customerDetailsById[customer.customer_id] ? (
                    customerDetailsById[customer.customer_id].error ? (
                      <p className="film-detail-state">{customerDetailsById[customer.customer_id].error}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {editingCustomerId === customer.customer_id ? (
                          <form className="rent-film-form" onSubmit={(e) => handleEditSubmit(e, customer.customer_id)} style={{ marginTop: 0, border: 'none', background: 'transparent', padding: 0 }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                              <input
                                type="text"
                                className="rent-input"
                                placeholder="First Name"
                                value={editFormData.first_name}
                                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                required
                              />
                              <input
                                type="text"
                                className="rent-input"
                                placeholder="Last Name"
                                value={editFormData.last_name}
                                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                required
                              />
                            </div>
                            <input
                              type="email"
                              className="rent-input"
                              placeholder="Email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              style={{ marginBottom: '10px' }}
                            />
                            <div className="rent-action-row">
                              <button type="submit" className="rent-submit-button" disabled={isSubmittingEdit}>
                                {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button type="button" className="rent-submit-button" onClick={() => setEditingCustomerId(null)} style={{ background: 'var(--bg-lighter)' }}>
                                Cancel
                              </button>
                            </div>

                            {editStatus.message && (
                              <p className={editStatus.type === 'success' ? 'rent-status success' : 'rent-status error'}>
                                {editStatus.message}
                              </p>
                            )}
                          </form>
                        ) : (
                          <>
                            <ul className="film-detail-list">
                              <li className="film-detail-attribute">
                                <span className="film-detail-label">Customer ID:</span>
                                <span className="film-detail-value">{customerDetailsById[customer.customer_id].customer_id}</span>
                              </li>
                              <li className="film-detail-attribute">
                                <span className="film-detail-label">Email:</span>
                                <span className="film-detail-value">{customerDetailsById[customer.customer_id].email}</span>
                              </li>
                              <li className="film-detail-attribute">
                                <span className="film-detail-label">Active:</span>
                                <span className="film-detail-value">{customerDetailsById[customer.customer_id].active ? 'Yes' : 'No'}</span>
                              </li>
                              <li className="film-detail-attribute">
                                <span className="film-detail-label">Active Rentals:</span>
                                <span className="film-detail-value">{customerDetailsById[customer.customer_id].active_rentals || 'None'}</span>
                              </li>
                            </ul>
                            <div style={{ marginTop: '12px' }}>
                              <button
                                type="button"
                                className="rent-movie-button"
                                onClick={() => handleEditClick(customer.customer_id)}
                              >
                                Edit
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="film-detail-state">Loading details...</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {totalPages > 1 && (
          <nav aria-label="Customers pagination">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => changePage(currentPage - 1)}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button type="button" className="page-link" onClick={() => changePage(page)}>
                    {page}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => changePage(currentPage + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </section>
  )
}

export default CustomersPage
