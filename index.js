async function loadTop5Rented() {
    try {
        const response = await fetch('http://localhost:5000/api/top5rented');
        const data = await response.json();
        
        let html = '<h2>Top 5 Rented Films</h2><ul>';
        data.forEach(film => {
            html += `<li>${film.title} - Rentals: ${film.rental_count}</li>`;
        });
        html += '</ul>';
        
        document.getElementById('results').innerHTML = html;
    } catch (error) {
        document.getElementById('results').innerHTML = '<p>Error loading data. Make sure the backend server is running.</p>';
        console.error('Error:', error);
    }
}
