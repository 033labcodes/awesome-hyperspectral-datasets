window.HELP_IMPROVE_VIDEOJS = false;


$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
			slidesToScroll: 1,
			slidesToShow: 1,
			loop: true,
			infinite: true,
			autoplay: true,
			autoplaySpeed: 5000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();

	// Initialize the table
	initializeTable();

})

function initializeTable() {
	loadTableData();
	setupSorting();
}
function loadTableData() {
	fetch('./datasets.yaml')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.text();
		})
		.then(yamlText => {
			try {
				const datasets = jsyaml.load(yamlText);
				renderTable(datasets);
			} catch (parseError) {
				console.error('YAML parsing error:', parseError);
				const datasets = parseYAMLSimple(yamlText);
				renderTable(datasets);
			}
		})
		.catch(error => {
			console.error('Error loading YAML file:', error);
			document.getElementById('datasets-tbody').innerHTML = 
				'<tr><td colspan="8" class="has-text-centered">Error loading YAML file</td></tr>';
		});
}

function parseYAML(yamlText) {
	const datasets = [];
	const lines = yamlText.split('\n')
	let currentDataset = {};

	for (let line of lines) {
		line = line.trim();

		if (line.startsWith('- ')) {
			if (Object.keys(currentDataset).length > 0) {
				datasets.push(currentDataset);
			}
			currentDataset = {};
			line = line.slice(2).trim();
		} else if (line.includes(':')) {
			const [key, value] = line.split(':',2);
			const cleanKey = key.trim();
			const cleanValue = value.trim().replace(/^['"]|['"]$/g, '');

			if (cleanValue !== 'nan' && cleanValue !== '-') {
				currentDataset[cleanKey] = cleanValue;
			}
		}
	}

	if (Object.keys(currentDataset).length > 0) {
		datasets.push(currentDataset);
	}

	return datasets;
}


function renderTable(datasets) {
    const tbody = document.getElementById('datasets-tbody');
    tbody.innerHTML = '';
    
    datasets.forEach(dataset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dataset.dataset ? `<a href="${dataset.url}" target="_blank" title="${dataset.dataset}">${dataset.dataset}</a>` : '-'}</td>
            <td>${dataset.year || '-'}</td>
            <td>${dataset.task || '-'}</td>
            <td>${dataset.images || '-'}</td>
            <td>${dataset.size || '-'}</td>
            <td>${dataset.bands || '-'}</td>
            <td>${dataset.wavelength || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function setupSorting() {
    const headers = document.querySelectorAll('.sortable');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;
            const currentOrder = header.classList.contains('asc') ? 'asc' : 
                               header.classList.contains('desc') ? 'desc' : 'none';
            
            headers.forEach(h => {
                h.classList.remove('asc', 'desc');
            });
            
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            header.classList.add(newOrder);
            
            sortTable(sortKey, newOrder);
        });
    });
}

function sortTable(sortKey, order) {
    const tbody = document.getElementById('datasets-tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = getColumnIndex(sortKey);
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return order === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        if (order === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

function getColumnIndex(sortKey) {
    const columnMap = {
        'dataset': 0,
        'year': 1,
        'task': 2,
        'images': 3,
        'size': 4,
        'bands': 5,
        'wavelength': 6
    };
    return columnMap[sortKey] || 0;
}