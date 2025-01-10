<p align="center">
  <img width="100%" src="https://github.com/InvoiceCollector/InvoiceCollector/raw/master/images/preview/preview.svg" />
</p>

# Invoice Collector

Invoice Collector is a free docker image used to retrieve invoices and receipts from suppliers. It can connect to customer areas, APIs and inboxes to get the invoices.

## Prerequisits
- [Install docker engine](https://docs.docker.com/engine/install/)

## Installation

Use the [docker-compose.yml](https://github.com/InvoiceCollector/InvoiceCollector/blob/master/docker-compose.yml) file to build and run a container.

1. Download the `docker-compose.yml` file from Github repo.

```bash
curl https://raw.githubusercontent.com/InvoiceCollector/InvoiceCollector/refs/heads/master/docker-compose.yml >> docker-compose.yml
```

2. Edit the `docker-compose.yml` and set the values for the env variables:
    - `SECRET_MANAGER_BITWARDEN_ACCESS_TOKEN`
    - `SECRET_MANAGER_BITWARDEN_ORGANIZATION_ID`
    - `SECRET_MANAGER_BITWARDEN_PROJECT_ID`
    - `LOG_SERVER_ACCESS_TOKEN`

3. Build and run the container

```
# Run the container*
sudo docker compose up --build
```

<!-- ## Usage -->
## Contribution

There are two ways you can contribute to Invoice-Collector:
- [Open a new issue to report a bug are request a new feature](https://github.com/InvoiceCollector/InvoiceCollector/issues/new/choose)
- Create a new collector for the benefit of all

Here is how to run the docker container on your local machine.

```bash
# Clone the repo
git clone https://github.com/InvoiceCollector/InvoiceCollector.git

# Enter the folder
cd InvoiceCollector

# Create a .env file with your values
echo "SECRET_MANAGER_BITWARDEN_ACCESS_TOKEN=<TBD>" >> .env
echo "SECRET_MANAGER_BITWARDEN_ORGANIZATION_ID=<TBD>" >> .env
echo "SECRET_MANAGER_BITWARDEN_PROJECT_ID=<TBD>" >> .env
echo "LOG_SERVER_ACCESS_TOKEN=<TBD>" >> .env

# Run the debug container
docker-compose -f docker-compose-debug.yml up --build
```

<!-- ## FAQ -->
