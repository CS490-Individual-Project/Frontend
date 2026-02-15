import { useEffect, useState } from 'react'
import { getFilmDetails, getTopFiveActors, getTopFiveRentedFilms } from '../services/api/filmsApi'

function LandingPage() {
  const [topFilms, setTopFilms] = useState([])
  const [topActors, setTopActors] = useState([])
  const [filmDetailsById, setFilmDetailsById] = useState({})
  const [hoveredFilmId, setHoveredFilmId] = useState(null)
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

  async function handleFilmHover(filmId) {
    setHoveredFilmId(filmId)

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

  function getFilmDetailLabel(filmId) {
    const filmDetailRecord = filmDetailsById[filmId]
    const filmDetail = filmDetailRecord?.data

    if (!filmDetailRecord) {
      return ''
    }

    if (filmDetailRecord.status === 'loading') {
      return 'Loading details...'
    }

    if (filmDetailRecord.status === 'error') {
      return 'Details unavailable'
    }

    return `${filmDetail.release_year ?? ''} • ${filmDetail.rating ?? ''} • ${filmDetail.length ?? ''} min`
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
                    const isHoveredFilm = hoveredFilmId === film.film_id
                    const detailLabel = getFilmDetailLabel(film.film_id)

                    return (
                    <li
                      key={film.film_id}
                      className="clickable-film-item"
                      onMouseEnter={() => handleFilmHover(film.film_id)}
                      onMouseLeave={() => setHoveredFilmId(null)}
                      onFocus={() => handleFilmHover(film.film_id)}
                      onBlur={() => setHoveredFilmId(null)}
                    >
                      <span className="film-main-text">
                        {film.title} ({film.rental_count} rentals)
                      </span>
                      <span className={isHoveredFilm ? 'film-inline-details open' : 'film-inline-details'}>
                        {detailLabel}
                      </span>
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
