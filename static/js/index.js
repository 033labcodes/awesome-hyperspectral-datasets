window.HELP_IMPROVE_VIDEOJS = false;


let allDatasets = [];

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
    applyQueryParamToSearch();
	loadTableData();
	setupSorting();
}
function applyQueryParamToSearch() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        const el = document.getElementById('search-input');
        if (el) {
            el.value = q;
        }
    }
}

function loadTableData() {
	fetch('https://033labcodes.github.io/awesome-hyperspectral-datasets/datasets.yaml')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.text();
		})
		.then(yamlText => {
			try {
				const datasets = jsyaml.load(yamlText);
                allDatasets = datasets;
				renderTable(datasets);
				setupSearch();
                const params = new URLSearchParams(window.location.search);
                const q = params.get('q');
                if (q) {
                    const el = document.getElementById('search-input');
                    if (el) {
                        el.value = q;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
                
			} catch (parseError) {
				console.error('YAML parsing error:', parseError);
				const datasets = parseYAMLSimple(yamlText);
                allDatasets = datasets;
				renderTable(datasets);
				setupSearch();
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

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        const searchValue = this.value.toLowerCase().trim();
        filterDatasets(searchValue);
    });
}

function filterDatasets(searchValue) {
    if (!searchValue) {
        renderTable(allDatasets);
        return;
    }
    
    const filteredDatasets = allDatasets.filter(dataset => {
        const searchableFields = [
            dataset.dataset || '',
            dataset.task || '',
            dataset.year || '',
            dataset.images || '',
            dataset.size || '',
            dataset.bands || '',
            dataset.wavelength || '',
        ].map(field => field.toString().toLowerCase().trim());
        
        return searchableFields.some(field => 
            field.includes(searchValue)
        );
    });

    renderTable(filteredDatasets);
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