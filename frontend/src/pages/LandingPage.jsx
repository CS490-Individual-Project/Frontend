import { useEffect, useState } from 'react'
import { getFilmDetails, getTopFiveActors, getTopFiveRentedFilms } from '../services/api/filmsApi'

function LandingPage() {
  const [topFilms, setTopFilms] = useState([])
  const [topActors, setTopActors] = useState([])
  const [filmDetailsById, setFilmDetailsById] = useState({})
  const [selectedFilmId, setSelectedFilmId] = useState(null)
  const [showTopFilms, setShowTopFilms] = useState(false)
  const [isClosingTopFilms, setIsClosingTopFilms] = useState(false)
  const [showTopActors, setShowTopActors] = useState(false)
  const [isClosingTopActors, setIsClosingTopActors] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [films, actors] = await Promise.all([
          getTopFiveRentedFilms(),
          getTopFiveActors(),
        ])
        setTopFilms(films)
        setTopActors(actors)
      } catch {
        setError('Unable to load landing page data.')
      }
    }

    loadData()
  }, [])

  function handleTopFilmsToggle() {
    if (showTopFilms) {
      setIsClosingTopFilms(true)
      return
    }

    setShowTopFilms(true)
    setIsClosingTopFilms(false)
  }

  function handleTopFilmsAnimationEnd() {
    if (isClosingTopFilms) {
      setShowTopFilms(false)
      setIsClosingTopFilms(false)
    }
  }

  function handleTopActorsToggle() {
    if (showTopActors) {
      setIsClosingTopActors(true)
      return
    }

    setShowTopActors(true)
    setIsClosingTopActors(false)
  }

  function handleTopActorsAnimationEnd() {
    if (isClosingTopActors) {
      setShowTopActors(false)
      setIsClosingTopActors(false)
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

  return (
    <section className="landing-page">
      {error && <p className="error-text">{error}</p>}

      <div className="container-fluid px-3">
        <div className="row g-4">
          <div className="col-6">
          <div className="card top-films-card">
            <button
              type="button"
              className="top-list-button"
              onClick={handleTopFilmsToggle}
              aria-expanded={showTopFilms && !isClosingTopFilms}
            >
              Top 5 Rented Films
            </button>
            {showTopFilms && (
              <div
                className={isClosingTopFilms ? 'top-list-dropdown closing' : 'top-list-dropdown'}
                onAnimationEnd={handleTopFilmsAnimationEnd}
              >
                <ul>
                  {topFilms.map((film) => {
                    const isSelectedFilm = selectedFilmId === film.film_id
                    const detailData = getFilmDetailData(film.film_id)

                    return (
                    <li key={film.film_id} className="film-row-item">
                      <button
                        type="button"
                        className="clickable-film-item"
                        onClick={() => handleFilmClick(film.film_id)}
                        aria-expanded={isSelectedFilm}
                      >
                        <span className="film-main-text">
                          {film.title} ({film.rental_count} rentals)
                        </span>
                      </button>

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
            )}
          </div>
          </div>

          <div className="col-6">
          <div className="card top-actors-card">
            <button
              type="button"
              className="top-list-button"
              onClick={handleTopActorsToggle}
              aria-expanded={showTopActors && !isClosingTopActors}
            >
              Top 5 Actors
            </button>
            {showTopActors && (
              <div
                className={isClosingTopActors ? 'top-list-dropdown closing' : 'top-list-dropdown'}
                onAnimationEnd={handleTopActorsAnimationEnd}
              >
                <ul>
                  {topActors.map((actor) => (
                    <li key={actor.actor_id} className="top-actors-item">
                      {actor.name} ({actor.movies} films)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingPage
