import { useEffect, useState } from 'react'
import { getAllCustomers, searchCustomers, returnFilm, deleteCustomer, editCustomer, addCustomer } from '../services/api/customersApi'
import { request } from '../services/api/httpClient'

function getCustomerMatchContext(customer, searchValue, searchFilters) {
  const term = searchValue.trim().toLowerCase()
  if (!term) {
    return []
  }

  const contexts = []
  const customerId = String(customer.customer_id ?? '')

  if (searchFilters.customerId && customerId.toLowerCase().includes(term)) {
    contexts.push(`Customer ID: ${customerId}`)
  }

  if (searchFilters.firstName && customer.first_name?.toLowerCase().includes(term)) {
    contexts.push(`First Name: ${customer.first_name}`)
  }

  if (searchFilters.lastName && customer.last_name?.toLowerCase().includes(term)) {
    contexts.push(`Last Name: ${customer.last_name}`)
  }

  return contexts
}

function filterCustomersBySelection(customers, searchValue, searchFilters) {
  const term = searchValue.trim().toLowerCase()
  if (!term) {
    return customers
  }

  return customers.filter((customer) => getCustomerMatchContext(customer, term, searchFilters).length > 0)
}

function normalizeCustomerRecord(customer) {
  const firstName = customer.first_name ?? customer.firstName ?? ''
  const lastName = customer.last_name ?? customer.lastName ?? ''

  if (firstName || lastName) {
    return {
      ...customer,
      first_name: firstName,
      last_name: lastName,
    }
  }

  const fullName = typeof customer.name === 'string' ? customer.name.trim() : ''
  if (!fullName) {
    return customer
  }

  const [fallbackFirstName, ...rest] = fullName.split(' ')
  const fallbackLastName = rest.join(' ')

  return {
    ...customer,
    first_name: fallbackFirstName ?? '',
    last_name: fallbackLastName ?? '',
  }
}

function normalizeCustomerList(customers) {
  if (!Array.isArray(customers)) {
    return []
  }

  return customers.map(normalizeCustomerRecord)
}

function CustomersPage() {
  const [isDeletingCustomerId, setIsDeletingCustomerId] = useState(null)
  const [deleteErrorCustomerId, setDeleteErrorCustomerId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
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
  const [searchTerm, setSearchTerm] = useState('')
  const [searchFilters, setSearchFilters] = useState({
    customerId: true,
    firstName: true,
    lastName: true,
  })
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  const [addStatus, setAddStatus] = useState({ type: '', message: '' })
  const [addFormData, setAddFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address_id: '',
  })
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
        setCustomers(normalizeCustomerList(data))
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

  function handleFilterChange(filterKey) {
    setSearchFilters((prevFilters) => ({
      ...prevFilters,
      [filterKey]: !prevFilters[filterKey],
    }))
  }

  async function handleSearch(event) {
    event.preventDefault()

    if (!searchTerm.trim()) {
      try {
        setError('')
        const allCustomers = await getAllCustomers()
        setCustomers(normalizeCustomerList(allCustomers))
        setCurrentPage(1)
      } catch {
        setError('Unable to load customers.')
      }
      return
    }

    const hasSearchFilterSelected = Object.values(searchFilters).some(Boolean)
    if (!hasSearchFilterSelected) {
      setError('Select at least one search filter: customer ID, first name, or last name.')
      return
    }

    try {
      setError('')
      const data = await searchCustomers(searchTerm)
      const normalizedCustomers = normalizeCustomerList(data)
      const filteredCustomers = filterCustomersBySelection(normalizedCustomers, searchTerm, searchFilters)
      setCustomers(filteredCustomers)
      setCurrentPage(1)
      setSelectedCustomerId(null)
      setReturningCustomerId(null)
    } catch {
      setError('Unable to search customers.')
    }
  }

  function handleAddCustomerToggle() {
    setIsAddCustomerOpen((prev) => !prev)
    setAddStatus({ type: '', message: '' })
  }

  function handleAddFormChange(field, value) {
    setAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleAddCustomerSubmit(event) {
    event.preventDefault()
    setAddStatus({ type: '', message: '' })

    const payload = {
      store_id: 1,
      first_name: addFormData.first_name.trim(),
      last_name: addFormData.last_name.trim(),
      email: addFormData.email.trim(),
      address_id: Number(addFormData.address_id),
    }

    if (!payload.first_name || !payload.last_name || !payload.email || !payload.address_id) {
      setAddStatus({ type: 'error', message: 'Fill in all required customer fields.' })
      return
    }

    try {
      setIsSubmittingAdd(true)
      const response = await addCustomer(payload)
      setAddStatus({ type: 'success', message: response?.message || 'Customer added.' })

      const refreshedCustomers = await getAllCustomers()
      setCustomers(normalizeCustomerList(refreshedCustomers))
      setCurrentPage(1)
      setSearchTerm('')
      setSelectedCustomerId(null)
      setReturningCustomerId(null)

      setAddFormData({
        first_name: '',
        last_name: '',
        email: '',
        address_id: '',
      })
      setIsAddCustomerOpen(false)
    } catch (submitError) {
      setAddStatus({
        type: 'error',
        message: submitError?.message || 'Unable to add customer.',
      })
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  function handleCustomerClick(customerId) {
    const isSameCustomer = selectedCustomerId === customerId
    setSelectedCustomerId(isSameCustomer ? null : customerId)
    setEditingCustomerId(null)

    if (!isSameCustomer && !customerDetailsById[customerId]) {
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

  async function handleDeleteCustomer(customerId) {
    setIsDeletingCustomerId(customerId)
    setDeleteError('')
    setDeleteErrorCustomerId(null)
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
      setDeleteError(err.message || 'Failed to delete customer.')
      setDeleteErrorCustomerId(customerId)
    } finally {
      setIsDeletingCustomerId(null)
    }
  }

  function handleReturnButtonClick(customerId) {
    if (returningCustomerId === customerId) {
      setReturningCustomerId(null)
      resetReturnForm()
      return
    }

    setReturningCustomerId(customerId)
    setSelectedCustomerId(customerId)
    resetReturnForm()
  }
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

      try {
        const updatedDetails = await request(`/get_customerdetails?customer_id=${customerId}`)
        setCustomerDetailsById((prev) => ({ ...prev, [customerId]: updatedDetails }))
      } catch {}
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

      <div className="customers-toolbar">
        <form onSubmit={handleSearch} className="search-form customer-search-form">
          <input
            id="customer-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Customer ID, first name, or last name"
          />
          <button type="submit">Search</button>
        </form>

        <div className="add-customer-anchor">
          <button
            type="button"
            className="rent-movie-button"
            onClick={handleAddCustomerToggle}
            aria-expanded={isAddCustomerOpen}
          >
            Add Customer
          </button>

          <div className={isAddCustomerOpen ? 'add-customer-panel open' : 'add-customer-panel'} aria-hidden={!isAddCustomerOpen}>
            <div className="add-customer-panel-header">
              <h3>Add Customer</h3>
              <button type="button" className="add-customer-close" onClick={handleAddCustomerToggle} aria-label="Close add customer form">
                ×
              </button>
            </div>

            <form className="rent-film-form add-customer-form" onSubmit={handleAddCustomerSubmit}>
              <input
                type="number"
                className="rent-input"
                placeholder="Address ID"
                value={addFormData.address_id}
                onChange={(event) => handleAddFormChange('address_id', event.target.value)}
                min="1"
                required
              />

              <div className="add-customer-name-row">
                <input
                  type="text"
                  className="rent-input"
                  placeholder="First Name"
                  value={addFormData.first_name}
                  onChange={(event) => handleAddFormChange('first_name', event.target.value)}
                  required
                />
                <input
                  type="text"
                  className="rent-input"
                  placeholder="Last Name"
                  value={addFormData.last_name}
                  onChange={(event) => handleAddFormChange('last_name', event.target.value)}
                  required
                />
              </div>

              <input
                type="email"
                className="rent-input"
                placeholder="Email"
                value={addFormData.email}
                onChange={(event) => handleAddFormChange('email', event.target.value)}
                required
              />

              <div className="rent-action-row">
                <button type="submit" className="rent-submit-button" disabled={isSubmittingAdd}>
                  {isSubmittingAdd ? 'Adding...' : 'Confirm Add'}
                </button>
              </div>

              {addStatus.message && (
                <p className={addStatus.type === 'success' ? 'rent-status success' : 'rent-status error'}>
                  {addStatus.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="search-filter-row" role="group" aria-label="Customer search filters">
        <label className="search-filter-option">
          <input
            type="checkbox"
            checked={searchFilters.customerId}
            onChange={() => handleFilterChange('customerId')}
          />
          Customer ID
        </label>
        <label className="search-filter-option">
          <input
            type="checkbox"
            checked={searchFilters.firstName}
            onChange={() => handleFilterChange('firstName')}
          />
          First Name
        </label>
        <label className="search-filter-option">
          <input
            type="checkbox"
            checked={searchFilters.lastName}
            onChange={() => handleFilterChange('lastName')}
          />
          Last Name
        </label>
      </div>

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

                            <div style={{ marginTop: '16px' }}>
                              <h4 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.95rem', fontWeight: '600' }}>Rental History</h4>
                              {customerDetailsById[customer.customer_id].past_rentals ? (
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>{customerDetailsById[customer.customer_id].past_rentals}</p>
                              ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>None</p>
                              )}
                            </div>

                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="rent-movie-button"
                                onClick={() => handleEditClick(customer.customer_id)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="rent-movie-button"
                                onClick={() => handleDeleteCustomer(customer.customer_id)}
                                disabled={isDeletingCustomerId === customer.customer_id}
                              >
                                {isDeletingCustomerId === customer.customer_id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                            {deleteErrorCustomerId === customer.customer_id && deleteError && (
                              <p className="error-text" style={{ marginTop: '12px', marginBottom: 0 }}>{deleteError}</p>
                            )}
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
          <nav aria-label="Customers pagination" style={{ marginTop: '24px' }}>
            <ul className="pagination justify-content-center" style={{ gap: '6px' }}>
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  type="button"
                  className="rent-movie-button"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button 
                    type="button" 
                    className={`rent-movie-button ${currentPage === page ? 'active' : ''}`}
                    onClick={() => changePage(page)}
                    style={currentPage === page ? { opacity: '0.7' } : {}}
                  >
                    {page}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  type="button"
                  className="rent-movie-button"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
