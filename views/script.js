const token = new URLSearchParams(window.location.search).get('token');
let companies = [];

document.addEventListener('DOMContentLoaded', async () => {
    companies = await getCollectors();

    showCredentials(); 
    document.getElementById('add-credential-button').addEventListener('click', showCompanies);
    document.getElementById('return-to-credentials-button').addEventListener('click', showCredentials);
    document.getElementById('return-to-companies-button').addEventListener('click', showCompanies);
    document.getElementById('add-credential-form').addEventListener('submit', addCredential);
});

async function getCollectors() {
    const response = await fetch(`collectors?locale=${locale}`);
    return await response.json();
}

function buildCredentialFooter(credential) {
    console.log(credential);
    if (credential.state == "ERROR") {
        return `
            <div class="credential-footer credential-error">
                <img src="/views/icons/error.png" alt="Error"/>
                <div>${credential.error}</div>
            </div>
        `;
    }
    else if (credential.state == "PENDING") {
        return `
            <div class="credential-footer credential-warning">
                <img src="/views/icons/pending.png" alt="Pending"/>
            </div>
        `;
    }
    else {
        return `
            <div class="credential-footer credential-success">
                <img src="/views/icons/success.png" alt="Success"/>
            </div>
        `;
    }
}

async function showCredentials() {
    document.getElementById('credentials-container').hidden = false;
    document.getElementById('companies-container').hidden = true;
    document.getElementById('form-container').hidden = true;

    const response = await fetch(`credentials?token=${token}`);
    const credentials = await response.json();

    const credentialsList = document.getElementById('credentials-list');
    credentialsList.innerHTML = '';

    credentials.forEach(credential => {
        const credentialItem = document.createElement('div');
        credentialItem.className = 'credential-item company-item';
        credentialItem.innerHTML = `
            <img src="${credential.collector.logo}" alt="${credential.collector.name}">
            <div>
            <h3>${credential.collector.name}</h3>
            <p>${credential.note}</p>
            </div>
            <button class="button delete-button" onclick="deleteCredential('${credential.credential_id}')">
                <img src="/views/icons/delete.png" alt="Delete"/>
            </button>
            ${buildCredentialFooter(credential)}
        `;
        credentialsList.appendChild(credentialItem);
    });
}

async function showCompanies() {
    document.getElementById('credentials-container').hidden = true;
    document.getElementById('companies-container').hidden = false;
    document.getElementById('form-container').hidden = true;

    const companyList = document.getElementById('companies-list');
    companyList.innerHTML = '';

    companies.forEach(company => {
        const companyItem = document.createElement('li');
        companyItem.className = 'company-item company-item-selectable';
        companyItem.innerHTML = `
            <img src="${company.logo}" alt="${company.name}">
            <div>
                <h3>${company.name}</h3>
                <p>${company.description}</p>
            </div>
        `;
        companyItem.addEventListener('click', () => showForm(company));
        companyList.appendChild(companyItem);
    });
}

function showForm(company) {
    document.getElementById('credentials-container').hidden = true;
    document.getElementById('companies-container').hidden = true;
    document.getElementById('form-container').hidden = false;
    
    // Update the form with the company's information
    document.getElementById('company-logo').src = company.logo;
    document.getElementById('company-name').textContent = company.name;
    document.getElementById('company-description').textContent = company.description;
    document.getElementById('add-credential-form').dataset.key = company.key;

    // Add input fields
    const form = document.getElementById('add-credential-form-params');
    form.innerHTML = ''; // Clear any existing fields

    Object.keys(company.params).forEach(key => {
        // Get the parameter
        const param = company.params[key];

        // Add label
        const label = document.createElement('label');
        label.textContent = param.name;

        if (param.mandatory) {
            const required = document.createElement('span');
            required.textContent = ' *';
            required.style.color = 'red';
            label.appendChild(required);
        }

        // Add input
        const input = document.createElement('input');
        if (key === 'password' || key === 'token') {
            input.setAttribute('type', 'password');
        } else {
            input.setAttribute('type', 'text');
        }
        input.setAttribute('name', key);
        input.placeholder = param.placeholder;
        input.required = param.mandatory;

        form.appendChild(label);
        form.appendChild(input);
    });
}

async function addCredential(event) {
    event.preventDefault();

    // Convert form data to object
    const formData = new FormData(event.target);
    let params = {};
    formData.forEach((value, key) => {
        params[key] = value;
    });

    await fetch(`credential?token=${token}`, {
        method: 'POST',
        body: JSON.stringify({
            key: event.target.dataset.key,
            params
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    document.getElementById('add-credential-form').reset();
    showCredentials();
}

async function deleteCredential(id) {
    await fetch(`credential/${id}?token=${token}`, {
        method: 'DELETE'
    });

    showCredentials();
}
