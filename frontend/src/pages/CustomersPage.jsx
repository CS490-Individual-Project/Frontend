import { useEffect, useState } from 'react'
import { getAllCustomers } from '../services/api/customersApi'

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
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

  return (
    <section>
      <h2>Customers</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <p>Total customers: {customers.length}</p>
        <ul className="films-search-list">
          {visibleCustomers.map((customer) => (
            <li key={customer.customer_id} className="film-row-item">
              <div className="film-row-header">
                <div className="clickable-actor-item film-title-button">
                  <span className="film-main-text">
                    {customer.first_name} {customer.last_name} (id: {customer.customer_id})
                  </span>
                </div>
              </div>
            </li>
          ))}
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
