import { useEffect, useRef, useState } from 'react'
import { getFilmDetails, getTopFiveRentedFilms, rentFilm, searchFilms } from '../services/api/filmsApi'

function splitCsvValues(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function normalizeFilms(rawFilms) {
  if (!Array.isArray(rawFilms)) {
    return []
  }

  const normalizedMap = new Map()

  rawFilms.forEach((film) => {
    const existingFilm = normalizedMap.get(film.film_id)
    const categories = splitCsvValues(film.categories ?? film.category)
    const actors = splitCsvValues(film.actors)

    if (!existingFilm) {
      normalizedMap.set(film.film_id, {
        ...film,
        categories,
        actors,
        available_copies: Number.isFinite(Number(film.available_copies))
          ? Number(film.available_copies)
          : null,
      })
      return
    }

    const mergedCategories = Array.from(new Set([...existingFilm.categories, ...categories]))
    const mergedActors = Array.from(new Set([...existingFilm.actors, ...actors]))

    normalizedMap.set(film.film_id, {
      ...existingFilm,
      categories: mergedCategories,
      actors: mergedActors,
      available_copies: Number.isFinite(Number(film.available_copies))
        ? Number(film.available_copies)
        : existingFilm.available_copies,
    })
  })

  return Array.from(normalizedMap.values())
}

function getMatchContext(film, searchValue, searchFilters) {
  const term = searchValue.trim().toLowerCase()
  if (!term) {
    return []
  }

  const contexts = []

  if (searchFilters.title && film.title?.toLowerCase().includes(term)) {
    contexts.push(`Title: ${film.title}`)
  }

  if (searchFilters.actor) {
    const matchingActor = film.actors.find((actorName) => actorName.toLowerCase().includes(term))
    if (matchingActor) {
      contexts.push(`Actor: ${matchingActor}`)
    }
  }

  if (searchFilters.genre) {
    const matchingGenre = film.categories.find((categoryName) => categoryName.toLowerCase().includes(term))
    if (matchingGenre) {
      contexts.push(`Genre: ${matchingGenre}`)
    }
  }

  return contexts
}

function getPrimaryMatchLabel(film, searchValue, searchFilters) {
  const contexts = getMatchContext(film, searchValue, searchFilters)
  if (contexts.length === 0) {
    return 'No match context'
  }

  const actorContext = contexts.find((context) => context.startsWith('Actor:'))
  if (actorContext) {
    return actorContext.replace('Actor:', 'Actors:').trimStart()
  }

  const genreContext = contexts.find((context) => context.startsWith('Genre:'))
  if (genreContext) {
    return genreContext
  }

  const titleContext = contexts.find((context) => context.startsWith('Title:'))
  if (titleContext) {
    return titleContext
  }

  return contexts[0]
}

function filterFilmsBySelection(films, searchValue, searchFilters) {
  const term = searchValue.trim().toLowerCase()
  if (!term) {
    return films
  }

  return films.filter((film) => getMatchContext(film, term, searchFilters).length > 0)
}

function FilmsPage() {
  const [films, setFilms] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilmId, setSelectedFilmId] = useState(null)
  const [filmDetailsById, setFilmDetailsById] = useState({})
  const [rentingFilmId, setRentingFilmId] = useState(null)
  const [rentMode, setRentMode] = useState('id')
  const [rentCustomerId, setRentCustomerId] = useState('')
  const [rentFirstName, setRentFirstName] = useState('')
  const [rentLastName, setRentLastName] = useState('')
  const [rentStatus, setRentStatus] = useState({
    type: '',
    message: '',
  })
  const [isSubmittingRent, setIsSubmittingRent] = useState(false)
  const rentSwitchTimeoutRef = useRef(null)
  const [searchFilters, setSearchFilters] = useState({
    title: true,
    actor: true,
    genre: true,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDefaultFilms() {
      try {
        const data = await getTopFiveRentedFilms()
        setFilms(normalizeFilms(data))
      } catch {
        setError('Unable to load films.')
      }
    }

    loadDefaultFilms()

    return () => {
      if (rentSwitchTimeoutRef.current) {
        clearTimeout(rentSwitchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearch = async (event) => {
    event.preventDefault()

    if (!searchTerm.trim()) {
      return
    }

    const hasSearchFilterSelected = Object.values(searchFilters).some(Boolean)
    if (!hasSearchFilterSelected) {
      setError('Select at least one search filter: title, actor, or genre.')
      return
    }

    try {
      setError('')
      const data = await searchFilms(searchTerm)
      const normalizedFilms = normalizeFilms(data)
      const filteredFilms = filterFilmsBySelection(normalizedFilms, searchTerm, searchFilters)
      setFilms(filteredFilms)
      setSelectedFilmId(null)
      setRentingFilmId(null)
      setRentStatus({ type: '', message: '' })
    } catch {
      setError('Unable to search films.')
    }
  }

  async function handleFilmClick(filmId) {
    const isSameFilm = selectedFilmId === filmId
    setSelectedFilmId(isSameFilm ? null : filmId)

    if (isSameFilm) {
      return
    }

    const existingDetail = filmDetailsById[filmId]
    if (existingDetail && existingDetail.status !== 'error') {
      return
    }

    setFilmDetailsById((prevDetails) => ({
      ...prevDetails,
      [filmId]: {
        status: 'loading',
        data: null,
      },
    }))

    try {
      const details = await getFilmDetails(filmId)
      const detailData = Array.isArray(details) ? details[0] : details

      setFilmDetailsById((prevDetails) => ({
        ...prevDetails,
        [filmId]: {
          status: detailData ? 'success' : 'error',
          data: detailData ?? null,
        },
      }))
    } catch {
      setFilmDetailsById((prevDetails) => ({
        ...prevDetails,
        [filmId]: {
          status: 'error',
          data: null,
        },
      }))
    }
  }

  function getFilmDetailData(filmId) {
    const filmDetailRecord = filmDetailsById[filmId]
    const filmDetail = filmDetailRecord?.data

    return {
      status: filmDetailRecord?.status ?? 'idle',
      attributes: filmDetail
        ? [
            { label: 'Rating', value: filmDetail.rating ?? 'N/A' },
            { label: 'Release Year', value: filmDetail.release_year ?? 'N/A' },
            { label: 'Length', value: `${filmDetail.length ?? 'N/A'} min` },
            { label: 'Description', value: filmDetail.description ?? 'N/A' },
            { label: 'Language', value: filmDetail.language ?? 'N/A' },
            { label: 'Rental Duration', value: `${filmDetail.rental_duration ?? 'N/A'} days` },
            { label: 'Rental Rate', value: `$${filmDetail.rental_rate ?? 'N/A'}` },
            { label: 'Replacement Cost', value: `$${filmDetail.replacement_cost ?? 'N/A'}` },
          ]
        : [],
    }
  }

  function handleFilterChange(filterKey) {
    setSearchFilters((prevFilters) => ({
      ...prevFilters,
      [filterKey]: !prevFilters[filterKey],
    }))
  }

  function resetRentForm() {
    setRentMode('id')
    setRentCustomerId('')
    setRentFirstName('')
    setRentLastName('')
    setRentStatus({ type: '', message: '' })
  }

  function handleRentButtonClick(filmId) {
    if (rentSwitchTimeoutRef.current) {
      clearTimeout(rentSwitchTimeoutRef.current)
      rentSwitchTimeoutRef.current = null
    }

    if (rentingFilmId === filmId) {
      setRentingFilmId(null)
      resetRentForm()
      return
    }

    if (rentingFilmId !== null && rentingFilmId !== filmId) {
      setRentingFilmId(null)
      resetRentForm()
      rentSwitchTimeoutRef.current = setTimeout(() => {
        setRentingFilmId(filmId)
        resetRentForm()
      }, 220)
      return
    }

    setRentingFilmId(filmId)
    resetRentForm()
  }

  async function handleRentSubmit(event, filmId) {
    event.preventDefault()
    setRentStatus({ type: '', message: '' })

    const payload = {
      film_id: filmId,
      rental_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }

    if (rentMode === 'id') {
      if (!rentCustomerId.trim()) {
        setRentStatus({ type: 'error', message: 'Enter a customer ID.' })
        return
      }
      payload.customer_id = rentCustomerId.trim()
    } else {
      if (!rentFirstName.trim() || !rentLastName.trim()) {
        setRentStatus({ type: 'error', message: 'Enter both first and last name.' })
        return
      }
      payload.first_name = rentFirstName.trim()
      payload.last_name = rentLastName.trim()
    }

    try {
      setIsSubmittingRent(true)
      const response = await rentFilm(payload)
      setRentStatus({
        type: 'success',
        message: response?.message ?? 'Successfully rented.',
      })

      // Update only the availability number for the rented film
      setFilms((prevFilms) =>
        prevFilms.map((film) =>
          film.film_id === filmId
            ? { ...film, available_copies: (film.available_copies || 0) - 1 }
            : film
        )
      );
    } catch (error) {
      setRentStatus({
        type: 'error',
        message: error?.message ?? 'Failed to rent film. Verify customer info and availability.',
      })
    } finally {
      setIsSubmittingRent(false)
    }
  }

  return (
    <section>
      <h2>Films</h2>
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSearch} className="search-form">
        {/* <label htmlFor="film-search">Search films</label> */}
        <input
          id="film-search"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Film title, actor, or genre"
        />
        <button type="submit">Search</button>
      </form>

      <div className="search-filter-row" role="group" aria-label="Search filters">
        <label className="search-filter-option">
          <input
            type="checkbox"
            checked={searchFilters.title}
            onChange={() => handleFilterChange('title')}
          />
          Title
        </label>
        <label className="search-filter-option">
          <input
            type="checkbox"
            checked={searchFilters.actor}
            onChange={() => handleFilterChange('actor')}
          />
          Actor
        </label>
        <label className="search-filter-option">
          <input
            type="checkbox"
            checked={searchFilters.genre}
            onChange={() => handleFilterChange('genre')}
          />
          Genre
        </label>
      </div>

      <div className="card">
        <ul className="films-search-list">
          {films.map((film) => {
            const isSelectedFilm = selectedFilmId === film.film_id
            const detailData = getFilmDetailData(film.film_id)
            const hoverText = getPrimaryMatchLabel(film, searchTerm, searchFilters)

            return (
              <li key={film.film_id} className="film-row-item">
                <div className="film-row-header">
                  <button
                    type="button"
                    className="clickable-film-item film-title-button"
                    onClick={() => handleFilmClick(film.film_id)}
                    aria-expanded={isSelectedFilm}
                    title={hoverText}
                    data-match={hoverText}
                  >
                    <span className="film-main-text">{film.title}</span>
                  </button>

                  <span className={film.available_copies === 0 ? 'availability-badge unavailable' : 'availability-badge'}>
                    {film.available_copies === 0
                      ? 'Not available'
                      : `Availability: ${film.available_copies ?? '--'}`}
                  </span>

                  <button
                    type="button"
                    className="rent-movie-button"
                    onClick={() => handleRentButtonClick(film.film_id)}
                    aria-expanded={rentingFilmId === film.film_id}
                  >
                    Rent
                  </button>
                </div>

                <div className={rentingFilmId === film.film_id ? 'film-rent-dropdown open' : 'film-rent-dropdown'}>
                  <form className="rent-film-form" onSubmit={(event) => handleRentSubmit(event, film.film_id)}>
                    <div className="rent-mode-row" role="radiogroup" aria-label="Rent customer lookup mode">
                      <label>
                        <input
                          type="radio"
                          name={`rent-mode-${film.film_id}`}
                          value="id"
                          checked={rentMode === 'id'}
                          onChange={() => setRentMode('id')}
                        />
                        Customer ID
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`rent-mode-${film.film_id}`}
                          value="name"
                          checked={rentMode === 'name'}
                          onChange={() => setRentMode('name')}
                        />
                        First + Last Name
                      </label>
                    </div>

                    {rentMode === 'id' ? (
                      <input
                        type="text"
                        className="rent-input"
                        placeholder="Customer ID"
                        value={rentCustomerId}
                        onChange={(event) => setRentCustomerId(event.target.value)}
                      />
                    ) : (
                      <div className="rent-name-row">
                        <input
                          type="text"
                          className="rent-input"
                          placeholder="First name"
                          value={rentFirstName}
                          onChange={(event) => setRentFirstName(event.target.value)}
                        />
                        <input
                          type="text"
                          className="rent-input"
                          placeholder="Last name"
                          value={rentLastName}
                          onChange={(event) => setRentLastName(event.target.value)}
                        />
                      </div>
                    )}

                    <div className="rent-action-row">
                      <button type="submit" className="rent-submit-button" disabled={isSubmittingRent}>
                        {isSubmittingRent ? 'Renting...' : 'Confirm Rent'}
                      </button>
                    </div>

                    {rentStatus.message && (
                      <p className={rentStatus.type === 'success' ? 'rent-status success' : 'rent-status error'}>
                        {rentStatus.message}
                      </p>
                    )}
                  </form>
                </div>

                <div className={isSelectedFilm ? 'film-detail-dropdown open' : 'film-detail-dropdown'}>
                  {detailData.status === 'loading' && <p className="film-detail-state">Loading details...</p>}
                  {detailData.status === 'error' && <p className="film-detail-state">Details unavailable</p>}
                  {detailData.status === 'success' && (
                    <ul className="film-detail-list">
                      {detailData.attributes.map((attribute) => (
                        <li key={attribute.label} className="film-detail-attribute">
                          <span className="film-detail-label">{attribute.label}:</span>
                          <span className="film-detail-value">{attribute.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default FilmsPage
