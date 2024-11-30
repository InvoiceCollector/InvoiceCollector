const token = new URLSearchParams(window.location.search).get('token');

document.addEventListener('DOMContentLoaded', () => {
    loadCredentials(); 
    document.getElementById('add-credential-button').addEventListener('click', showCompanyList);
    document.getElementById('add-credential-form').addEventListener('submit', addCredential);
});

async function loadCredentials() {
    const response = await fetch(`credentials?token=${token}`);
    const credentials = await response.json();

    const credentialsList = document.getElementById('credentials-list');
    credentialsList.innerHTML = '';

    credentials.forEach(credential => {
        const credentialItem = document.createElement('div');
        credentialItem.className = 'credential-item';
        credentialItem.innerHTML = `
            <strong>Username:</strong> ${credential.username}<br>
            <strong>Password:</strong> ${credential.password}<br>
            <button onclick="deleteCredential('${credential.id}')">Delete</button>
        `;
        credentialsList.appendChild(credentialItem);
    });
}

async function showCompanyList() {
    const response = await fetch('collectors');
    const companies = await response.json();

    const companyList = document.getElementById('companies');
    companyList.innerHTML = '';

    companies.forEach(company => {
        const companyItem = document.createElement('li');
        companyItem.className = 'company-item company-item-selectable';
        companyItem.innerHTML = `
            <img src="${company.logo}" alt="${company.name}" class="company-image">
            <div class="company-info">
                <h3>${company.name}</h3>
                <p>${company.description}</p>
            </div>
        `;
        companyItem.addEventListener('click', () => showAddCredentialForm(company));
        companyList.appendChild(companyItem);
    });

    document.getElementById('company-list').style.display = 'block';
    document.getElementById('add-credential-form-container').style.display = 'none';
}

function showAddCredentialForm(company) {
    // Hide the company list and show the add credential form
    document.getElementById('company-list').style.display = 'none';
    document.getElementById('add-credential-form-container').style.display = 'block';
    
    // Update the form with the company's information
    document.getElementById('company-logo').src = company.logo;
    document.getElementById('company-name').textContent = company.name;
    document.getElementById('company-description').textContent = company.description;
    document.getElementById('add-credential-form').dataset.key = company.key;


    // Add input fields
    const form = document.getElementById('add-credential-form');
    form.innerHTML = ''; // Clear any existing fields

    company.params.forEach(param => {
        // Add label
        const label = document.createElement('label');
        label.textContent = `${param.name} :`;

        if (param.mandatory) {
            const required = document.createElement('span');
            required.textContent = ' *';
            required.style.color = 'red';
            label.appendChild(required);
        }

        // Add input
        const input = document.createElement('input');
        if (param.name === 'password' || param.name === 'token') {
            input.setAttribute('type', 'password');
        } else {
            input.setAttribute('type', 'text');
        }
        input.setAttribute('id', param.name);
        input.setAttribute('name', param.name);
        input.placeholder = param.description;
        input.required = param.mandatory;

        form.appendChild(label);
        form.appendChild(input);
    });

    // Add the submit button
    const submitButton = document.createElement('button');
    submitButton.setAttribute('type', 'submit');
    submitButton.textContent = 'Add Credential';
    form.appendChild(submitButton);
}

async function addCredential(event) {
    event.preventDefault();

    const companyId = event.target.dataset.companyId;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    await fetch(`credential?token=${token}`, {
        method: 'POST',
        body: JSON.stringify({ companyId, username, password })
    });

    document.getElementById('add-credential-form').reset();
    document.getElementById('add-credential-form-container').style.display = 'none';
    loadCredentials();
}

async function deleteCredential(id) {
    await fetch(`credential/${id}?token=${token}`, {
        method: 'DELETE'
    });

    loadCredentials();
}
