import { useEffect, useState } from 'react'
import { getAllCustomers } from '../services/api/customersApi'

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAllCustomers()
        setCustomers(data)
      } catch {
        setError('Unable to load customers.')
      }
    }

    loadCustomers()
  }, [])

  return (
    <section>
      <h2>Customers</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <p>Total customers: {customers.length}</p>
        <ul>
          {customers.slice(0, 25).map((customer) => (
            <li key={customer.customer_id}>
              {customer.first_name} {customer.last_name} ({customer.email})
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default CustomersPage
