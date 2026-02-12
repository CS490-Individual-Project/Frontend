import { useEffect, useState } from 'react'
import { getTopFiveRentedFilms, searchFilms } from '../services/api/filmsApi'

function FilmsPage() {
  const [films, setFilms] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDefaultFilms() {
      try {
        const data = await getTopFiveRentedFilms()
        setFilms(data)
      } catch {
        setError('Unable to load films.')
      }
    }

    loadDefaultFilms()
  }, [])

  const handleSearch = async (event) => {
    event.preventDefault()

    if (!searchTerm.trim()) {
      return
    }

    try {
      setError('')
      const data = await searchFilms(searchTerm)
      setFilms(data)
    } catch {
      setError('Unable to search films.')
    }
  }

  return (
    <section>
      <h2>Films</h2>
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSearch} className="search-form">
        <label htmlFor="film-search">Search films</label>
        <input
          id="film-search"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Film title, actor, or genre"
        />
        <button type="submit">Search</button>
      </form>

      <div className="card">
        <ul>
          {films.map((film) => (
            <li key={film.film_id}>{film.title}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default FilmsPage
