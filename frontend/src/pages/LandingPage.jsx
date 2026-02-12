import { useEffect, useState } from 'react'
import { getTopFiveActors, getTopFiveRentedFilms } from '../services/api/filmsApi'

function LandingPage() {
  const [topFilms, setTopFilms] = useState([])
  const [topActors, setTopActors] = useState([])
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

  return (
    <section>
      <h2>Landing / Index</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="grid-two">
        <div className="card">
          <h3>Top 5 Rented Films</h3>
          <ul>
            {topFilms.map((film) => (
              <li key={film.film_id}>
                {film.title} ({film.rental_count} rentals)
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Top 5 Actors</h3>
          <ul>
            {topActors.map((actor) => (
              <li key={actor.actor_id}>
                {actor.name} ({actor.movies} films)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default LandingPage
