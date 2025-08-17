// This script handles all the logic for the entire multi-page application.
// We use `window.location.pathname` to determine which page is currently loaded.

document.addEventListener('DOMContentLoaded', () => {
    // Determine the current page based on the filename in the URL
    const pageName = window.location.pathname.split('/').pop();

    // Call the appropriate setup function for the current page
    switch (pageName) {
        case 'login.html':
        case '': // Handle the case where the URL is just the base domain
            setupLoginPage();
            break;
        case 'seller.html':
            setupSellerPage();
            break;
        case 'buyer.html':
            setupBuyerPage();
            break;
        case 'owner.html':
            setupOwnerPage();
            break;
        default:
            // Optional: Handle unknown pages
            console.error('Unknown page loaded.');
    }
});

// --- Common Functions for all Pages ---
function getMaterials() {
    const materials = localStorage.getItem('listedMaterials');
    return materials ? JSON.parse(materials) : [];
}

function saveMaterials(materials) {
    localStorage.setItem('listedMaterials', JSON.stringify(materials));
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// --- Login Page Logic (login.html) ---
function setupLoginPage() {
    const users = {
        'seller': { password: 'seller123', role: 'seller' },
        'buyer': { password: 'buyer123', role: 'buyer' },
        'owner': { password: 'owner123', role: 'owner' }
    };

    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const messageBox = document.getElementById('message-box');

    function handleLogin() {
        const username = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();

        messageBox.classList.add('hidden');
        messageBox.textContent = '';

        if (users[username] && users[username].password === password) {
            const userRole = users[username].role;
            localStorage.setItem('currentUser', JSON.stringify({ username, role: userRole }));
            
            messageBox.classList.remove('bg-red-200', 'text-red-700');
            messageBox.classList.add('bg-green-200', 'text-green-700');
            messageBox.textContent = 'Login successful! Redirecting...';
            messageBox.classList.remove('hidden');

            setTimeout(() => {
                let targetPage = '';
                switch (userRole) {
                    case 'seller':
                        targetPage = 'seller.html';
                        break;
                    case 'buyer':
                        targetPage = 'buyer.html';
                        break;
                    case 'owner':
                        targetPage = 'owner.html';
                        break;
                }
                window.location.href = targetPage;
            }, 1000);
            
        } else {
            messageBox.classList.remove('bg-green-200', 'text-green-700');
            messageBox.classList.add('bg-red-200', 'text-red-700');
            messageBox.textContent = 'Invalid username or password.';
            messageBox.classList.remove('hidden');
        }
    }

    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });
}

// --- Seller Page Logic (seller.html) ---
function setupSellerPage() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'seller') {
        window.location.href = 'login.html';
        return;
    }

    const materialInput = document.getElementById('material-input');
    const priceInput = document.getElementById('price-input');
    const listMaterialButton = document.getElementById('list-material-button');
    const sellerMaterialsList = document.getElementById('seller-materials-list');
    const logoutButton = document.getElementById('logout-button-seller');
    const messageBox = document.getElementById('seller-message-box');

    function renderMaterialsList() {
        const materials = getMaterials();
        sellerMaterialsList.innerHTML = '';
        const userMaterials = materials.filter(m => m.listedBy === currentUser.username);

        if (userMaterials.length === 0) {
             sellerMaterialsList.innerHTML = '<li class="text-gray-500 text-center">No materials listed yet.</li>';
             return;
        }

        userMaterials.forEach(material => {
            const priceDisplay = material.price ? `$${material.price.toFixed(2)}` : 'Price not set';
            const statusDisplay = material.status === 'Available' ? `Price: ${priceDisplay}` : `Status: ${material.status}`;
            
            const sellerItem = document.createElement('li');
            sellerItem.className = 'p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex justify-between items-center';
            sellerItem.innerHTML = `
                <div>
                    <span class="font-semibold">${material.name}</span>
                    <span class="block text-xs text-gray-500 mt-1">${statusDisplay}</span>
                </div>
            `;
            sellerMaterialsList.appendChild(sellerItem);
        });
    }

    function handleListMaterial() {
        const materialName = materialInput.value.trim();
        const materialPrice = parseFloat(priceInput.value);

        messageBox.classList.add('hidden');
        messageBox.textContent = '';

        if (materialName && !isNaN(materialPrice)) {
            const materials = getMaterials();
            materials.push({
                id: Date.now(),
                name: materialName,
                price: materialPrice,
                listedBy: currentUser.username,
                status: 'Available'
            });
            saveMaterials(materials);
            materialInput.value = '';
            priceInput.value = '';
            renderMaterialsList();
            
            messageBox.classList.remove('bg-red-200', 'text-red-700');
            messageBox.classList.add('bg-green-200', 'text-green-700');
            messageBox.textContent = 'Material successfully listed!';
            messageBox.classList.remove('hidden');
            setTimeout(() => messageBox.classList.add('hidden'), 3000);

        } else {
            messageBox.classList.remove('bg-green-200', 'text-green-700');
            messageBox.classList.add('bg-red-200', 'text-red-700');
            messageBox.textContent = 'Please enter a valid material name and a numeric price.';
            messageBox.classList.remove('hidden');
        }
    }

    renderMaterialsList();
    listMaterialButton.addEventListener('click', handleListMaterial);
    logoutButton.addEventListener('click', handleLogout);
    priceInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleListMaterial();
        }
    });
}

// --- Buyer Page Logic (buyer.html) ---
function setupBuyerPage() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'buyer') {
        window.location.href = 'login.html';
        return;
    }

    const buyerMaterialsList = document.getElementById('buyer-materials-list');
    const logoutButton = document.getElementById('logout-button-buyer');

    function renderMaterialsList() {
        const materials = getMaterials();
        buyerMaterialsList.innerHTML = '';
        
        if (materials.length === 0) {
             buyerMaterialsList.innerHTML = '<li class="text-gray-500 text-center">No materials listed yet.</li>';
             return;
        }

        materials.forEach(material => {
            const priceDisplay = material.price ? `$${material.price.toFixed(2)}` : 'Price not set';
            
            const buyerItem = document.createElement('li');
            buyerItem.className = 'p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex justify-between items-center';
            
            if (material.status === 'Available') {
                buyerItem.innerHTML = `
                    <div>
                        <span class="font-semibold">${material.name}</span> 
                        <span class="block text-xs text-gray-500 mt-1">Price: ${priceDisplay}</span>
                    </div>
                    <button class="buy-button bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200" data-id="${material.id}">Buy</button>
                `;
                buyerItem.querySelector('.buy-button').addEventListener('click', () => handleBuyMaterial(material.id));
            } else {
                buyerItem.innerHTML = `
                    <div>
                        <span class="font-semibold">${material.name}</span>
                        <span class="block text-xs text-gray-500 mt-1">Status: ${material.status}</span>
                    </div>
                    <span class="text-sm font-semibold text-gray-500">Sold</span>
                `;
            }
            buyerMaterialsList.appendChild(buyerItem);
        });
    }

    function handleBuyMaterial(materialId) {
        const materials = getMaterials();
        const materialToBuy = materials.find(m => m.id === materialId);
        if (materialToBuy) {
            materialToBuy.status = 'Sold';
            saveMaterials(materials);
            renderMaterialsList();
        }
    }

    renderMaterialsList();
    logoutButton.addEventListener('click', handleLogout);
}

// --- Owner Page Logic (owner.html) ---
function setupOwnerPage() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'owner') {
        window.location.href = 'login.html';
        return;
    }

    const ownerMaterialsList = document.getElementById('owner-materials-list');
    const logoutButton = document.getElementById('logout-button-owner');

    function renderMaterialsList() {
        const materials = getMaterials();
        ownerMaterialsList.innerHTML = '';
        
        if (materials.length === 0) {
             ownerMaterialsList.innerHTML = '<li class="text-gray-500 text-center">No materials listed yet.</li>';
             return;
        }

        materials.forEach(material => {
            const priceDisplay = material.price ? `$${material.price.toFixed(2)}` : 'Price not set';
            
            const ownerItem = document.createElement('li');
            ownerItem.className = 'p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex justify-between items-center';
            
            let statusText = `Status: ${material.status}`;
            if (material.status === 'Available') {
                statusText = `Price: ${priceDisplay}`;
            }
            
            ownerItem.innerHTML = `
                <div>
                    <span class="font-semibold">${material.name}</span>
                    <span class="block text-xs text-gray-500 mt-1">Listed By: ${material.listedBy}</span>
                    <span class="block text-xs text-gray-500 mt-1">${statusText}</span>
                </div>
            `;
            ownerMaterialsList.appendChild(ownerItem);
        });
    }

    renderMaterialsList();
    logoutButton.addEventListener('click', handleLogout);
}
